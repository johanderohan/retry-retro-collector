import { useState, useCallback, useEffect, useRef } from 'react'
import SearchBar from './components/SearchBar'
import GameCard from './components/GameCard'
import PlatformCard from './components/PlatformCard'
import ConfigModal from './components/ConfigModal'
import { useCollection } from './hooks/useCollection'
import { useWishlist } from './hooks/useWishlist'
import { usePlatforms } from './hooks/usePlatforms'
import { useDarkMode } from './hooks/useDarkMode'
import ConfirmModal from './components/ConfirmModal'
import AddToCollectionModal from './components/AddToCollectionModal'
import AddPlatformManualModal from './components/AddPlatformManualModal'
import AddGameManualModal from './components/AddGameManualModal'
import { configLoad, configSave } from './db'

export default function App() {
  const [games, setGames] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastQuery, setLastQuery] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState({})

  useEffect(() => { configLoad().then(setConfig) }, [])

  const [hasSearched, setHasSearched] = useState(false)
  const [searchPageInfo, setSearchPageInfo] = useState({ pagesLoaded: 0, totalPages: 0 })
  const [menuOpen, setMenuOpen] = useState(false)
  const { collection, addGame, removeGame, updateGame } = useCollection()
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { platforms, addPlatform, removePlatform, hasPlatform } = usePlatforms()
  const [platformResults, setPlatformResults] = useState([])
  const [isPlatformLoading, setIsPlatformLoading] = useState(false)
  const [platformError, setPlatformError] = useState(null)
  const [platformQuery, setPlatformQuery] = useState('')
  const [hasPlatformSearched, setHasPlatformSearched] = useState(false)
  const systemsCache = useRef(null)
  const [view, setView] = useState('home')
  const { dark, toggle: toggleDark } = useDarkMode()
  const [pendingRemove, setPendingRemove] = useState(null)
  const [pendingWishlistRemove, setPendingWishlistRemove] = useState(null)
  const [pendingAdd, setPendingAdd] = useState(null)

  // ── Add mode & quick filters ───────────────────────────────────────────────
  // addMode=true  → header shows ScreenScraper search bar
  // addMode=false → header shows filter fields (quick search)
  const [addMode, setAddMode] = useState(false)
  const [gameFilters, setGameFilters]         = useState({ name: '', platform: '', region: '' })
  const [platformFilters, setPlatformFilters] = useState({ name: '', type: '', company: '' })
  const [showManualPlatformModal, setShowManualPlatformModal] = useState(false)
  const [showManualGameModal, setShowManualGameModal] = useState(false)
  const [collectionSort, setCollectionSort] = useState('date-desc')
  // preSearchPlatformId → sent to ScreenScraper API (server-side filter)
  // searchRegionFilter  → applied client-side to the results
  const [preSearchPlatformId, setPreSearchPlatformId] = useState('')
  const [searchRegionFilter,  setSearchRegionFilter]  = useState('')
  // Full systems list from ScreenScraper (loaded lazily when entering add mode)
  const [allSystemsList,    setAllSystemsList]    = useState([])
  const [isLoadingSystems,  setIsLoadingSystems]  = useState(false)

  const showSearchBar =
    (view === 'home'      && (hasSearched || addMode)) ||
    (view === 'platforms' && addMode)

  // ── Navigation ────────────────────────────────────────────────────────────
  function goTo(newView) {
    setView(newView)
    setAddMode(false)
    setGameFilters({ name: '', platform: '', region: '' })
    if (newView !== 'home') setHasSearched(false)
    if (newView === 'platforms') {
      setHasPlatformSearched(false)
      setPlatformResults([])
      setPlatformFilters({ name: '', type: '', company: '' })
    }
  }

  function goHome() {
    setView('home'); setHasSearched(false); setGames([]); setError(null)
    setHasPlatformSearched(false); setPlatformResults([])
    setAddMode(false); setGameFilters({ name: '', platform: '', region: '' })
    setPreSearchPlatformId(''); setSearchRegionFilter('')
    setSearchPageInfo({ pagesLoaded: 0, totalPages: 0 })
  }

  // ── +Añadir ───────────────────────────────────────────────────────────────
  function handleAddClick() {
    if (view === 'platforms') {
      setAddMode(true)
    } else {
      setView('home'); setAddMode(true); setHasSearched(false); setGames([]); setError(null)
      setGameFilters({ name: '', platform: '', region: '' })
    }
  }

  // ── Filter options ────────────────────────────────────────────────────────
  const playgroundGames = collection.filter(g => g.inPlayground)

  const gameFilterPlatformOptions =
    view === 'wishlist'   ? [...new Set(wishlist.map(g => g.platform).filter(Boolean))].sort() :
    view === 'playground' ? [...new Set(playgroundGames.map(g => g.platform).filter(Boolean))].sort() :
                            [...new Set(collection.map(g => g.platform).filter(Boolean))].sort()

  const gameFilterRegionOptions =
    view === 'wishlist'   ? [...new Set(wishlist.map(g => g.regionLabel).filter(Boolean))].sort() :
    view === 'playground' ? [...new Set(playgroundGames.map(g => g.regionLabel).filter(Boolean))].sort() :
                            [...new Set(collection.map(g => g.regionLabel).filter(Boolean))].sort()

  const platTypeOptions    = [...new Set(platforms.map(p => p.type).filter(Boolean))].sort()
  const platCompanyOptions = [...new Set(platforms.map(p => p.company).filter(Boolean))].sort()

  // ── Search filters (game search bar) ─────────────────────────────────────
  // Platform: pre-search, API-level (systemeid param). Full list from ScreenScraper.
  // Region: post-search, client-side.
  const searchRegionOptions = [...new Set(games.map(g => g.regionLabel).filter(Boolean))].sort()
  const filteredSearchGames = searchRegionFilter
    ? games.filter(g => g.regionLabel === searchRegionFilter)
    : games

  // ── Filtered + sorted data ────────────────────────────────────────────────
  function applyGameFilters(items) {
    return items.filter(g => {
      if (gameFilters.platform && g.platform !== gameFilters.platform) return false
      if (gameFilters.region   && g.regionLabel !== gameFilters.region)  return false
      if (gameFilters.name.trim() && !g.title.toLowerCase().includes(gameFilters.name.trim().toLowerCase())) return false
      return true
    })
  }

  function applySortToGames(items) {
    const arr = [...items]
    const toYear = g => parseInt(g.year) || 0
    switch (collectionSort) {
      case 'date-desc': return arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
      case 'date-asc':  return arr.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0))
      case 'name-asc':  return arr.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' }))
      case 'name-desc': return arr.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'es', { sensitivity: 'base' }))
      case 'year-asc':  return arr.sort((a, b) => toYear(a) - toYear(b))
      case 'year-desc': return arr.sort((a, b) => toYear(b) - toYear(a))
      default:          return arr
    }
  }

  const filteredCollection = applySortToGames(applyGameFilters(collection))
  const filteredWishlist   = applySortToGames(applyGameFilters(wishlist))
  const filteredPlayground = applySortToGames(applyGameFilters(playgroundGames))

  const filteredPlatforms = platforms.filter(p => {
    if (platformFilters.type    && p.type    !== platformFilters.type)    return false
    if (platformFilters.company && p.company !== platformFilters.company)  return false
    if (platformFilters.name.trim() && !p.name.toLowerCase().includes(platformFilters.name.trim().toLowerCase())) return false
    return true
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (query) => {
    if (!config.devid || !config.devpassword) { setShowConfig(true); return }
    setView('home'); setIsLoading(true); setError(null); setLastQuery(query); setHasSearched(true)
    setSearchRegionFilter('')
    try {
      const { releases, pagesLoaded, totalPages } = await searchGamesWithConfig(query, config, preSearchPlatformId)
      setGames(releases)
      setSearchPageInfo({ pagesLoaded, totalPages })
    }
    catch (err) { setError(err.message || 'Error al conectar con ScreenScraper'); setGames([]); setSearchPageInfo({ pagesLoaded: 0, totalPages: 0 }) }
    finally { setIsLoading(false) }
  }, [config, preSearchPlatformId])

  const handlePlatformSearch = useCallback(async (query) => {
    if (!config.devid || !config.devpassword) { setShowConfig(true); return }
    setIsPlatformLoading(true); setPlatformError(null); setPlatformQuery(query); setHasPlatformSearched(true)
    try {
      if (!systemsCache.current) systemsCache.current = await fetchAllSystemsWithConfig(config)
      const q = query.toLowerCase()
      setPlatformResults(systemsCache.current.filter(s =>
        s.name.toLowerCase().includes(q) || s.aliases.includes(q) ||
        s.type.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)
      ))
    } catch (err) { setPlatformError(err.message || 'Error al conectar con ScreenScraper'); setPlatformResults([]) }
    finally { setIsPlatformLoading(false) }
  }, [config])

  function handleSaveConfig(newConfig) { setConfig(newConfig); configSave(newConfig) }

  const isConfigured = config.devid && config.devpassword

  // Lazy-load the full ScreenScraper systems list the first time the game
  // search bar opens. Reuses the platform-search cache so it only fetches once.
  useEffect(() => {
    if (!(addMode && view === 'home') || !isConfigured) return
    if (allSystemsList.length > 0) return
    if (systemsCache.current) { setAllSystemsList(systemsCache.current); return }
    let cancelled = false
    setIsLoadingSystems(true)
    fetchAllSystemsWithConfig(config)
      .then(s => { if (!cancelled) { systemsCache.current = s; setAllSystemsList(s) } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoadingSystems(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMode, view, isConfigured])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">

          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <button className="flex items-center gap-2 hover:opacity-70 transition-opacity" onClick={goHome} aria-label="Ir a inicio">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="245 210 365 323" width="26" height="26">
                <g transform="translate(0,852) scale(0.1,-0.1)" stroke="none">
                  <path className="fill-gray-900 dark:fill-gray-100" d="M4180 6393 c-379 -26 -684 -133 -972 -340 -89 -64 -236 -198 -315 -286 -160 -180 -305 -450 -374 -698 -20 -73 -49 -213 -49 -237 0 -8 89 73 198 178 205 201 268 249 360 282 63 22 200 27 255 9 28 -10 41 -8 78 9 24 11 61 20 82 20 60 0 233 -96 320 -178 29 -29 37 -43 37 -72 -1 -19 -7 -46 -15 -60 -11 -20 -11 -28 -1 -40 7 -8 21 -35 30 -60 17 -43 26 -50 186 -147 92 -57 172 -103 177 -103 5 0 22 14 39 31 56 60 170 145 244 181 250 122 481 138 850 59 196 -42 345 -19 421 67 50 57 69 122 69 232 0 128 -52 305 -140 480 -54 107 -275 305 -470 422 -233 139 -508 225 -789 247 -74 6 -144 10 -155 9 -12 -1 -41 -3 -66 -5z"/>
                  <path className="fill-gray-900 dark:fill-gray-100" d="M5790 5556 c0 -4 5 -16 11 -27 6 -11 25 -66 42 -122 26 -87 31 -118 31 -212 1 -100 -2 -116 -27 -170 -88 -189 -275 -249 -627 -199 -185 26 -390 6 -538 -53 -125 -51 -323 -206 -296 -233 6 -6 107 -69 224 -140 l213 -129 66 6 c57 5 71 10 101 39 22 21 46 34 62 34 37 0 210 -90 281 -146 64 -50 84 -85 88 -154 2 -35 11 -54 37 -84 19 -21 48 -68 66 -105 29 -63 31 -72 31 -186 -1 -116 -3 -126 -53 -289 -28 -93 -50 -171 -49 -172 5 -5 192 185 228 231 108 136 223 338 284 500 68 180 115 443 115 645 0 247 -67 540 -174 765 -49 102 -116 219 -116 201z"/>
                  <path className="fill-gray-900 dark:fill-gray-100" d="M3289 4975 c-34 -52 -70 -97 -80 -100 -14 -5 -52 12 -119 50 -69 39 -105 55 -119 50 -22 -7 -111 -146 -111 -173 0 -28 19 -45 103 -97 107 -66 111 -76 56 -167 -72 -122 -73 -125 -55 -153 24 -36 151 -109 178 -101 15 4 45 40 83 98 55 85 63 93 90 92 17 -1 64 -22 106 -48 113 -68 123 -66 193 52 52 86 47 98 -59 162 -122 74 -124 82 -53 198 54 89 60 105 42 131 -20 28 -144 101 -172 101 -18 0 -37 -22 -83 -95z"/>
                  <path style={{fill: 'oklch(71.2% .194 13.428)'}} d="M4963,4040 c-89,-54 -82,-200 11,-244 c98,-46 206,18 206,123 c0,84 -56,141 -140,141 c-27,0 -58,-8 -77,-20"/>
                  <path style={{fill: 'oklch(71.2% .194 13.428)'}} d="M4580,3952 c-37,-20 -80,-89 -80,-130 c0,-45 39,-102 83,-123 c54,-24 71,-24 123,2 c108,52 106,209 -3,254 c-47,20 -81,19 -123,-3"/>
                  <path style={{fill: 'oklch(71.2% .194 13.428)'}} d="M5071,3653 c-68,-34 -95,-114 -62,-187 c16,-38 29,-51 66,-67 c81,-36 160,-4 190,76 c48,125 -74,237 -194,178"/>
                  <path style={{fill: 'oklch(71.2% .194 13.428)'}} d="M4663,3550 c-114,-69 -63,-260 70,-260 c85,0 147,59 147,139 c0,84 -56,141 -140,141 c-27,0 -58,-8 -77,-20"/>
                </g>
              </svg>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Retry <span className="font-thin">| </span><span className="text-xs font-thin">Your retro collection</span></h1>
            </button>

            <div className="flex items-center gap-2">
              {/* +Añadir — visible when filter fields are shown */}
              {!showSearchBar && (
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
                  </svg>
                  Añadir
                </button>
              )}
              {/* Manual + Cancelar — home add mode */}
              {view === 'home' && addMode && (
                <>
                  <button
                    onClick={() => setShowManualGameModal(true)}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    title="Añadir juego manualmente"
                  >
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
                    </svg>
                    Manual
                  </button>
                  <button
                    onClick={() => { setAddMode(false); setHasSearched(false); setGames([]); setError(null); setPreSearchPlatformId(''); setSearchRegionFilter('') }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1.5 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}
              {/* Manual + Cancelar — only in platforms add mode */}
              {view === 'platforms' && showSearchBar && (
                <>
                  <button
                    onClick={() => setShowManualPlatformModal(true)}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    title="Añadir plataforma manualmente"
                  >
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
                    </svg>
                    Manual
                  </button>
                  <button
                    onClick={() => { setAddMode(false); setHasPlatformSearched(false); setPlatformResults([]) }}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1.5 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              )}
              {/* Hamburger */}
              <button
                className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                onClick={() => setMenuOpen(true)} aria-label="Abrir menú"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search bar OR filter fields */}
          {showSearchBar ? (
            view === 'platforms' ? (
              <SearchBar
                onSearch={handlePlatformSearch}
                isLoading={isPlatformLoading}
                placeholder="Buscar consola, ordenador o periférico..."
              />
            ) : (
              <div className="flex flex-col gap-2">
                <SearchBar onSearch={handleSearch} isLoading={isLoading} />
                {/* Platform (pre-search, API-level) + Region (post-search, client-side) */}
                {isConfigured && (
                  <div className="flex gap-2">
                    {/* Searchable platform combobox — loads all ScreenScraper systems */}
                    <SearchableSelect
                      value={preSearchPlatformId}
                      onChange={setPreSearchPlatformId}
                      placeholder="Todas las plataformas"
                      options={allSystemsList.map(s => ({ value: s.id, label: s.name }))}
                      loading={isLoadingSystems}
                    />
                    {/* Region select — appears once results exist */}
                    {searchRegionOptions.length > 0 && (
                      <SearchDropdown
                        value={searchRegionFilter}
                        onChange={setSearchRegionFilter}
                        placeholder="Todas las regiones"
                        options={searchRegionOptions.map(v => ({ value: v, label: v }))}
                      />
                    )}
                  </div>
                )}
              </div>
            )
          ) : (
            <FilterBar
              view={view}
              gameFilters={gameFilters}       setGameFilters={setGameFilters}
              platformFilters={platformFilters} setPlatformFilters={setPlatformFilters}
              gameFilterPlatforms={gameFilterPlatformOptions}
              gameFilterRegions={gameFilterRegionOptions}
              platTypes={platTypeOptions}
              platCompanies={platCompanyOptions}
              collectionSort={collectionSort} setCollectionSort={setCollectionSort}
            />
          )}

          {!isConfigured && (
            <p className="text-xs text-amber-600 mt-2 pb-1">⚠️ Configura tus credenciales de ScreenScraper para empezar</p>
          )}
        </div>
      </header>

      {/* ── Drawer ─────────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-20 flex" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative ml-auto w-64 h-full bg-white dark:bg-gray-800 shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100"></span>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
              {[
                { label: 'Inicio',      action: () => goTo('home'),       icon: <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" /> },
                { label: 'Plataformas', action: () => goTo('platforms'),  icon: <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h2m2 0h2M12 8v4"/><circle cx="17" cy="12" r="1" fill="currentColor"/></> },
                { label: 'Wishlist',    action: () => goTo('wishlist'),   icon: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /> },
                { label: 'Playground',  action: () => goTo('playground'), icon: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" stroke="none" /> },
              ].map(({ label, action, icon }) => (
                <button
                  key={label}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2.5 ${
                    (label === 'Inicio' && view === 'home') || (label === 'Plataformas' && view === 'platforms') ||
                    (label === 'Wishlist' && view === 'wishlist') || (label === 'Playground' && view === 'playground')
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => { action(); setMenuOpen(false) }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-60">{icon}</svg>
                  {label}
                </button>
              ))}
            </nav>
            <div className="px-5 py-3 border-gray-100 dark:border-gray-700 flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                <span className="font-bold text-gray-800 dark:text-gray-100">{collection.length}</span>
                juego{collection.length !== 1 ? 's' : ''} en tu colección
              </span>
            </div>
            <div className="px-3 pb-5 border-t border-gray-100 dark:border-gray-700 pt-3 flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <button
                  className={`flex-1 flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors ${!isConfigured ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  onClick={() => { setMenuOpen(false); setShowConfig(true) }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  {!isConfigured ? 'Configurar API' : 'Configuración'}
                </button>
                <button className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={toggleDark} title={dark ? 'Modo claro' : 'Modo oscuro'}>
                  {dark ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">

        {/* Home: loading */}
        {view === 'home' && isLoading && (
          <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-gray-400">
            <span className="text-3xl animate-pulse">🕹️</span>
            <p className="text-sm">Buscando...</p>
          </div>
        )}

        {/* Home: error */}
        {view === 'home' && error && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-64 gap-4">
            <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <span className="text-2xl block mb-3">⚠️</span>
              <p className="text-sm text-red-700 mb-2">{error}</p>
              <p className="text-xs text-gray-400 mb-4">Verifica tus credenciales o abre DevTools (F12) para más detalle</p>
              <button className="px-4 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600" onClick={() => setShowConfig(true)}>Abrir configuración</button>
            </div>
          </div>
        )}

        {/* Home: no search results */}
        {view === 'home' && !isLoading && !error && hasSearched && games.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-64 gap-2 text-gray-400">
            <span className="text-3xl">🔍</span>
            <p className="text-sm">No se encontraron resultados para <strong className="text-gray-600">"{lastQuery}"</strong></p>
            <p className="text-xs">Intenta con otro término de búsqueda</p>
            <button
              onClick={() => setShowManualGameModal(true)}
              className="mt-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
            >
              Añadir manualmente
            </button>
          </div>
        )}

        {/* Home: search results */}
        {view === 'home' && !isLoading && hasSearched && games.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-5">
              {filteredSearchGames.length < games.length ? (
                <>
                  <span className="font-medium text-gray-700">{filteredSearchGames.length}</span> de{' '}
                  <span className="font-medium text-gray-700">{games.length}</span> versión{games.length !== 1 ? 'es' : ''} para{' '}
                  <span className="text-gray-600">"{lastQuery}"</span>
                  <button
                    onClick={() => setSearchRegionFilter('')}
                    className="ml-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                </>
              ) : (
                <>
                  <span className="font-medium text-gray-700">{games.length}</span> versión{games.length !== 1 ? 'es' : ''} en{' '}
                  <span className="font-medium text-gray-700">{new Set(games.map(g => g.gameId)).size}</span> juego{new Set(games.map(g => g.gameId)).size !== 1 ? 's' : ''} para{' '}
                  <span className="text-gray-600">"{lastQuery}"</span>
                  {searchPageInfo.totalPages > 1 && (
                    <span className="ml-2 text-gray-400">· {searchPageInfo.pagesLoaded}/{searchPageInfo.totalPages} pág.</span>
                  )}
                </>
              )}
            </p>
            {filteredSearchGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-48 gap-2 text-gray-400">
                <span className="text-3xl">🔍</span>
                <p className="text-sm">Ningún resultado coincide con los filtros</p>
                <button
                  onClick={() => setSearchRegionFilter('')}
                  className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSearchGames.map(game => (
                  <GameCard key={game.id} game={game} onAdd={setPendingAdd} onWishlist={addToWishlist} inWishlist={wishlist.some(g => g.id === game.id)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Home: collection */}
        {view === 'home' && !isLoading && !hasSearched && (
          collection.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
              <span className="text-4xl">🕹️</span>
              <div>
                <h2 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Tu colección está vacía</h2>
                <p className="text-sm text-gray-400">Pulsa <span className="font-medium text-gray-600 dark:text-gray-400">+ Añadir</span> para buscar tu primer juego</p>
              </div>
            </div>
          ) : filteredCollection.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-center">
              <span className="text-3xl">🔍</span>
              <p className="text-sm text-gray-400">No hay juegos que coincidan con los filtros</p>
              <button className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline transition-colors" onClick={() => setGameFilters({ name: '', platform: '', region: '' })}>Limpiar filtros</button>
            </div>
          ) : (
            <CollectionView
              collection={filteredCollection}
              onRemove={id => setPendingRemove(collection.find(g => g.id === id))}
              onPlayground={game => updateGame({ ...game, inPlayground: !game.inPlayground })}
            />
          )
        )}

        {/* Wishlist */}
        {view === 'wishlist' && (
          wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <div>
                <h2 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Tu wishlist está vacía</h2>
                <p className="text-sm text-gray-400">Pulsa <span className="font-medium text-gray-600 dark:text-gray-400">+ Añadir</span> para buscar juegos</p>
              </div>
            </div>
          ) : filteredWishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-center">
              <span className="text-3xl">🔍</span>
              <p className="text-sm text-gray-400">No hay juegos que coincidan</p>
              <button className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline transition-colors" onClick={() => setGameFilters({ name: '', platform: '', region: '' })}>Limpiar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWishlist.map(game => (
                <GameCard key={game.id} game={game} onAdd={setPendingAdd} onRemove={id => setPendingWishlistRemove(wishlist.find(g => g.id === id))} />
              ))}
            </div>
          )
        )}

        {/* Playground */}
        {view === 'playground' && (
          playgroundGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-gray-200 dark:text-gray-700">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <div>
                <h2 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Tu Playground está vacío</h2>
                <p className="text-sm text-gray-400">Marca los juegos completados con ♥ desde tu colección</p>
              </div>
            </div>
          ) : filteredPlayground.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-center">
              <span className="text-3xl">🔍</span>
              <p className="text-sm text-gray-400">No hay juegos que coincidan</p>
              <button className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline transition-colors" onClick={() => setGameFilters({ name: '', platform: '', region: '' })}>Limpiar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPlayground.map(game => (
                <GameCard key={game.id} game={game} onPlayground={() => updateGame({ ...game, inPlayground: false })} inPlayground={true} />
              ))}
            </div>
          )
        )}

        {/* Platforms */}
        {view === 'platforms' && (
          addMode ? (
            <>
              {isPlatformLoading && (
                <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-gray-400">
                  <span className="text-3xl animate-pulse">🕹️</span><p className="text-sm">Buscando...</p>
                </div>
              )}
              {platformError && !isPlatformLoading && (
                <div className="flex flex-col items-center justify-center min-h-64 gap-4">
                  <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <span className="text-2xl block mb-3">⚠️</span>
                    <p className="text-sm text-red-700">{platformError}</p>
                  </div>
                </div>
              )}
              {!isPlatformLoading && !platformError && hasPlatformSearched && (
                platformResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-64 gap-2 text-gray-400">
                    <span className="text-3xl">🔍</span>
                    <p className="text-sm">No se encontraron resultados para <strong className="text-gray-600">"{platformQuery}"</strong></p>
                    <button
                      onClick={() => setShowManualPlatformModal(true)}
                      className="mt-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
                    >
                      Añadir manualmente
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-400 mb-5">
                      <span className="font-medium text-gray-700">{platformResults.length}</span> resultado{platformResults.length !== 1 ? 's' : ''} para <span className="text-gray-600">"{platformQuery}"</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {platformResults.map(platform => (
                        <PlatformCard key={platform.id} platform={platform} onAdd={addPlatform} inCollection={hasPlatform(platform.id)} />
                      ))}
                    </div>
                  </>
                )
              )}
              {!isPlatformLoading && !platformError && !hasPlatformSearched && (
                <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
                    <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h2m2 0h2M12 8v4"/><circle cx="17" cy="12" r="1" fill="currentColor"/>
                  </svg>
                  <div>
                    <h2 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Busca una plataforma</h2>
                    <p className="text-sm text-gray-400">Escribe el nombre de una consola, ordenador o periférico</p>
                  </div>
                  <button
                    onClick={() => setShowManualPlatformModal(true)}
                    className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
                  >
                    o añadir manualmente
                  </button>
                </div>
              )}
            </>
          ) : (
            platforms.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
                  <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h2m2 0h2M12 8v4"/><circle cx="17" cy="12" r="1" fill="currentColor"/>
                </svg>
                <div>
                  <h2 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Sin plataformas</h2>
                  <p className="text-sm text-gray-400">Pulsa <span className="font-medium text-gray-600 dark:text-gray-400">+ Añadir</span> para buscar una consola o periférico</p>
                </div>
              </div>
            ) : filteredPlatforms.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-64 gap-3 text-center">
                <span className="text-3xl">🔍</span>
                <p className="text-sm text-gray-400">No hay plataformas que coincidan</p>
                <button className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline transition-colors" onClick={() => setPlatformFilters({ name: '', type: '', company: '' })}>Limpiar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPlatforms.map(platform => (
                  <PlatformCard key={platform.id} platform={platform} onRemove={removePlatform} />
                ))}
              </div>
            )
          )
        )}

      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showConfig && <ConfigModal initialConfig={config} onClose={() => setShowConfig(false)} onSave={handleSaveConfig} collection={collection} />}

      {showManualPlatformModal && (
        <AddPlatformManualModal
          onConfirm={platform => {
            addPlatform(platform)
            setShowManualPlatformModal(false)
            setAddMode(false)
          }}
          onCancel={() => setShowManualPlatformModal(false)}
        />
      )}

      {showManualGameModal && (
        <AddGameManualModal
          onConfirm={game => {
            setShowManualGameModal(false)
            setPendingAdd(game)
          }}
          onCancel={() => setShowManualGameModal(false)}
        />
      )}

      {pendingRemove && (
        <ConfirmModal
          title="¿Eliminar juego?" message={`"${pendingRemove.title}" se eliminará de tu colección.`}
          onConfirm={() => { removeGame(pendingRemove.id); setPendingRemove(null) }}
          onCancel={() => setPendingRemove(null)}
        />
      )}

      {pendingWishlistRemove && (
        <ConfirmModal
          title="¿Eliminar de la wishlist?" message={`"${pendingWishlistRemove.title}" se eliminará de tu wishlist.`}
          onConfirm={() => { removeFromWishlist(pendingWishlistRemove.id); setPendingWishlistRemove(null) }}
          onCancel={() => setPendingWishlistRemove(null)}
        />
      )}

      {pendingAdd && (
        <AddToCollectionModal
          game={pendingAdd}
          onConfirm={(condition, esSpanish, coverUrl, isPlatino) => {
            addGame({ ...pendingAdd, id: `${pendingAdd.id}-${Date.now()}`, gameId: pendingAdd.id, condition, esSpanish, isPlatino, coverUrl: coverUrl || pendingAdd.coverUrl, addedAt: Date.now() })
            if (wishlist.some(g => g.id === pendingAdd.id)) removeFromWishlist(pendingAdd.id)
            setPendingAdd(null)
          }}
          onCancel={() => setPendingAdd(null)}
        />
      )}
    </div>
  )
}

