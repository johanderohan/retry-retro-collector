import { useSearchStore } from '../stores/searchStore.js'
import { useConfigStore } from '../stores/configStore.js'

// Conveniencia: expone el store de búsqueda + el guard de configuración.
// La acción devuelve false si faltan credenciales (el caller abre ConfigModal).
export function useScreenScraper() {
  const search = useSearchStore()
  const config = useConfigStore()

  async function runGameSearch(query) {
    if (!config.isConfigured) return false
    await search.searchGames(query)
    return true
  }

  async function runPlatformSearch(query) {
    if (!config.isConfigured) return false
    await search.searchPlatforms(query)
    return true
  }

  return { search, config, runGameSearch, runPlatformSearch }
}
