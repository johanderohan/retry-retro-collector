import { Router } from 'express'
import controller from '../controllers/config.controller.js'

const router = Router()
router.get('/', controller.get)
router.put('/', controller.put)

export default router
