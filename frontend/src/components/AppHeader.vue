<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppLogo from './AppLogo.vue'
import SearchBar from './SearchBar.vue'
import SearchableSelect from './SearchableSelect.vue'
import SearchDropdown from './SearchDropdown.vue'
import FilterBar from './FilterBar.vue'
import SyncIcon from './SyncIcon.vue'
import { useUiStore } from '../stores/uiStore.js'
import { useSearchStore } from '../stores/searchStore.js'
import { useConfigStore } from '../stores/configStore.js'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const search = useSearchStore()
const configStore = useConfigStore()
const { isConfigured } = storeToRefs(configStore)
const {
  preSearchPlatformId, searchRegionFilter, allSystemsList,
  isLoadingSystems, isLoading, isPlatformLoading, games,
} = storeToRefs(search)

const name = computed(() => route.name)
const filterContext = computed(() => {
  if (name.value === 'collection') return 'collection'
  if (name.value === 'wishlist') return 'wishlist'
  if (name.value === 'playground') return 'playground'
  if (name.value === 'platforms') return 'platforms'
  if (name.value === 'libros') return 'libros'
  return null
})

const isSearch = computed(() => name.value === 'search')
const isPlatforms = computed(() => name.value === 'platforms')
const platformSearchActive = computed(() => isPlatforms.value && ui.platformAddMode)
const showSearchBar = computed(() => isSearch.value || platformSearchActive.value)
const showFilterBar = computed(() =>
  ['collection', 'wishlist', 'playground', 'libros'].includes(name.value) ||
  (isPlatforms.value && !ui.platformAddMode))

// Lazy-load la lista completa de sistemas al entrar en /buscar (configurado)
watch(
  [isSearch, isConfigured],
  ([s, c]) => { if (s && c) search.loadSystems().catch(() => {}) },
  { immediate: true },
)

const searchRegionOptions = computed(() => {
  const set = [...new Set(games.value.map(g => g.regionLabel).filter(Boolean))].sort()
  return set.map(v => ({ value: v, label: v }))
})
const systemOptions = computed(() =>
  allSystemsList.value.map(s => ({ value: s.id, label: s.name })))

function goHome() { ui.resetGameFilters(); router.push('/') }
function addClick() {
  if (name.value === 'libros') { ui.showLibroManual = true; return }
  if (isPlatforms.value) { ui.platformAddMode = true; search.resetPlatformSearch(); return }
  search.resetGameSearch()
  router.push('/buscar')
}
function cancelSearch() {
  search.resetGameSearch()
  router.push('/')
}
function cancelPlatformSearch() {
  ui.platformAddMode = false
  search.resetPlatformSearch()
}

function onGameSearch(query) {
  if (!isConfigured.value) { ui.showConfig = true; return }
  search.searchGames(query)
}
function onPlatformSearch(query) {
  if (!isConfigured.value) { ui.showConfig = true; return }
  search.searchPlatforms(query)
}
</script>

<template>
  <!-- pt-[env(safe-area-inset-top)]: con viewport-fit=cover y la barra de estado
       translúcida, iOS dibuja la app por debajo del notch y los botones quedaban
       tapados por el reloj y el wifi. En pantallas sin notch, env() vale 0. -->
  <header
    class="sticky top-0 z-20 surface rounded-none border-x-0 border-t-0 pt-[env(safe-area-inset-top)]"
  >
    <div class="container-app py-2.5 sm:py-3">
      <div class="flex items-center justify-between mb-2.5 sm:mb-3">
        <button class="flex items-center gap-2 hover:opacity-70 transition-opacity" aria-label="Ir a inicio" @click="goHome">
          <AppLogo :size="26" />
          <h1 class="text-lg font-semibold text-ink tracking-tight">
            Retry<span class="hidden sm:inline"> <span class="font-thin">| </span><span class="text-xs font-thin text-ink-muted">Your retro collection</span></span>
          </h1>
        </button>

        <div class="flex items-center gap-2">
          <SyncIcon />
          <button
            v-if="!showSearchBar"
            class="w-10 h-10 flex items-center justify-center rounded-xl transition-[filter] hover:brightness-110"
            style="background-color: var(--amber); color: #0B0B0F"
            aria-label="Añadir"
            title="Añadir"
            @click="addClick"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          <template v-if="isSearch">
            <button class="btn btn-secondary h-10 px-3 text-sm" title="Añadir juego manualmente" @click="ui.showGameManual = true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              A mano
            </button>
            <button
              class="w-10 h-10 flex items-center justify-center rounded-xl border border-retro-line text-ink-muted hover:text-ink hover:border-retro-amber transition-colors"
              aria-label="Cerrar" title="Cerrar" @click="cancelSearch"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </template>

          <template v-if="platformSearchActive">
            <button class="btn btn-secondary h-10 px-3 text-sm" title="Añadir plataforma manualmente" @click="ui.showPlatformManual = true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              A mano
            </button>
            <button
              class="w-10 h-10 flex items-center justify-center rounded-xl border border-retro-line text-ink-muted hover:text-ink hover:border-retro-amber transition-colors"
              aria-label="Cerrar" title="Cerrar" @click="cancelPlatformSearch"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </template>

        </div>
      </div>

      <SearchBar
        v-if="platformSearchActive"
        :is-loading="isPlatformLoading"
        placeholder="Buscar consola, ordenador o periférico..."
        @search="onPlatformSearch"
      />

      <div v-else-if="isSearch" class="flex flex-col gap-2">
        <SearchBar :is-loading="isLoading" @search="onGameSearch" />
        <div v-if="isConfigured" class="flex gap-2">
          <SearchableSelect
            v-model="preSearchPlatformId"
            placeholder="Todas las plataformas"
            :options="systemOptions"
            :loading="isLoadingSystems"
          />
          <SearchDropdown
            v-if="searchRegionOptions.length > 0"
            v-model="searchRegionFilter"
            placeholder="Todas las regiones"
            :options="searchRegionOptions"
          />
        </div>
      </div>

      <FilterBar v-else-if="showFilterBar" :context="filterContext" />

      <p v-if="!isConfigured && (isSearch || isPlatforms)" class="text-xs text-retro-amber mt-2 pb-1">
        Configura tus credenciales de ScreenScraper para empezar
      </p>
    </div>
  </header>
</template>
