import { proxyScreenScraper } from '../services/screenscraper.service.js'

export default async function screenscraper(req, res) {
  try {
    const { status, body } = await proxyScreenScraper(req.path, req.query)
    res.status(status).type('application/json').send(body)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
}
