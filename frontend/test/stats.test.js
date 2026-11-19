import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  countBy, makerOf, formatOf, conditionState, conditionBreakdown, yearStats,
  sagaOf, sagaStats, addedByMonth, addedSince, duplicates, reviewList, summary, platformStats,
} from '../src/utils/stats.js'

const CIB = { Juego: true, Manual: true, Caja: true }
const JUEGOS = [
  { id: '1', title: 'Final Fantasy VI', platform: 'Super Nintendo', regionLabel: 'Japón', year: '1994', condition: CIB, coverUrl: '/covers/a.webp', addedAt: Date.UTC(2026, 4, 10) },
  { id: '2', title: 'Final Fantasy VII', platform: 'Playstation', regionLabel: 'Europa', esSpanish: true, year: '1997', condition: { Juego: true, Caja: true }, coverUrl: '/covers/b.webp', addedAt: Date.UTC(2026, 4, 20) },
  { id: '3', title: 'Pokémon Rojo', platform: 'Game Boy', regionLabel: 'Europa', year: '—', condition: { Juego: true }, addedAt: Date.UTC(2026, 6, 1) },
  { id: '4', title: 'The Legend of Zelda: Ocarina of Time', platform: 'Switch 2', regionLabel: 'Europa', year: '2026', condition: CIB, coverUrl: '/covers/c.webp', addedAt: Date.UTC(2026, 6, 2) },
  { id: '5', title: 'The Legend of Zelda: Ocarina of Time (Foil)', platform: 'Switch 2', regionLabel: 'Europa', year: '2026', condition: { Nuevo: true }, coverUrl: '/covers/c.webp', addedAt: Date.UTC(2026, 6, 3) },
  { id: '6', title: 'Shenmue', platform: 'Switxh', regionLabel: 'Europa', year: '1999', condition: { Juego: true, Manual: true }, coverUrl: '/covers/d.webp' },
]

test('countBy cuenta, ordena de mayor a menor e ignora los vacíos', () => {
  assert.deepEqual(countBy(JUEGOS, g => g.regionLabel), [{ label: 'Europa', value: 5 }, { label: 'Japón', value: 1 }])
  assert.deepEqual(countBy([{ a: '' }, { a: null }], x => x.a), [])
})

test('deduce fabricante y formato del nombre de la plataforma', () => {
  assert.equal(makerOf('Super Nintendo'), 'Nintendo')
  assert.equal(makerOf('Game Boy Advance'), 'Nintendo')
  assert.equal(makerOf('Playstation 2'), 'Sony')
  assert.equal(makerOf('PS Vita'), 'Sony')
  assert.equal(makerOf('Megadrive'), 'Sega')
  assert.equal(makerOf('PC Engine CD-Rom'), 'NEC')
  assert.equal(makerOf('Xbox 360'), 'Microsoft')
  assert.equal(makerOf('WonderSwan Color'), 'Bandai')
  assert.equal(makerOf('Cosa rara'), 'Otros')
  assert.equal(formatOf('Nintendo 3DS'), 'Portátil')
  assert.equal(formatOf('Switch 2'), 'Híbrida')
  assert.equal(formatOf('Saturn'), 'Sobremesa')
})

test('el estado es una categoría excluyente por juego', () => {
  assert.deepEqual(JUEGOS.map(conditionState),
    ['Completo', 'Sin manual', 'Solo el juego', 'Completo', 'Precintado', 'Sin caja'])
  const b = conditionBreakdown(JUEGOS)
  assert.equal(b.reduce((s, x) => s + x.value, 0), JUEGOS.length)
  assert.deepEqual(b.map(x => x.label), ['Precintado', 'Completo', 'Sin manual', 'Sin caja', 'Solo el juego'])
})

test('años: rango continuo, más antiguo, más reciente y sin fecha', () => {
  const y = yearStats(JUEGOS)
  assert.equal(y.years[0].year, 1994)
  assert.equal(y.years.at(-1).year, 2026)
  assert.equal(y.years.length, 33)
  assert.equal(y.oldest.id, '1')
  assert.equal(y.newest.year, '2026')
  assert.equal(y.undated, 1)
  assert.deepEqual(y.top, { year: 2026, value: 2 })
  assert.deepEqual(y.decades.map(d => d.label), ['Años 90', 'Años 20'])
  assert.equal(yearStats([]).oldest, null)
})

test('sagas: reconoce la franquicia sin tildes y solo lista las repetidas', () => {
  assert.equal(sagaOf('Pokémon Rojo'), 'Pokémon')
  assert.equal(sagaOf('Link no Bouken : The Legend of Zelda 2'), 'The Legend of Zelda')
  assert.equal(sagaOf('Shenmue'), 'Shenmue')
  assert.equal(sagaOf('Balatro'), null)
  assert.deepEqual(sagaStats(JUEGOS), [
    { label: 'Final Fantasy', value: 2 }, { label: 'The Legend of Zelda', value: 2 },
  ])
})

test('añadidos por mes rellena los meses vacíos', () => {
  const m = addedByMonth(JUEGOS)
  assert.deepEqual(m.map(x => x.value), [2, 0, 3])
  assert.equal(m[0].label, 'may 26')
  assert.equal(addedSince(JUEGOS, 30, Date.UTC(2026, 6, 10)), 3)
})

test('repetidos: agrupa copias del mismo título, incluida la edición Foil', () => {
  const d = duplicates(JUEGOS)
  assert.equal(d.length, 1)
  assert.equal(d[0].count, 2)
  assert.deepEqual(d[0].copies.map(g => g.id), ['4', '5'])
})

test('por revisar: sin año, sin portada y plataformas con un solo juego', () => {
  const r = reviewList(JUEGOS)
  assert.deepEqual(r.noYear.map(g => g.id), ['3'])
  assert.deepEqual(r.noCover.map(g => g.id), ['3'])
  assert.ok(r.lonePlatforms.includes('Switxh'))
  assert.ok(!r.lonePlatforms.includes('Switch 2'))
})

test('resumen y plataformas', () => {
  const s = summary(JUEGOS)
  assert.equal(s.total, 6)
  assert.equal(s.platforms, 5)
  assert.equal(s.complete, 3)
  assert.equal(s.completePct, 50)
  assert.equal(s.spanish, 1)
  assert.equal(s.japanese, 1)
  const p = platformStats(JUEGOS)
  assert.deepEqual(p[0], { label: 'Switch 2', value: 2, complete: 2, maker: 'Nintendo', format: 'Híbrida' })
})
