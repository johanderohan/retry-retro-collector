// Ancho que usa la rejilla. El backend solo acepta 160, 320 y 640.
// 160 y no 320: la carátula se pinta en una caja de 80 px CSS, el original solo
// mide 400 px de ancho, y a 320 las 702 ocuparían 17 MB en vez de 6,7.
export const ANCHO_MINIATURA = 160

// Las carátulas locales viven en /covers/<uuid>.webp y aceptan ?w=. Las que
// no lo son (URLs remotas de ScreenScraper, aún sin descargar) se dejan tal
// cual.
export function thumbUrl(coverUrl, ancho = ANCHO_MINIATURA) {
  if (!coverUrl || !coverUrl.startsWith('/covers/')) return coverUrl
  return `${coverUrl}?w=${ancho}`
}
