// ── ScreenScraper helpers — portado byte-fiel de App.jsx:1048-1203 ──────────
import {
  REGION_MAP, COVER_TYPES, ALL_COVER_TYPES, COVER_TYPE_LABELS,
  SYSTEMS_CACHE_KEY, SYSTEMS_CACHE_TTL,
} from './constants.js'

function parseSystemName(s) {
  const noms = s.noms
  if (!noms || typeof noms !== 'object' || Array.isArray(noms)) return ''
  return noms.nom_eu || noms.nom_us || noms.noms_commun?.split(',')[0]?.trim() ||
         noms.nom_launchbox || noms.nom_hyperspin || ''
}
function parseSystemCompany(s) { return s.compagnie || '' }
function parseSystemLogo(medias) {
  if (!Array.isArray(medias)) return null
  return (
    medias.find(m => m.type === 'logo-monochrome' && m.region === 'wor')?.url ||
    medias.find(m => m.type === 'logo-monochrome')?.url ||
    medias.find(m => m.type === 'wheel' && m.format === 'png')?.url ||
    medias.find(m => m.type === 'icon')?.url ||
    medias.find(m => m.type === 'photo' && m.region === 'wor')?.url ||
    medias.find(m => m.type === 'photo')?.url || null
  )
}

export async function fetchAllSystems(config) {
  // Intentar servir desde localStorage
  try {
    const raw = localStorage.getItem(SYSTEMS_CACHE_KEY)
    if (raw) {
      const { ts, data } = JSON.parse(raw)
      if (Date.now() - ts < SYSTEMS_CACHE_TTL) return data
    }
  } catch { /* caché corrupta, se ignora */ }

  const params = new URLSearchParams({
    devid: config.devid || '', devpassword: config.devpassword || '',
    softname: config.softname || 'retro-search', output: 'json',
  })
  if (config.ssid)       params.set('ssid',       config.ssid)
  if (config.sspassword) params.set('sspassword', config.sspassword)
  const res = await fetch(`/ss-api/systemesListe.php?${params}`)
  if (!res.ok) throw new Error(`Error ${res.status} de la API`)
  const data = await res.json()
  const systemes = data?.response?.systemes
  if (!Array.isArray(systemes)) throw new Error('Respuesta inesperada de ScreenScraper')
  const systems = systemes.map(s => {
    const noms = s.noms || {}
    return {
      id: String(s.id), name: parseSystemName(s),
      aliases: [noms.nom_launchbox, noms.nom_hyperspin, noms.noms_commun].filter(Boolean).join(',').toLowerCase(),
      type: s.type || '', company: parseSystemCompany(s),
      yearStart: s.datedebut || '', yearEnd: s.datefin || '',
      logoUrl: parseSystemLogo(s.medias),
    }
  }).filter(s => s.name)

  try { localStorage.setItem(SYSTEMS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: systems })) } catch { /* quota */ }

  return systems
}

export async function searchGames(query, config, systemeid = '') {
  function buildParams(page = 1) {
    const p = new URLSearchParams({
      devid: config.devid || '', devpassword: config.devpassword || '',
      softname: config.softname || 'retro-search', output: 'json',
      recherche: query, numpage: String(page),
    })
    if (config.ssid)       p.set('ssid',       config.ssid)
    if (config.sspassword) p.set('sspassword', config.sspassword)
    if (systemeid)         p.set('systemeid',  systemeid)
    return p
  }

  async function fetchPage(page) {
    let response
    try { response = await fetch(`/ss-api/jeuRecherche.php?${buildParams(page)}`) }
    catch (e) { throw new Error(`No se pudo conectar con ScreenScraper: ${e.message}`) }
    if (!response.ok) { const text = await response.text(); throw new Error(`Error ${response.status} de la API: ${text.slice(0, 300)}`) }
    let data
    try { data = await response.json() } catch { throw new Error('La API devolvió una respuesta inválida (no es JSON)') }
    return data
  }

  const first = await fetchPage(1)
  const hdr = first?.header || {}
  if (hdr.statusCode && hdr.statusCode !== '200') throw new Error(`ScreenScraper error ${hdr.statusCode}: ${hdr.status || 'sin detalle'}`)
  if (hdr.status && hdr.status !== 'OK' && !first?.response?.jeux) throw new Error(`ScreenScraper: ${hdr.status}`)

  const totalPages = parseInt(hdr.nbpages ?? hdr.nbPages ?? '1', 10) || 1

  let allData = [first]
  if (totalPages > 1) {
    const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
    const extras = await Promise.allSettled(pageNums.map(fetchPage))
    for (const r of extras) {
      if (r.status === 'fulfilled') allData.push(r.value)
      else console.warn('[ScreenScraper] error en página extra:', r.reason)
    }
  }

  const releases = allData.flatMap(d => parseResults(d))
  return { releases, pagesLoaded: allData.length, totalPages }
}

