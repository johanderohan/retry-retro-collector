const BASE_URL = '/ss-api'

function getCredentials() {
  return {
    devid: import.meta.env.VITE_SS_DEVID || '',
    devpassword: import.meta.env.VITE_SS_DEVPASSWORD || '',
    softname: import.meta.env.VITE_SS_SOFTNAME || 'retro-search',
    ssid: import.meta.env.VITE_SS_SSID || '',
    sspassword: import.meta.env.VITE_SS_SSPASSWORD || '',
  }
}

function buildParams(extra = {}) {
  const creds = getCredentials()
  const params = new URLSearchParams({
    devid: creds.devid,
    devpassword: creds.devpassword,
    softname: creds.softname,
    output: 'json',
    ...extra,
  })
  if (creds.ssid) params.set('ssid', creds.ssid)
  if (creds.sspassword) params.set('sspassword', creds.sspassword)
  return params
}

export async function searchGames(query) {
  const params = buildParams({ recherche: query })
  const response = await fetch(`${BASE_URL}/jeuRecherche.php?${params}`)
  if (!response.ok) {
    throw new Error(`ScreenScraper API error: ${response.status}`)
  }
  const data = await response.json()
  return parseSearchResults(data)
}

function getName(noms) {
  if (!noms || noms.length === 0) return 'Sin título'
  const world = noms.find((n) => n.region === 'wor')
  const us = noms.find((n) => n.region === 'us')
  const eu = noms.find((n) => n.region === 'eu')
  return (world || us || eu || noms[0])?.text || 'Sin título'
}

function getRegion(noms) {
  if (!noms || noms.length === 0) return '—'
  const world = noms.find((n) => n.region === 'wor')
  if (world) return 'Mundial'
  const regions = [...new Set(noms.map((n) => regionLabel(n.region)))]
  return regions.join(', ')
}

function regionLabel(code) {
  const map = {
    wor: 'Mundial',
    us: 'USA',
    eu: 'Europa',
    jp: 'Japón',
    fr: 'Francia',
    de: 'Alemania',
    es: 'España',
    br: 'Brasil',
    au: 'Australia',
    kr: 'Corea',
    ss: 'ScreenScraper',
  }
  return map[code] || code?.toUpperCase() || '—'
}

function getYear(dates) {
  if (!dates || dates.length === 0) return '—'
  const world = dates.find((d) => d.region === 'wor')
  const us = dates.find((d) => d.region === 'us')
  const entry = (world || us || dates[0])?.text || ''
  return entry.split('-')[0] || '—'
}

const COVER_TYPES = [
  { type: 'box-2D',      label: 'Caja' },
  { type: 'box-2D-back', label: 'Reverso' },
  { type: 'box-3D',      label: 'Caja 3D' },
  { type: 'mixrbv2',     label: 'Mix v2' },
  { type: 'mixrbv1',     label: 'Mix v1' },
  { type: 'ss',          label: 'Captura' },
  { type: 'fanart',      label: 'Fan art' },
]

function getAllCovers(medias) {
  if (!medias || medias.length === 0) return []
  const seen = new Set()
  const covers = []
  for (const { type, label } of COVER_TYPES) {
    const match = medias.find((m) => m.type === type)
    if (match?.url && !seen.has(match.url)) {
      seen.add(match.url)
      covers.push({ url: match.url, type, label })
    }
  }
  return covers
}

function getPlatforms(systemes) {
  if (!systemes || systemes.length === 0) return ['—']
  return systemes.map((s) => s.text || s.noms?.[0]?.text || '—')
}

function parseSearchResults(data) {
  const jeux = data?.response?.jeux
  if (!jeux || !Array.isArray(jeux)) return []

  return jeux.map((jeu) => {
    const coverUrls = getAllCovers(jeu.medias)
    return {
      id: jeu.id,
      title: getName(jeu.noms),
      region: getRegion(jeu.noms),
      year: getYear(jeu.dates),
      platforms: getPlatforms(jeu.systeme ? [jeu.systeme] : []),
      coverUrl: coverUrls[0]?.url || null,
      coverUrls,
      romId: jeu.romid,
    }
  })
}
