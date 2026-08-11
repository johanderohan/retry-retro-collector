import 'dotenv/config'
import express from 'express'
import apiRouter, { ssRouter } from './routes/index.js'
import { runStartupMigrations, COVERS_DIR, LOGOS_DIR } from './config/migrations.js'
import { initRedis } from './config/redis.js'
import { notFound, errorHandler } from './middleware/error.js'
import { thumbsMiddleware } from './services/thumbs.service.js'

const PORT = process.env.PORT || process.env.SERVER_PORT || 3001
const app = express()

// ── Middleware (orden crítico) ────────────────────────────────────────────────
// express.json NO consume el body cuando Content-Type es image/* → las subidas
// de /api/covers y /api/logos siguen leyendo el stream crudo.
app.use(express.json({ limit: '2mb' }))

// Servir portadas y logos subidos
// El middleware de miniaturas va delante: solo actúa si la petición trae ?w,
// y si no, deja que express.static sirva la imagen original.
app.use('/covers', thumbsMiddleware(COVERS_DIR), express.static(COVERS_DIR))
app.use('/logos',  express.static(LOGOS_DIR))

// API + proxy ScreenScraper (este último NO bajo /api)
app.use('/api', apiRouter)
app.use('/ss-api', ssRouter)

// Sin SPA fallback: el frontend lo sirve nginx.
app.use(notFound)
app.use(errorHandler)

async function bootstrap() {
  runStartupMigrations()
  await initRedis()
  app.listen(PORT, () => {
    console.log(`Retry server → http://localhost:${PORT}`)
  })
}

bootstrap()
