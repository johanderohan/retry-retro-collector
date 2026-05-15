import { Router } from 'express'

// Construye un router CRUD estándar: GET / · POST / · DELETE /:id
export function resourceRouter(controller) {
  const router = Router()
  router.get('/', controller.list)
  router.post('/', controller.create)
  router.delete('/:id', controller.remove)
  return router
}
