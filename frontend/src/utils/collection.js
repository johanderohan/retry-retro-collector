// Filtro + orden de juegos — portado de App.jsx:143-168

// Minúsculas y sin tildes: en la tienda se teclea «pokemon», no «Pokémon».
export function normalizeText(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function applyGameFilters(items, f) {
  const name = normalizeText(f.name).trim()
  return items.filter(g => {
    if (f.platform && g.platform !== f.platform) return false
    if (f.region && g.regionLabel !== f.region) return false
    if (name && !normalizeText(g.title).includes(name)) return false
    return true
  })
}

export function hasActiveGameFilters(f) {
  return !!(f.name.trim() || f.platform || f.region)
}

export function isComplete(g) {
  const c = g.condition
  return !!c && (!!c.Nuevo || (!!c.Juego && !!c.Manual && !!c.Caja))
}

export const displayRegion = g => (g.esSpanish ? 'España' : (g.regionLabel || '—'))

// Agrupa la colección por plataforma para la portada «Mis consolas»:
// las más pobladas primero, con sus cifras y sus últimas portadas.
export function groupByPlatform(items, { latest = 12 } = {}) {
  const map = new Map()
  for (const g of items) {
    const name = g.platform || 'Sin plataforma'
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(g)
  }
  return [...map.entries()]
    .map(([name, games]) => {
      const regions = new Map()
      for (const g of games) regions.set(displayRegion(g), (regions.get(displayRegion(g)) || 0) + 1)
      return {
        name,
        filterValue: games[0].platform || '',
        count: games.length,
        complete: games.filter(isComplete).length,
        regions: [...regions.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count })),
        latest: [...games].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).slice(0, latest),
      }
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
}

export function applySortToGames(items, sort) {
  const arr = [...items]
  const toYear = g => parseInt(g.year) || 0
  switch (sort) {
    case 'date-desc': return arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    case 'date-asc':  return arr.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0))
    case 'name-asc':  return arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' }))
    case 'name-desc': return arr.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'es', { sensitivity: 'base' }))
    case 'year-asc':  return arr.sort((a, b) => toYear(a) - toYear(b))
    case 'year-desc': return arr.sort((a, b) => toYear(b) - toYear(a))
    default:          return arr
  }
}

export function filteredSortedGames(items, filters, sort) {
  return applySortToGames(applyGameFilters(items, filters), sort)
}
