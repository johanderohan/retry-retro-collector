import express from 'express'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { getAll, add, remove, getConfig, saveConfig } from './db.js'
import Redis from 'ioredis'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const PORT       = process.env.SERVER_PORT || 3001
const COVERS_DIR = join(__dirname, '../data/covers')
const app        = express()

mkdirSync(COVERS_DIR, { recursive: true })

// ── Redis ─────────────────────────────────────────────────────────────────────
// TTL en segundos por tipo de endpoint
const TTL = {
  systemesListe: 86400,  // 24 h — la lista de plataformas cambia muy poco
  jeuRecherche:   3600,  // 1 h  — resultados de búsqueda de juegos
  default:        1800,  // 30 min para cualquier otro endpoint de la API
}

let redis = null

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
  })

  redis.on('connect', () => console.log('[cache] Redis conectado →', process.env.REDIS_URL))
  redis.on('error',   (e) => console.warn('[cache] Redis no disponible:', e.message))

  try {
    await redis.connect()
  } catch {
    console.warn('[cache] Redis no disponible al arrancar — se desactiva la caché')
    redis = null
  }
} else {
  console.log('[cache] REDIS_URL no definida — caché desactivada')
}

function getTTL(path) {
  if (path.includes('systemesListe')) return TTL.systemesListe
  if (path.includes('jeuRecherche'))  return TTL.jeuRecherche
  return TTL.default
}

// Elimina las credenciales de la clave de caché para que
// dos usuarios con distinto ssid/devid compartan el mismo resultado
function buildCacheKey(path, query) {
  const params = new URLSearchParams(query)
  params.delete('devid')
  params.delete('devpassword')
  params.delete('ssid')
  params.delete('sspassword')
  // Ordenar para que el orden de los parámetros no afecte a la clave
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
  return `ss:${path}:${new URLSearchParams(sorted).toString()}`
}

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json({ limit: '2mb' }))

// Serve built React app in production
app.use(express.static(join(__dirname, '../dist')))

// Serve uploaded covers
app.use('/covers', express.static(COVERS_DIR))

// ── Cover upload ────────────────────────────────────────────────────────────

app.post('/api/covers', async (req, res) => {
  const contentType = req.headers['content-type'] || ''
  if (!contentType.startsWith('image/')) {
    return res.status(400).json({ error: 'Content-Type must be image/*' })
  }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const buffer = Buffer.concat(chunks)

  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(413).json({ error: 'Image too large (max 5 MB)' })
  }

  const filename = `${randomUUID()}.webp`
  const filepath = join(COVERS_DIR, filename)

  try {
    await sharp(buffer)
      .resize(400, 560, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath)

    res.json({ url: `/covers/${filename}` })
  } catch {
    res.status(422).json({ error: 'Could not process image' })
  }
})

app.post('/api/covers/download', async (req, res) => {
  const { url } = req.body || {}
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url' })
  }

  try {
    const upstream = await fetch(url)
    if (!upstream.ok) return res.status(502).json({ error: 'Could not fetch image' })

    const buffer = Buffer.from(await upstream.arrayBuffer())

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'Image too large' })
    }

    const filename = `${randomUUID()}.webp`
    const filepath = join(COVERS_DIR, filename)

    await sharp(buffer)
      .resize(400, 560, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath)

    res.json({ url: `/covers/${filename}` })
  } catch {
    res.status(422).json({ error: 'Could not process image' })
  }
})

// ── Collection ───────────────────────────────────────────────────────────────

app.get('/api/collection', (req, res) => {
  res.json(getAll('collection'))
})

app.post('/api/collection', (req, res) => {
  add('collection', req.body)
  res.json({ ok: true })
})

app.delete('/api/collection/:id', (req, res) => {
  remove('collection', req.params.id)
  res.json({ ok: true })
})

// ── Wishlist ─────────────────────────────────────────────────────────────────

app.get('/api/wishlist', (req, res) => {
  res.json(getAll('wishlist'))
})

app.post('/api/wishlist', (req, res) => {
  add('wishlist', req.body)
  res.json({ ok: true })
})

app.delete('/api/wishlist/:id', (req, res) => {
  remove('wishlist', req.params.id)
  res.json({ ok: true })
})

// ── Playground ───────────────────────────────────────────────────────────────

app.get('/api/playground', (req, res) => {
  res.json(getAll('playground'))
})

app.post('/api/playground', (req, res) => {
  add('playground', req.body)
  res.json({ ok: true })
})

app.delete('/api/playground/:id', (req, res) => {
  remove('playground', req.params.id)
  res.json({ ok: true })
})

// ── Platforms ────────────────────────────────────────────────────────────────

app.get('/api/platforms', (req, res) => {
  res.json(getAll('platforms'))
})

app.post('/api/platforms', (req, res) => {
  add('platforms', req.body)
  res.json({ ok: true })
})

app.delete('/api/platforms/:id', (req, res) => {
  remove('platforms', req.params.id)
  res.json({ ok: true })
})

// ── Config ───────────────────────────────────────────────────────────────────

app.get('/api/config', (req, res) => {
  res.json(getConfig())
})

app.put('/api/config', (req, res) => {
  saveConfig(req.body)
  res.json({ ok: true })
})

// ── ScreenScraper proxy con caché Redis ──────────────────────────────────────

app.use('/ss-api', async (req, res) => {
  const target = `https://www.screenscraper.fr/api2${req.path}?${new URLSearchParams(req.query)}`
  const cacheKey = buildCacheKey(req.path, req.query)
  const ttl = getTTL(req.path)

  // 1. Intentar servir desde caché
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        console.log(`[cache] HIT  ${req.path} → "${req.query.recherche || req.path}"`)
        return res.type('application/json').send(cached)
      }
    } catch (e) {
      console.warn('[cache] Error leyendo caché:', e.message)
    }
  }

  // 2. Sin caché: llamar a ScreenScraper
  try {
    const upstream = await fetch(target)
    const body     = await upstream.text()

    // 3. Guardar en caché si la respuesta fue OK
    if (redis && upstream.ok) {
      try {
        await redis.set(cacheKey, body, 'EX', ttl)
        console.log(`[cache] SET  ${req.path} → "${req.query.recherche || req.path}" (TTL ${ttl}s)`)
      } catch (e) {
        console.warn('[cache] Error escribiendo caché:', e.message)
      }
    }

    res.status(upstream.status).type('application/json').send(body)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

// ── SPA fallback ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`Retry server → http://localhost:${PORT}`)
})
