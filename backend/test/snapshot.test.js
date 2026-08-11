import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getAll, add, remove, saveConfig } from '../src/services/store.service.js'
import snapshotController from '../src/controllers/snapshot.controller.js'

function limpiar() {
  for (const tabla of ['collection', 'wishlist', 'platforms']) {
    for (const item of getAll(tabla)) remove(tabla, item.id)
  }
}

function juego(id, extra = {}) {
  return {
    id,
    gameId: `g-${id}`,
    title: `Juego ${id}`,
    platform: 'Super Nintendo',
    regionLabel: 'Europa',
    year: '1995',
    coverUrl: `/covers/${id}.webp`,
    coverUrls: [
      { url: `/covers/${id}.webp`, label: 'Portada' },
      { url: 'https://screenscraper.fr/otra.png', label: 'Alternativa' },
    ],
    condition: { Juego: true, Caja: true, Manual: false },
    ...extra,
  }
}

function capturar() {
  let body = null
  return { res: { json: b => { body = b } }, get: () => body }
}

test('devuelve las cuatro partes y la marca de tiempo', () => {
  limpiar()
  add('collection', juego('c1'))
  add('wishlist', juego('w1'))
  add('platforms', { id: 'p1', name: 'Super Nintendo' })
  saveConfig({ devid: 'x', devpassword: 'y' })

  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })
  const snap = c.get()

  assert.equal(snap.collection.length, 1)
  assert.equal(snap.wishlist.length, 1)
  assert.equal(snap.platforms.length, 1)
  assert.equal(snap.config.devid, 'x')
  assert.ok(snap.generatedAt)
})

test('ningún juego lleva coverUrls', () => {
  limpiar()
  add('collection', juego('c1'))
  add('wishlist', juego('w1'))

  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })
  const snap = c.get()

  assert.equal('coverUrls' in snap.collection[0], false)
  assert.equal('coverUrls' in snap.wishlist[0], false)
})

test('conserva el resto de campos, incluido el estado y la carátula usada', () => {
  limpiar()
  add('collection', juego('c1'))

  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })
  const g = c.get().collection[0]

  assert.equal(g.title, 'Juego c1')
  assert.equal(g.coverUrl, '/covers/c1.webp')
  assert.deepEqual(g.condition, { Juego: true, Caja: true, Manual: false })
  assert.equal(g.platform, 'Super Nintendo')
})

test('el número de juegos coincide con el del listado normal', () => {
  limpiar()
  for (let i = 0; i < 5; i++) add('collection', juego(`c${i}`))

  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })

  assert.equal(c.get().collection.length, getAll('collection').length)
})

test('con la base vacía devuelve listas vacías, no errores', () => {
  limpiar()
  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })
  const snap = c.get()

  assert.deepEqual(snap.collection, [])
  assert.deepEqual(snap.wishlist, [])
})
