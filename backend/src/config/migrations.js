import { mkdirSync } from 'fs'
import { join } from 'path'
import { DATA_DIR } from './db.js'

// Idempotente: garantiza la estructura de carpetas de datos.
// No migra esquema — las tablas las crea config/db.js al importarse.
export function runStartupMigrations() {
  mkdirSync(DATA_DIR, { recursive: true })
  mkdirSync(join(DATA_DIR, 'covers'), { recursive: true })
  mkdirSync(join(DATA_DIR, 'logos'),  { recursive: true })
}

export const COVERS_DIR = join(DATA_DIR, 'covers')
export const LOGOS_DIR  = join(DATA_DIR, 'logos')
