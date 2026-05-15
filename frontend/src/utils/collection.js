// Filtro + orden de juegos — portado de App.jsx:143-168

export function applyGameFilters(items, f) {
  return items.filter(g => {
    if (f.platform && g.platform !== f.platform) return false
    if (f.region && g.regionLabel !== f.region) return false
    if (f.name.trim() && !(g.title || '').toLowerCase().includes(f.name.trim().toLowerCase())) return false
    return true
  })
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
