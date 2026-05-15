import { getRedis, buildCacheKey, getTTL } from '../config/redis.js'

// Proxy a ScreenScraper con caché Redis. `path` ya viene despojado del
// prefijo /ss-api (p.ej. "/jeuRecherche.php"); `query` es el objeto req.query.
// Devuelve { status, body, fromCache }.
export async function proxyScreenScraper(path, query) {
  const target = `https://www.screenscraper.fr/api2${path}?${new URLSearchParams(query)}`
  const cacheKey = buildCacheKey(path, query)
  const ttl = getTTL(path)
  const redis = getRedis()

  // 1. Intentar servir desde caché
  if (redis) {
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        console.log(`[cache] HIT  ${path} → "${query.recherche || path}"`)
        return { status: 200, body: cached, fromCache: true }
      }
    } catch (e) {
      console.warn('[cache] Error leyendo caché:', e.message)
    }
  }

  // 2. Sin caché: llamar a ScreenScraper
  const upstream = await fetch(target)
  const body = await upstream.text()

  // 3. Guardar en caché si la respuesta fue OK
  if (redis && upstream.ok) {
    try {
      await redis.set(cacheKey, body, 'EX', ttl)
      console.log(`[cache] SET  ${path} → "${query.recherche || path}" (TTL ${ttl}s)`)
    } catch (e) {
      console.warn('[cache] Error escribiendo caché:', e.message)
    }
  }

  return { status: upstream.status, body, fromCache: false }
}