function getAllCovers(medias) {
  if (!medias?.length) return []
  const seen = new Set(); const covers = []
  for (const type of ALL_COVER_TYPES)
    for (const m of medias.filter(m => m.type === type && m.url))
      if (!seen.has(m.url)) { seen.add(m.url); covers.push({ url: m.url, type, label: COVER_TYPE_LABELS[type] || type }) }
  return covers
}
function getCoverForRegion(medias, region) {
  if (!medias?.length) return null
  for (const type of COVER_TYPES) { const m = medias.find(m => m.type === type && m.region === region); if (m?.url) return m.url }
  for (const type of COVER_TYPES) { const m = medias.find(m => m.type === type && (m.region === 'wor' || !m.region)); if (m?.url) return m.url }
  for (const type of COVER_TYPES) { const m = medias.find(m => m.type === type); if (m?.url) return m.url }
  return null
}
function getNameForRegion(noms, region) {
  if (!noms?.length) return 'Sin título'
  return (noms.find(n => n.region === region) || noms.find(n => n.region === 'wor') || noms.find(n => n.region === 'us') || noms[0])?.text || 'Sin título'
}
function explodeToReleases(jeu) {
  const plats = jeu.systeme ? [jeu.systeme] : []; const dates = jeu.dates || []; const noms = jeu.noms || []; const medias = jeu.medias || []
  const dateByRegion = {}; for (const d of dates) if (d.region && d.text) dateByRegion[d.region] = d.text.split('-')[0]
  const nomRegions = noms.filter(n => n.region && n.region !== 'ss').map(n => n.region)
  const regions = [...new Set([...nomRegions, ...Object.keys(dateByRegion)])]
  const effectivePlats = plats.length > 0 ? plats : [{ id: 'unknown', text: '—' }]
  const releases = []
  for (const platform of effectivePlats) {
    const platformName = platform.text || platform.noms?.[0]?.text || '—'; const coverUrls = getAllCovers(medias)
    if (regions.length === 0) {
      releases.push({ id: `${jeu.id}-${platform.id ?? 'u'}-wor`, gameId: jeu.id, title: getNameForRegion(noms, 'wor'), platform: platformName, platformId: String(platform.id ?? ''), region: 'wor', regionLabel: 'Mundial', year: '—', coverUrl: getCoverForRegion(medias, 'wor'), coverUrls })
    } else {
      for (const region of regions)
        releases.push({ id: `${jeu.id}-${platform.id ?? 'u'}-${region}`, gameId: jeu.id, title: getNameForRegion(noms, region), platform: platformName, platformId: String(platform.id ?? ''), region, regionLabel: REGION_MAP[region] || region.toUpperCase(), year: dateByRegion[region] || '—', coverUrl: getCoverForRegion(medias, region), coverUrls })
    }
  }
  return releases
}
function parseResults(data) {
  const jeux = data?.response?.jeux; if (!Array.isArray(jeux)) return []
  return jeux
    .filter(jeu => Array.isArray(jeu.noms) && jeu.noms.some(n => n.text?.trim()))
    .flatMap(jeu => explodeToReleases(jeu))
}
