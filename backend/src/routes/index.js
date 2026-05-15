import { Router } from 'express'
import collectionRoutes from './collection.routes.js'
import wishlistRoutes from './wishlist.routes.js'
import playgroundRoutes from './playground.routes.js'
import platformsRoutes from './platforms.routes.js'
import librosRoutes from './libros.routes.js'
import configRoutes from './config.routes.js'
import coversRoutes from './covers.routes.js'
import logosRoutes from './logos.routes.js'
import screenscraperRoutes from './screenscraper.routes.js'

// Router montado bajo /api
const apiRouter = Router()
apiRouter.get('/health', (req, res) => res.json({ ok: true }))
apiRouter.use('/collection', collectionRoutes)
apiRouter.use('/wishlist', wishlistRoutes)
apiRouter.use('/playground', playgroundRoutes)
apiRouter.use('/platforms', platformsRoutes)
apiRouter.use('/libros', librosRoutes)
apiRouter.use('/config', configRoutes)
apiRouter.use('/covers', coversRoutes)
apiRouter.use('/logos', logosRoutes)

// Router del proxy ScreenScraper — se monta en /ss-api (NO bajo /api)
export { screenscraperRoutes as ssRouter }
export default apiRouter
