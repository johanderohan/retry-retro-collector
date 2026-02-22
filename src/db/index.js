// ── API client — habla con el servidor Express/better-sqlite3 ─────────────────

export async function dbGetAll(table) {
  const res = await fetch(`/api/${table}`)
  if (!res.ok) throw new Error(`Error cargando ${table}`)
  return res.json()
}

export async function dbAdd(table, game) {
  const res = await fetch(`/api/${table}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(game),
  })
  if (!res.ok) throw new Error(`Error guardando en ${table}`)
}

export async function dbRemove(table, id) {
  const res = await fetch(`/api/${table}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Error eliminando de ${table}`)
}

export async function configLoad() {
  try {
    const res = await fetch('/api/config')
    if (!res.ok) return {}
    return res.json()
  } catch {
    return {}
  }
}

export async function configSave(config) {
  await fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
}
