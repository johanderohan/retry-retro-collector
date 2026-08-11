import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyGameFilters, applySortToGames, filteredSortedGames } from '../src/utils/collection.js'

const JUEGOS = [
  { id: '1', title: 'Chrono Trigger', platform: 'Super Nintendo', regionLabel: 'Japón',  year: '1995', addedAt: 300 },
  { id: '2', title: 'Secret of Mana', platform: 'Super Nintendo', regionLabel: 'Europa', year: '1993', addedAt: 100 },
  { id: '3', title: 'Shenmue',        platform: 'Dreamcast',      regionLabel: 'Europa', year: '1999', addedAt: 200 },
]

const SIN_FILTRO = { platform: '', region: '', name: '' }

test('sin filtros salen todos', () => {
  assert.equal(applyGameFilters(JUEGOS, SIN_FILTRO).length, 3)
})

test('filtra por plataforma', () => {
  const out = applyGameFilters(JUEGOS, { ...SIN_FILTRO, platform: 'Dreamcast' })
  assert.deepEqual(out.map(g => g.id), ['3'])
})

test('filtra por región', () => {
  const out = applyGameFilters(JUEGOS, { ...SIN_FILTRO, region: 'Europa' })
  assert.deepEqual(out.map(g => g.id), ['2', '3'])
})

test('busca por título sin distinguir mayúsculas y por trozos', () => {
  assert.deepEqual(applyGameFilters(JUEGOS, { ...SIN_FILTRO, name: 'CHRONO' }).map(g => g.id), ['1'])
  assert.deepEqual(applyGameFilters(JUEGOS, { ...SIN_FILTRO, name: 'mana' }).map(g => g.id), ['2'])
  assert.deepEqual(applyGameFilters(JUEGOS, { ...SIN_FILTRO, name: '  she  '.trim() }).map(g => g.id), ['3'])
})

test('los filtros se combinan', () => {
  const out = applyGameFilters(JUEGOS, { platform: 'Super Nintendo', region: 'Europa', name: '' })
  assert.deepEqual(out.map(g => g.id), ['2'])
})

test('ordena por nombre, año y fecha en ambos sentidos', () => {
  assert.deepEqual(applySortToGames(JUEGOS, 'name-asc').map(g => g.id), ['1', '2', '3'])
  assert.deepEqual(applySortToGames(JUEGOS, 'name-desc').map(g => g.id), ['3', '2', '1'])
  assert.deepEqual(applySortToGames(JUEGOS, 'year-asc').map(g => g.id), ['2', '1', '3'])
  assert.deepEqual(applySortToGames(JUEGOS, 'date-desc').map(g => g.id), ['1', '3', '2'])
})

test('ordenar no muta la lista original', () => {
  const copia = [...JUEGOS]
  applySortToGames(JUEGOS, 'name-desc')
  assert.deepEqual(JUEGOS, copia)
})

test('filtrar y ordenar se aplican en ese orden', () => {
  const out = filteredSortedGames(JUEGOS, { ...SIN_FILTRO, region: 'Europa' }, 'name-asc')
  assert.deepEqual(out.map(g => g.id), ['2', '3'])
})

test('un juego sin título no rompe la búsqueda', () => {
  const con = [...JUEGOS, { id: '4', platform: 'PC', regionLabel: 'Europa', year: '2000' }]
  assert.doesNotThrow(() => applyGameFilters(con, { ...SIN_FILTRO, name: 'chrono' }))
})
