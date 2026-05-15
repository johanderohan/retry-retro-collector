import { Router } from 'express'
import controller from '../controllers/covers.controller.js'

const router = Router()
router.post('/', controller.upload)
router.post('/download', controller.download)

export default router
