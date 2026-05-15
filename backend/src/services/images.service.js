import sharp from 'sharp'
import { join } from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_MAX = 5 * 1024 * 1024  // 5 MB
const REMOTE_MAX = 10 * 1024 * 1024 // 10 MB

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function readStream(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function toWebp(buffer, dir, w, h) {
  const filename = `${randomUUID()}.webp`
  const filepath = join(dir, filename)
  await sharp(buffer)
    .resize(w, h, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filepath)
  return filename
}

// Subida directa: lee el stream crudo de la request (Content-Type image/*).
// urlPrefix: '/covers' | '/logos'
export async function processUpload(req, { dir, urlPrefix, w, h }) {
  const contentType = req.headers['content-type'] || ''
  if (!contentType.startsWith('image/')) {
    throw new HttpError(400, 'Content-Type must be image/*')
  }

  const buffer = await readStream(req)
  if (buffer.length > UPLOAD_MAX) {
    throw new HttpError(413, 'Image too large (max 5 MB)')
  }

  try {
    const filename = await toWebp(buffer, dir, w, h)
    return `${urlPrefix}/${filename}`
  } catch {
    throw new HttpError(422, 'Could not process image')
  }
}

// Descarga una imagen remota, la procesa y la guarda localmente.
// Códigos byte-fieles al server original: missing url → 400; !upstream.ok →
// 502; buffer demasiado grande → 413; cualquier otro fallo (fetch de red,
// sharp) → 422.
export async function downloadAndProcess(url, { dir, urlPrefix, w, h }) {
  if (!url || typeof url !== 'string') {
    throw new HttpError(400, 'Missing url')
  }

  try {
    const upstream = await fetch(url)
    if (!upstream.ok) throw new HttpError(502, 'Could not fetch image')

    const buffer = Buffer.from(await upstream.arrayBuffer())
    if (buffer.length > REMOTE_MAX) {
      throw new HttpError(413, 'Image too large')
    }

    const filename = await toWebp(buffer, dir, w, h)
    return `${urlPrefix}/${filename}`
  } catch (e) {
    if (e instanceof HttpError) throw e
    throw new HttpError(422, 'Could not process image')
  }
}

export { HttpError }
