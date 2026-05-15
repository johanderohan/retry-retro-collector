import { processUpload, downloadAndProcess } from '../services/images.service.js'
import { COVERS_DIR } from '../config/migrations.js'

const OPTS = { dir: COVERS_DIR, urlPrefix: '/covers', w: 400, h: 560 }

export default {
  async upload(req, res, next) {
    try {
      const url = await processUpload(req, OPTS)
      res.json({ url })
    } catch (e) { next(e) }
  },
  async download(req, res, next) {
    try {
      const { url } = req.body || {}
      const saved = await downloadAndProcess(url, OPTS)
      res.json({ url: saved })
    } catch (e) { next(e) }
  },
}
