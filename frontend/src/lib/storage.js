export const SNAPSHOT_KEY = 'retry.snapshot'

function defaultStore() {
  return typeof globalThis !== 'undefined' ? globalThis.localStorage : null
}

// Sirve solo si trae las cuatro partes. Uno a medias haría fallar las pantallas
// más adelante de formas raras.
export function isValidSnapshot(value) {
  return Boolean(
    value &&
    Array.isArray(value.collection) &&
    Array.isArray(value.wishlist) &&
    Array.isArray(value.platforms) &&
    value.config && typeof value.config === 'object',
  )
}

export function readSnapshot(store) {
  try {
    const raw = (store ?? defaultStore())?.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidSnapshot(parsed) ? parsed : null
  } catch {
    // JSON a medias o almacenamiento inaccesible: se empieza de cero en vez de
    // impedir que la app arranque.
    return null
  }
}

export function writeSnapshot(snapshot, store) {
  try {
    (store ?? defaultStore())?.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
    return true
  } catch {
    // Cuota llena o modo privado: no es motivo para romper la app.
    return false
  }
}
