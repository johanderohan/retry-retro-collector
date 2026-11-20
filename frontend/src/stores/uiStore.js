import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

function initDark() {
  const saved = localStorage.getItem('retry-darkmode')
  if (saved !== null) return saved === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const emptyGameFilters = () => ({ name: '', platform: '', region: '' })
const emptyPlatformFilters = () => ({ name: '', type: '', company: '' })
const emptyLibroFilters = () => ({ name: '', tipo: '' })

export const useUiStore = defineStore('ui', () => {
  // ── Tema / drawer ────────────────────────────────────────────
  const dark = ref(initDark())
  const drawerOpen = ref(false)
  const filtersOpen = ref(false) // desplegables de filtro: ocultos hasta pulsar el icono

  function applyDark() {
    document.documentElement.classList.toggle('dark', dark.value)
    localStorage.setItem('retry-darkmode', String(dark.value))
  }
  applyDark()
  watch(dark, applyDark)

  function toggleDark() { dark.value = !dark.value }
  function openDrawer() { drawerOpen.value = true }
  function closeDrawer() { drawerOpen.value = false }

  // ── Filtros (compartidos entre FilterBar del header y las vistas) ────────
  const gameFilters = ref(emptyGameFilters())
  const platformFilters = ref(emptyPlatformFilters())
  const libroFilters = ref(emptyLibroFilters())
  const collectionSort = ref('date-desc')

  function resetGameFilters() { gameFilters.value = emptyGameFilters() }
  function resetPlatformFilters() { platformFilters.value = emptyPlatformFilters() }
  function resetLibroFilters() { libroFilters.value = emptyLibroFilters() }

  // ── Estado efímero de "añadir" / modales ────────────────────────────────
  const platformAddMode = ref(false)
  const showConfig = ref(false)
  const showGameManual = ref(false)
  const showPlatformManual = ref(false)
  const showLibroManual = ref(false)
  const pendingAdd = ref(null) // juego pendiente de añadir a la colección
  const sheetGameId = ref(null) // juego de la colección con la ficha abierta

  return {
    dark, drawerOpen, filtersOpen,
    toggleDark, openDrawer, closeDrawer,
    gameFilters, platformFilters, libroFilters, collectionSort,
    resetGameFilters, resetPlatformFilters, resetLibroFilters,
    platformAddMode, showConfig, showGameManual, showPlatformManual, showLibroManual,
    pendingAdd, sheetGameId,
  }
})
