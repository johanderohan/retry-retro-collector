// ── Única fuente de verdad: valores EXACTOS portados del código React ────────

export const CONDITION_KEYS = ['Juego', 'Manual', 'Caja', 'Otros', 'Nuevo']

export const LIBRO_TIPOS   = ['Guía', 'Catálogo', 'Libro de arte', 'Revista', 'Otros']
export const LIBRO_IDIOMAS = ['Español', 'Japonés', 'Inglés']

export const REGION_MAP = {
  wor: 'Mundial', us: 'USA', eu: 'Europa', jp: 'Japón', fr: 'Francia',
  de: 'Alemania', es: 'España', br: 'Brasil', au: 'Australia', kr: 'Corea',
  ss: 'ScreenScraper',
}

export const REGION_FLAGS = {
  'Mundial': '🌍', 'USA': '🇺🇸', 'Europa': '🇪🇺', 'Japón': '🇯🇵',
  'Francia': '🇫🇷', 'Alemania': '🇩🇪', 'España': '🇪🇸', 'Brasil': '🇧🇷',
  'Australia': '🇦🇺', 'Corea': '🇰🇷', 'ScreenScraper': '🖥️',
}

// Regiones del alta manual de juegos (10, sin 'ss', distinto de REGION_MAP)
export const MANUAL_REGIONS = [
  { value: 'wor', label: 'Mundial' },
  { value: 'eu',  label: 'Europa'  },
  { value: 'us',  label: 'USA'     },
  { value: 'es',  label: 'España'  },
  { value: 'jp',  label: 'Japón'   },
  { value: 'fr',  label: 'Francia' },
  { value: 'de',  label: 'Alemania' },
  { value: 'br',  label: 'Brasil'  },
  { value: 'au',  label: 'Australia' },
  { value: 'kr',  label: 'Corea'   },
]
export const MANUAL_REGION_MAP = Object.fromEntries(MANUAL_REGIONS.map(r => [r.value, r.label]))

export const COVER_TYPES     = ['box-2D', 'box-3D', 'mixrbv2', 'mixrbv1', 'ss']
export const ALL_COVER_TYPES = ['box-2D', 'box-2D-back', 'box-3D', 'mixrbv2', 'mixrbv1', 'ss', 'fanart']
export const COVER_TYPE_LABELS = {
  'box-2D': 'Caja', 'box-2D-back': 'Reverso', 'box-3D': 'Caja 3D',
  'mixrbv2': 'Mix v2', 'mixrbv1': 'Mix v1', 'ss': 'Captura', 'fanart': 'Fan art',
}

export const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Añadido ↓' },
  { value: 'date-asc',  label: 'Añadido ↑' },
  { value: 'name-asc',  label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'year-desc', label: 'Año ↓' },
  { value: 'year-asc',  label: 'Año ↑' },
]

// concatena C(Juego) I(Manual) B(Caja) *(Otros); Nuevo → 'NEW'
export function conditionLabel(c) {
  if (!c) return ''
  if (c.Nuevo) return 'NEW'
  let label = ''
  if (c.Juego)  label += 'C'
  if (c.Manual) label += 'I'
  if (c.Caja)   label += 'B'
  if (c.Otros)  label += '*'
  return label
}

export const SYSTEMS_CACHE_KEY = 'ss-systems-cache'
export const SYSTEMS_CACHE_TTL = 86400_000 // 24 h en ms
