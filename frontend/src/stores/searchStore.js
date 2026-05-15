import { defineStore } from 'pinia'
import { ref } from 'vue'
import { searchGames as ssSearchGames, fetchAllSystems } from '../utils/screenscraper.js'
import { useConfigStore } from './configStore.js'

export const useSearchStore = defineStore('search', () => {
  // ── Búsqueda de juegos ──────────────────────────────────────────────────
  const games = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastQuery = ref('')
  const hasSearched = ref(false)
  const pageInfo = ref({ pagesLoaded: 0, totalPages: 0 })
  const preSearchPlatformId = ref('')
  const searchRegionFilter = ref('')

  // ── Búsqueda de plataformas ─────────────────────────────────────────────
  const platformResults = ref([])
  const isPlatformLoading = ref(false)
  const platformError = ref(null)
  const platformQuery = ref('')
  const hasPlatformSearched = ref(false)

  // ── Lista de sistemas (single-flight, reusa caché localStorage 24 h) ─────
  const allSystemsList = ref([])
  const isLoadingSystems = ref(false)
  let systemsCache = null
  let systemsInFlight = null

  async function loadSystems() {
    const config = useConfigStore().config
    if (systemsCache) { allSystemsList.value = systemsCache; return systemsCache }
    if (systemsInFlight) return systemsInFlight
    isLoadingSystems.value = true
    systemsInFlight = fetchAllSystems(config)
      .then(s => { systemsCache = s; allSystemsList.value = s; return s })
      .catch(e => { systemsInFlight = null; throw e })
      .finally(() => { isLoadingSystems.value = false })
    return systemsInFlight
  }

  async function searchGames(query) {
    const config = useConfigStore().config
    isLoading.value = true
    error.value = null
    lastQuery.value = query
    hasSearched.value = true
    searchRegionFilter.value = ''
    try {
      const { releases, pagesLoaded, totalPages } =
        await ssSearchGames(query, config, preSearchPlatformId.value)
      games.value = releases
      pageInfo.value = { pagesLoaded, totalPages }
    } catch (err) {
      error.value = err.message || 'Error al conectar con ScreenScraper'
      games.value = []
      pageInfo.value = { pagesLoaded: 0, totalPages: 0 }
    } finally {
      isLoading.value = false
    }
  }

  async function searchPlatforms(query) {
    isPlatformLoading.value = true
    platformError.value = null
    platformQuery.value = query
    hasPlatformSearched.value = true
    try {
      const list = await loadSystems()
      const q = query.toLowerCase()
      platformResults.value = list.filter(s =>
        s.name.toLowerCase().includes(q) || s.aliases.includes(q) ||
        s.type.toLowerCase().includes(q) || s.company.toLowerCase().includes(q),
      )
    } catch (err) {
      platformError.value = err.message || 'Error al conectar con ScreenScraper'
      platformResults.value = []
    } finally {
      isPlatformLoading.value = false
    }
  }

  function resetGameSearch() {
    games.value = []
    error.value = null
    hasSearched.value = false
    lastQuery.value = ''
    preSearchPlatformId.value = ''
    searchRegionFilter.value = ''
    pageInfo.value = { pagesLoaded: 0, totalPages: 0 }
  }

  function resetPlatformSearch() {
    platformResults.value = []
    platformError.value = null
    hasPlatformSearched.value = false
    platformQuery.value = ''
  }

  return {
    games, isLoading, error, lastQuery, hasSearched, pageInfo,
    preSearchPlatformId, searchRegionFilter,
    platformResults, isPlatformLoading, platformError, platformQuery, hasPlatformSearched,
    allSystemsList, isLoadingSystems,
    loadSystems, searchGames, searchPlatforms, resetGameSearch, resetPlatformSearch,
  }
})
