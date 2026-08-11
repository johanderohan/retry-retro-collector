import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SNAPSHOT_KEY, isValidSnapshot, readSnapshot, writeSnapshot } from '../src/lib/storage.js'

// localStorage no existe en Node: los tests inyectan este doble.
function memoryStore(inicial = {}) {
  const m = new Map(Object.entries(inicial))
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  }
}

const SNAP = {
  generatedAt: '2026-08-11T18:00:00.000Z',
  collection: [], wishlist: [], platforms: [], config: {},
}

test('guardar y recuperar conserva los datos', () => {
  const store = memoryStore()
  assert.equal(writeSnapshot(SNAP, store), true)
  assert.deepEqual(readSnapshot(store), SNAP)
})

test('sin nada guardado devuelve null', () => {
  assert.equal(readSnapshot(memoryStore()), null)
})

test('un JSON corrupto se descarta en vez de reventar', () => {
  assert.equal(readSnapshot(memoryStore({ [SNAPSHOT_KEY]: '{"collection": [1,2' })), null)
})

test('un snapshot al que le falta una parte se rechaza', () => {
  assert.equal(isValidSnapshot({ collection: [], wishlist: [], platforms: [] }), false)
  assert.equal(isValidSnapshot(SNAP), true)
  assert.equal(readSnapshot(memoryStore({ [SNAPSHOT_KEY]: JSON.stringify({ collection: [] }) })), null)
})

test('si el almacenamiento está lleno, escribir devuelve false sin lanzar', () => {
  const store = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') } }
  assert.equal(writeSnapshot(SNAP, store), false)
})
