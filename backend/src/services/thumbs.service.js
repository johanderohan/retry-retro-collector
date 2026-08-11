import sharp from 'sharp'
import { existsSync, mkdirSync } from 'node:fs'
import { join, basename } from 'node:path'

// Lista cerrada: sin ella, cualquiera podría llenar el disco pidiendo ?w=1,
// ?w=2, ?w=3… El frontend solo usa 320.
export const ANCHOS_PERMITIDOS = new Set([160, 320, 640])

function dirMiniaturas(coversDir) {
  const dir = join(coversDir, 'thumbs')
  mkdirSync(dir, { recursive: true })
  return dir
}

// Devuelve la ruta de la miniatura, generándola si aún no existe. null si el
// original no está.
export async function ensureThumb(coversDir, nombre, ancho) {
  // basename descarta cualquier '../': el nombre siempre queda dentro de
  // coversDir, aunque la petición intente escaparse.
  const seguro = basename(nombre)
  const original = join(coversDir, seguro)
  if (!existsSync(original)) return null

  const destino = join(dirMiniaturas(coversDir), `${ancho}-${seguro}`)
  if (existsSync(destino)) return destino

  await sharp(original)
    .resize({ width: ancho, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(destino)

  return destino
}

// Se monta en /covers ANTES de express.static: si no piden ancho, deja pasar y
// se sirve la imagen original de siempre.
export function thumbsMiddleware(coversDir) {
  return async function (req, res, next) {
    const ancho = Number(req.query?.w)
    if (!ancho || !ANCHOS_PERMITIDOS.has(ancho)) return next()

    try {
      const ruta = await ensureThumb(coversDir, req.path, ancho)
      if (!ruta) return next()

      res.type('image/webp')
      res.sendFile(ruta)
    } catch (e) {
      next(e)
    }
  }
}
