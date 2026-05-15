const CACHE_IMAGES  = 'retry-images-v1'
const CACHE_STATIC  = 'retry-static-v1'
const CACHE_API     = 'retry-api-v1'

// Rutas de API que se cachean para consulta offline
const API_PATHS = [
  '/api/collection',
  '/api/wishlist',
  '/api/playground',
  '/api/platforms',
  '/api/config',
]

// ── Install: cachea el shell mínimo de la app ─────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(['/', '/manifest.json', '/favicon.svg']))
      .then(() => self.skipWaiting())
  )
})

// ── Activate: limpia cachés obsoletas ─────────────────────────────────────────
self.addEventListener('activate', e => {
  const valid = [CACHE_IMAGES, CACHE_STATIC, CACHE_API]
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !valid.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Solo peticiones GET
  if (request.method !== 'GET') return

  // Imágenes (same-origin y cross-origin): cache-first
  if (request.destination === 'image') {
    event.respondWith(cacheFirstImage(request))
    return
  }

  // API de datos (colección, wishlist, etc.): network-first → caché offline
  if (url.pathname.startsWith('/api/') && API_PATHS.includes(url.pathname)) {
    event.respondWith(networkFirstAPI(request))
    return
  }

  // App shell y assets estáticos (JS, CSS, HTML): network-first → caché offline
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirstStatic(request))
  }
})

// ── Estrategias ───────────────────────────────────────────────────────────────

async function cacheFirstImage(request) {
  const cache = await caches.open(CACHE_IMAGES)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
    return response
  } catch {
    return Response.error()
  }
}

async function networkFirstAPI(request) {
  const cache = await caches.open(CACHE_API)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    // Sin red: servir desde caché o devolver array vacío como fallback
    const cached = await cache.match(request)
    return cached ?? new Response('[]', { headers: { 'Content-Type': 'application/json' } })
  }
}

async function networkFirstStatic(request) {
  const cache = await caches.open(CACHE_STATIC)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    // Sin red: caché del asset específico o del shell (index.html para SPA)
    return (await cache.match(request)) ?? (await cache.match('/')) ?? Response.error()
  }
}
