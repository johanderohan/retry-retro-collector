// Cálculos de la página de Estadísticas. Funciones puras: reciben las listas
// de los stores y devuelven datos listos para pintar.
import { displayRegion, isComplete, normalizeText } from './collection.js'

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)

// [{ label, value }] ordenado de mayor a menor (y alfabético en los empates).
export function countBy(items, keyFn) {
  const m = new Map()
  for (const it of items) {
    const k = keyFn(it)
    if (k == null || k === '') continue
    m.set(k, (m.get(k) || 0) + 1)
  }
  return [...m.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || String(a.label).localeCompare(String(b.label), 'es'))
}

// ── Fabricante y formato, deducidos del nombre de la plataforma ─────────────
const MAKERS = [
  ['Nintendo', /nintendo|game ?boy|switch|\bwii|gamecube|\bnes\b|famicom|family computer|virtual boy|pok[eé]mon mini/i],
  ['Sony', /playstation|\bpsp\b|ps ?vita|\bps[1-5]\b/i],
  ['Sega', /mega ?drive|mega-?cd|master system|saturn|dreamcast|game gear|genesis|sega|32x/i],
  ['Microsoft', /xbox/i],
  ['NEC', /pc engine|turbografx|pc-fx|supergrafx/i],
  ['Bandai', /wonderswan|playdia/i],
  ['SNK', /neo ?geo/i],
  ['Atari', /atari|lynx|jaguar/i],
  ['Blaze', /evercade/i],
]
export function makerOf(platform) {
  const hit = MAKERS.find(([, re]) => re.test(platform || ''))
  return hit ? hit[0] : 'Otros'
}

export function formatOf(platform) {
  const p = platform || ''
  if (/switch/i.test(p)) return 'Híbrida'
  if (/game ?boy|\bds\b|3ds|\bpsp\b|vita|game gear|wonderswan|pok[eé]mon mini|lynx|neo ?geo pocket|evercade/i.test(p)) return 'Portátil'
  return 'Sobremesa'
}

// ── Estado: categorías excluyentes, de mejor a peor ─────────────────────────
export const CONDITION_STATES = ['Precintado', 'Completo', 'Sin manual', 'Sin caja', 'Solo el juego', 'Otros']
export function conditionState(g) {
  const c = g.condition || {}
  if (c.Nuevo) return 'Precintado'
  if (c.Juego && c.Manual && c.Caja) return 'Completo'
  if (c.Juego && c.Caja) return 'Sin manual'
  if (c.Juego && c.Manual) return 'Sin caja'
  if (c.Juego) return 'Solo el juego'
  return 'Otros'
}
export function conditionBreakdown(items) {
  const counts = Object.fromEntries(CONDITION_STATES.map(s => [s, 0]))
  for (const g of items) counts[conditionState(g)]++
  return CONDITION_STATES
    .map(label => ({ label, value: counts[label], pct: pct(counts[label], items.length) }))
    .filter(s => s.value > 0)
}

// ── Años de lanzamiento ─────────────────────────────────────────────────────
const yearOf = g => {
  const y = parseInt(g.year, 10)
  return y >= 1970 && y <= 2100 ? y : null
}
export function yearStats(items) {
  const dated = items.filter(g => yearOf(g) !== null)
  if (!dated.length) return { years: [], decades: [], oldest: null, newest: null, top: null, undated: items.length, max: 0 }
  const byYear = new Map()
  for (const g of dated) byYear.set(yearOf(g), (byYear.get(yearOf(g)) || 0) + 1)
  const min = Math.min(...byYear.keys())
  const max = Math.max(...byYear.keys())
  const years = []
  for (let y = min; y <= max; y++) years.push({ year: y, value: byYear.get(y) || 0 })
  const sorted = [...dated].sort((a, b) => yearOf(a) - yearOf(b) || (a.title || '').localeCompare(b.title || '', 'es'))
  return {
    years,
    max: Math.max(...years.map(y => y.value)),
    decades: countBy(dated, g => `${Math.floor(yearOf(g) / 10) * 10}`)
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(d => ({ ...d, label: `Años ${d.label.slice(2)}` })),
    oldest: sorted[0],
    newest: sorted[sorted.length - 1],
    top: [...years].sort((a, b) => b.value - a.value)[0],
    undated: items.length - dated.length,
  }
}

