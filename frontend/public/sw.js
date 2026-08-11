const CACHE_IMAGES = 'retry-images-v2'
const CACHE_STATIC = 'retry-static-v3'

// Cuánto se espera a la red antes de tirar de caché. Corto a propósito: fuera
// de casa el NAS no responde y la app no debe quedarse esperando.
const TIMEOUT_MS = 2000

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      // cache: 'reload' salta la caché HTTP del navegador: si no, el shell se
      // precachea con un index.html viejo y la app se queda anclada al bundle
      // anterior.
      .then(cache => cache.addAll(
        ['/', '/manifest.json', '/favicon.svg'].map(u => new Request(u, { cache: 'reload' })),
      ))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', e => {
  const valid = [CACHE_IMAGES, CACHE_STATIC]
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !valid.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  // Los datos viven en localStorage. Interceptar /api solo servía para hacer
  // esperar a la app a que la red fallase, y el fallback a [] la dejaba
  // pareciendo vacía en vez de sin conexión.
  if (url.pathname.startsWith('/api/')) return

  // Las carátulas (incluidas las miniaturas con ?w=) no cambian nunca.
  if (request.destination === 'image') {
    event.respondWith(cacheFirstImage(request))
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirstConTimeout(request))
  }
})

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

// Intenta la red con un límite de tiempo; si tarda o falla, tira de caché, y en
// una navegación cae al shell para que la SPA siempre arranque.
async function networkFirstConTimeout(request) {
  const cache = await caches.open(CACHE_STATIC)

  try {
    const ctrl = new AbortController()
    const temporizador = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const response = await fetch(request, { signal: ctrl.signal }).finally(() => clearTimeout(temporizador))

    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') return (await cache.match('/')) ?? Response.error()
    return Response.error()
  }
}
