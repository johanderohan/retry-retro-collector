import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH   = join(__dirname, '../data/retry.db')

mkdirSync(join(__dirname, '../data'), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS collection (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS wishlist (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS playground (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS platforms (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

export function getAll(table) {
  return db
    .prepare(`SELECT data, created_at FROM ${table} ORDER BY created_at DESC`)
    .all()
    .map(r => {
      const obj = JSON.parse(r.data)
      // Expose the DB timestamp (Unix seconds → ms) so client-side date sorting works.
      // Only set if the game doesn't already have an addedAt stored in its JSON.
      if (!obj.addedAt) obj.addedAt = r.created_at * 1000
      return obj
    })
}

export function add(table, game) {
  db.prepare(`INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`)
    .run(game.id, JSON.stringify(game))
}

export function remove(table, id) {
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
}

export function getConfig() {
  const row = db.prepare(`SELECT value FROM config WHERE key = 'ss-config'`).get()
  return row ? JSON.parse(row.value) : {}
}

export function saveConfig(config) {
  db.prepare(`INSERT OR REPLACE INTO config (key, value) VALUES ('ss-config', ?)`)
    .run(JSON.stringify(config))
}
