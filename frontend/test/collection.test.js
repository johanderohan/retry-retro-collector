import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyGameFilters, applySortToGames, filteredSortedGames,
  groupByPlatform, hasActiveGameFilters, isComplete,
} from '../src/utils/collection.js'

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

test('la búsqueda ignora las tildes en ambos sentidos', () => {
  const con = [...JUEGOS, { id: '5', title: 'Pokémon Rojo', platform: 'Game Boy', regionLabel: 'Europa' }]
  assert.deepEqual(applyGameFilters(con, { ...SIN_FILTRO, name: 'pokemon' }).map(g => g.id), ['5'])
  assert.deepEqual(applyGameFilters(con, { ...SIN_FILTRO, name: 'Shénmue' }).map(g => g.id), ['3'])
})

test('hay filtros activos si hay texto, plataforma o región', () => {
  assert.equal(hasActiveGameFilters(SIN_FILTRO), false)
  assert.equal(hasActiveGameFilters({ ...SIN_FILTRO, name: '  ' }), false)
  assert.equal(hasActiveGameFilters({ ...SIN_FILTRO, name: 'a' }), true)
  assert.equal(hasActiveGameFilters({ ...SIN_FILTRO, region: 'Europa' }), true)
})

test('un juego está completo con juego, manual y caja, o si es nuevo', () => {
  assert.equal(isComplete({ condition: { Juego: true, Manual: true, Caja: true } }), true)
  assert.equal(isComplete({ condition: { Juego: true, Manual: false, Caja: true } }), false)
  assert.equal(isComplete({ condition: { Nuevo: true } }), true)
  assert.equal(isComplete({}), false)
})

test('agrupa por plataforma: todas, ordenadas por tamaño y con sus cifras', () => {
  const grupos = groupByPlatform([
    ...JUEGOS,
    { id: '6', title: 'Sin consola', regionLabel: 'Europa', addedAt: 1 },
    { id: '7', title: 'Terranigma', platform: 'Super Nintendo', regionLabel: 'Europa', esSpanish: true, addedAt: 400,
      condition: { Juego: true, Manual: true, Caja: true } },
  ], { latest: 2 })
  assert.deepEqual(grupos.map(g => [g.name, g.count]), [['Super Nintendo', 3], ['Dreamcast', 1], ['Sin plataforma', 1]])
  const snes = grupos[0]
  assert.equal(snes.complete, 1)
  assert.deepEqual(snes.latest.map(g => g.id), ['7', '1'])
  assert.deepEqual(snes.regions, [
    { label: 'Japón', count: 1 }, { label: 'Europa', count: 1 }, { label: 'España', count: 1 },
  ])
  assert.equal(grupos[2].filterValue, '')
})
