import Redis from 'ioredis'

// TTL en segundos por tipo de endpoint
const TTL = {
  systemesListe: 86400,  // 24 h — la lista de plataformas cambia muy poco
  jeuRecherche:   3600,  // 1 h  — resultados de búsqueda de juegos
  default:        1800,  // 30 min para cualquier otro endpoint de la API
}

let redis = null

export async function initRedis() {
  if (!process.env.REDIS_URL) {
    console.log('[cache] REDIS_URL no definida — caché desactivada')
    return null
  }

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
  return redis
}

export function getRedis() {
  return redis
}

export function getTTL(path) {
  if (path.includes('systemesListe')) return TTL.systemesListe
  if (path.includes('jeuRecherche'))  return TTL.jeuRecherche
  return TTL.default
}

// Elimina las credenciales de la clave de caché para que
// dos usuarios con distinto ssid/devid compartan el mismo resultado
export function buildCacheKey(path, query) {
  const params = new URLSearchParams(query)
  params.delete('devid')
  params.delete('devpassword')
  params.delete('ssid')
  params.delete('sspassword')
  // Ordenar para que el orden de los parámetros no afecte a la clave
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
  return `ss:${path}:${new URLSearchParams(sorted).toString()}`
}
