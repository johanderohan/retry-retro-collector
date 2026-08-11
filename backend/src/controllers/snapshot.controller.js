import { getAll, getConfig } from '../services/store.service.js'

// coverUrls son las portadas alternativas que devuelve ScreenScraper al añadir
// un juego. Pesan 4,1 MB de los 4,5 que ocupa la colección y no las lee nadie:
// su único consumidor, AddToCollectionModal, recibe el juego desde los
// resultados de búsqueda, no desde la base. Fuera del snapshot.
function sinCoverUrls(juego) {
  const { coverUrls, ...resto } = juego
  return resto
}

export default {
  get(req, res, next) {
    try {
      res.json({
        generatedAt: new Date().toISOString(),
        collection: getAll('collection').map(sinCoverUrls),
        wishlist: getAll('wishlist').map(sinCoverUrls),
        platforms: getAll('platforms'),
        config: getConfig(),
      })
    } catch (e) { next(e) }
  },
}
