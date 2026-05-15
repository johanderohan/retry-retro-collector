import { getConfig, saveConfig } from '../services/store.service.js'

export default {
  get(req, res, next) {
    try {
      res.json(getConfig())
    } catch (e) { next(e) }
  },
  put(req, res, next) {
    try {
      saveConfig(req.body)
      res.json({ ok: true })
    } catch (e) { next(e) }
  },
}
