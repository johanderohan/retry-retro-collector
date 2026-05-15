import { Router } from 'express'
import screenscraper from '../controllers/screenscraper.controller.js'

const router = Router()
router.use(screenscraper)

export default router