// ── FilterBar ──────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Añadido ↓' },
  { value: 'date-asc',  label: 'Añadido ↑' },
  { value: 'name-asc',  label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'year-desc', label: 'Año ↓' },
  { value: 'year-asc',  label: 'Año ↑' },
]

function FilterBar({ view, gameFilters, setGameFilters, platformFilters, setPlatformFilters, gameFilterPlatforms, gameFilterRegions, platTypes, platCompanies, collectionSort, setCollectionSort }) {
  const isPlatforms = view === 'platforms'
  const filters     = isPlatforms ? platformFilters    : gameFilters
  const setFilters  = isPlatforms ? setPlatformFilters : setGameFilters

  const placeholder = { home: 'Buscar en tu colección...', wishlist: 'Buscar en tu wishlist...', playground: 'Buscar en tu playground...', platforms: 'Buscar en tus plataformas...' }[view] ?? 'Buscar...'

  const filterDropdowns = isPlatforms
    ? [{ key: 'type',    label: 'Todos los tipos',    options: platTypes    },
       { key: 'company', label: 'Todas las marcas',   options: platCompanies }]
    : [{ key: 'platform', label: 'Todas las plataformas', options: gameFilterPlatforms },
       { key: 'region',   label: 'Todas las regiones',    options: gameFilterRegions   }]

  const selectCls = active => `w-full pl-2.5 pr-6 py-1.5 text-xs rounded-lg border transition-colors appearance-none outline-none cursor-pointer bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 ${
    active ? 'border-gray-900 dark:border-gray-400 ring-1 ring-gray-900 dark:ring-gray-400'
           : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
  }`
  const chevron = (
    <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,4 6,8 10,4" />
    </svg>
  )

  return (
    <div className="flex flex-col gap-2">
      {/* Name — full width row */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          value={filters.name}
          onChange={e => setFilters(f => ({ ...f, name: e.target.value }))}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 transition-colors"
        />
        {filters.name && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => setFilters(f => ({ ...f, name: '' }))}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdowns — all on the same row, never wrap */}
      <div className="flex gap-2">
        {/* Filter dropdowns (platform+region or type+company) */}
        {filterDropdowns.map(({ key, label, options }) => (
          <div key={key} className="relative flex-1 min-w-0">
            <select
              value={filters[key]}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
              className={selectCls(!!filters[key])}
            >
              <option value="">{label}</option>
              {options.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            {chevron}
          </div>
        ))}

        {/* Sort dropdown — only for game views (not platforms) */}
        {!isPlatforms && (
          <div className="relative flex-1 min-w-0">
            <select
              value={collectionSort}
              onChange={e => setCollectionSort(e.target.value)}
              className={selectCls(collectionSort !== 'date-desc')}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {chevron}
          </div>
        )}
      </div>
    </div>
  )
}

// ── SearchableSelect ───────────────────────────────────────────────────────────
// Combobox with inline search — used for the platform pre-filter (300+ options)
function SearchableSelect({ value, onChange, placeholder, options, loading = false }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef     = useRef(null)

  useEffect(() => {
    function onOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false); setQuery('')
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const selectedLabel = options.find(o => o.value === value)?.label
  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  function select(val) { onChange(val); setOpen(false); setQuery('') }

  function handleTriggerClick() {
    if (loading) return
    const next = !open
    setOpen(next)
    if (next) setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={loading}
        className={`w-full flex items-center gap-1 pl-2.5 pr-2 py-1.5 text-xs rounded-lg border transition-colors text-left ${
          value
            ? 'border-gray-900 dark:border-gray-400 ring-1 ring-gray-900 dark:ring-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        } ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className="flex-1 truncate min-w-0">
          {loading ? 'Cargando plataformas…' : (selectedLabel || placeholder)}
        </span>
        {value && !loading ? (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange('') }}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0 p-0.5"
          >
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </span>
        ) : (
          <svg className="text-gray-400 flex-shrink-0" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,4 6,8 10,4" />
          </svg>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar plataforma…"
              className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-gray-900 dark:focus:border-gray-400"
              onClick={e => e.stopPropagation()}
            />
          </div>
          {/* Option list */}
          <div className="overflow-y-auto max-h-52">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-gray-400">Sin resultados</p>
            ) : (
              filtered.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => select(o.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    o.value === value
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── SearchDropdown ─────────────────────────────────────────────────────────────
// Small select used in the game-search header bar
function SearchDropdown({ value, onChange, placeholder, options }) {
  return (
    <div className="relative flex-1">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full pl-2.5 pr-6 py-1.5 text-xs rounded-lg border transition-colors appearance-none outline-none cursor-pointer bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 ${
          value
            ? 'border-gray-900 dark:border-gray-400 ring-1 ring-gray-900 dark:ring-gray-400'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2,4 6,8 10,4" />
      </svg>
    </div>
  )
}

// ── CollectionView ─────────────────────────────────────────────────────────────
function CollectionView({ collection, onRemove, onPlayground }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {collection.map(game => (
        <GameCard key={game.id} game={game} onRemove={onRemove} onPlayground={onPlayground} inPlayground={!!game.inPlayground} />
      ))}
    </div>
  )
}

// ── ScreenScraper helpers ──────────────────────────────────────────────────────
function parseSystemName(s) {
  const noms = s.noms
  if (!noms || typeof noms !== 'object' || Array.isArray(noms)) return ''
  return noms.nom_eu || noms.nom_us || noms.noms_commun?.split(',')[0]?.trim() || noms.nom_launchbox || noms.nom_hyperspin || ''
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

const SYSTEMS_CACHE_KEY = 'ss-systems-cache'
const SYSTEMS_CACHE_TTL = 86400_000 // 24 h en ms

async function fetchAllSystemsWithConfig(config) {
  // Intentar servir desde localStorage
  try {
    const raw = localStorage.getItem(SYSTEMS_CACHE_KEY)
    if (raw) {
      const { ts, data } = JSON.parse(raw)
      if (Date.now() - ts < SYSTEMS_CACHE_TTL) return data
    }
  } catch { /* caché corrupta, se ignora */ }

  const params = new URLSearchParams({ devid: config.devid || '', devpassword: config.devpassword || '', softname: config.softname || 'retro-search', output: 'json' })
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

  // Persistir en localStorage
  try { localStorage.setItem(SYSTEMS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: systems })) } catch { /* quota exceeded, no pasa nada */ }

  return systems
}

async function searchGamesWithConfig(query, config, systemeid = '') {
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

  // ── Page 1 ────────────────────────────────────────────────────────────────
  const first = await fetchPage(1)
  const hdr = first?.header || {}
  if (hdr.statusCode && hdr.statusCode !== '200') throw new Error(`ScreenScraper error ${hdr.statusCode}: ${hdr.status || 'sin detalle'}`)
  if (hdr.status && hdr.status !== 'OK' && !first?.response?.jeux) throw new Error(`ScreenScraper: ${hdr.status}`)

  // ScreenScraper header uses lowercase: nbpages / numpage
  const totalPages = parseInt(hdr.nbpages ?? hdr.nbPages ?? '1', 10) || 1

  // ── Extra pages (parallel) ────────────────────────────────────────────────
  let allData = [first]
  if (totalPages > 1) {
    const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
    // Fetch remaining pages in parallel; ignore individual page errors so a
    // partial failure doesn't wipe out the results we already have.
    const extras = await Promise.allSettled(pageNums.map(fetchPage))
    for (const r of extras) {
      if (r.status === 'fulfilled') allData.push(r.value)
      else console.warn('[ScreenScraper] error en página extra:', r.reason)
    }
  }

  const releases = allData.flatMap(d => parseResults(d))
  return { releases, pagesLoaded: allData.length, totalPages }
}

const REGION_MAP = { wor: 'Mundial', us: 'USA', eu: 'Europa', jp: 'Japón', fr: 'Francia', de: 'Alemania', es: 'España', br: 'Brasil', au: 'Australia', kr: 'Corea', ss: 'ScreenScraper' }
const COVER_TYPES     = ['box-2D', 'box-3D', 'mixrbv2', 'mixrbv1', 'ss']
const ALL_COVER_TYPES = ['box-2D', 'box-2D-back', 'box-3D', 'mixrbv2', 'mixrbv1', 'ss', 'fanart']
const COVER_TYPE_LABELS = { 'box-2D': 'Caja', 'box-2D-back': 'Reverso', 'box-3D': 'Caja 3D', 'mixrbv2': 'Mix v2', 'mixrbv1': 'Mix v1', 'ss': 'Captura', 'fanart': 'Fan art' }

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
  // Discard stubs: ScreenScraper sometimes returns games with no names array
  // (or all-empty texts) when there are no real results for a query.
  return jeux
    .filter(jeu => Array.isArray(jeu.noms) && jeu.noms.some(n => n.text?.trim()))
    .flatMap(jeu => explodeToReleases(jeu))
}
