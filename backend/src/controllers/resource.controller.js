import { getAll, add, remove } from '../services/store.service.js'

// Crea los handlers CRUD para una tabla concreta.
export function makeResourceController(table) {
  return {
    list(req, res, next) {
      try {
        res.json(getAll(table))
      } catch (e) { next(e) }
    },
    create(req, res, next) {
      try {
        add(table, req.body)
        res.json({ ok: true })
      } catch (e) { next(e) }
    },
    remove(req, res, next) {
      try {
        remove(table, req.params.id)
        res.json({ ok: true })
      } catch (e) { next(e) }
    },
  }
}