// ── Sagas: por palabras clave en el título ──────────────────────────────────
const SAGAS = [
  ['Final Fantasy', /final fantasy/], ['Dragon Quest', /dragon quest/], ['The Legend of Zelda', /zelda|link no bouken/],
  ['Super Mario', /\bmario\b/], ['Pokémon', /pokemon|pokken/], ['Sonic', /\bsonic\b/], ['Mega Man', /mega ?man|rockman/],
  ['Fire Emblem', /fire emblem/], ['Kirby', /kirby/], ['Metal Gear', /metal gear/], ['Castlevania', /castlevania|akumajou/],
  ['Tales of', /\btales of\b/], ['Resident Evil', /resident evil|biohazard/], ['Street Fighter', /street fighter/],
  ['Megami Tensei / Persona', /megami tensei|persona|raidou|devil summoner|soul hackers/], ['Kingdom Hearts', /kingdom hearts/],
  ['Xeno', /xenoblade|xenogears|xenosaga/], ['Ace Attorney', /ace attorney|gyakuten/], ['Monster Hunter', /monster hunter/],
  ['Metroid', /metroid/], ['Donkey Kong', /donkey kong/], ['Dragon Ball', /dragon ball/], ['Yakuza', /yakuza|ryu ga gotoku|like a dragon/],
  ['Silent Hill', /silent hill/], ['Star Ocean', /star ocean/], ['Digimon', /digimon/], ['Suikoden', /suikoden/],
  ['Mana', /\bmana\b|seiken densetsu/], ['Chrono', /chrono (trigger|cross)/], ['Trails / Kiseki', /trails (in|of|to|from|through|into)|kiseki/],
  ['Shinobi', /shinobi/], ['Phantasy Star', /phantasy star/], ['Yoshi', /yoshi/], ['Wario', /wario/],
  ['Animal Crossing', /animal crossing/], ['Octopath Traveler', /octopath/], ['Bravely', /bravely/], ['.hack', /\.hack/],
  ['Professor Layton', /layton/], ['Golden Sun', /golden sun/], ['Breath of Fire', /breath of fire/], ['SaGa', /\bsaga\b(?! of)|romancing/],
  ['Wonder Boy', /wonder boy|monster world/], ['Streets of Rage', /streets of rage|bare knuckle/], ['Tekken', /tekken/],
  ['Gran Turismo', /gran turismo/], ['Tomb Raider', /tomb raider/], ['Crash Bandicoot', /crash bandicoot/], ['Danganronpa', /danganronpa/],
  ['Ys', /\bys\b/], ['Shenmue', /shenmue/], ['Doraemon', /doraemon/], ['Sailor Moon', /sailor moon/],
]
export function sagaOf(title) {
  const t = normalizeText(title)
  const hit = SAGAS.find(([, re]) => re.test(t))
  return hit ? hit[0] : null
}
export const sagaStats = items => countBy(items, g => sagaOf(g.title)).filter(s => s.value > 1)

// ── Ritmo: añadidos por mes ─────────────────────────────────────────────────
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export function addedByMonth(items) {
  const m = new Map()
  for (const g of items) {
    if (!g.addedAt) continue
    const d = new Date(g.addedAt)
    const key = d.getFullYear() * 12 + d.getMonth()
    m.set(key, (m.get(key) || 0) + 1)
  }
  if (!m.size) return []
  const min = Math.min(...m.keys())
  const max = Math.max(...m.keys())
  const out = []
  for (let k = min; k <= max; k++) {
    out.push({ label: `${MESES[k % 12]} ${String(Math.floor(k / 12)).slice(2)}`, value: m.get(k) || 0 })
  }
  return out
}
export function addedSince(items, days, now = Date.now()) {
  const from = now - days * 86400_000
  return items.filter(g => g.addedAt && g.addedAt >= from).length
}

// ── Repetidos: el mismo título más de una vez ───────────────────────────────
export function duplicates(items) {
  const m = new Map()
  for (const g of items) {
    const k = normalizeText(g.title).replace(/\s*\((foil|platinum|platino)\)\s*$/, '').trim()
    if (!k) continue
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(g)
  }
  return [...m.values()]
    .filter(copies => copies.length > 1)
    .map(copies => ({ title: copies[0].title, count: copies.length, copies }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'es'))
}

// ── Por revisar: datos incompletos o sospechosos ────────────────────────────
export function reviewList(items) {
  const perPlatform = countBy(items, g => g.platform)
  return {
    noYear: items.filter(g => yearOf(g) === null),
    noCover: items.filter(g => !g.coverUrl),
    noPlatform: items.filter(g => !g.platform),
    // Una plataforma con un solo juego suele ser legítima, pero también es
    // donde aparecen las erratas («Switxh»).
    lonePlatforms: perPlatform.filter(p => p.value === 1).map(p => p.label),
  }
}

// ── Resumen general ─────────────────────────────────────────────────────────
export function summary(items) {
  const total = items.length
  const complete = items.filter(isComplete).length
  const spanish = items.filter(g => g.esSpanish).length
  const japanese = items.filter(g => displayRegion(g) === 'Japón').length
  return {
    total,
    platforms: new Set(items.map(g => g.platform).filter(Boolean)).size,
    complete, completePct: pct(complete, total),
    spanish, spanishPct: pct(spanish, total),
    japanese, japanesePct: pct(japanese, total),
    platino: items.filter(g => g.isPlatino).length,
    extras: items.filter(g => g.condition?.Otros).length,
    playing: items.filter(g => g.inPlayground).length,
  }
}

export function platformStats(items) {
  const complete = new Map()
  for (const g of items) if (isComplete(g)) complete.set(g.platform, (complete.get(g.platform) || 0) + 1)
  return countBy(items, g => g.platform).map(p => ({
    ...p,
    complete: complete.get(p.label) || 0,
    maker: makerOf(p.label),
    format: formatOf(p.label),
  }))
}
