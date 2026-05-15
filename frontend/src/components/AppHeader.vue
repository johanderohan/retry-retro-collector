<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppLogo from './AppLogo.vue'
import SearchBar from './SearchBar.vue'
import SearchableSelect from './SearchableSelect.vue'
import SearchDropdown from './SearchDropdown.vue'
import FilterBar from './FilterBar.vue'
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

function goHome() { router.push('/') }
function addClick() {
  if (name.value === 'libros') { ui.showLibroManual = true; return }
  if (isPlatforms.value) { ui.platformAddMode = true; search.resetPlatformSearch(); return }
  search.resetGameSearch()
  router.push('/buscar')
}
function cancelSearch() {
  search.resetGameSearch()
  router.push('/coleccion')
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
  <header class="sticky top-0 z-20 surface rounded-none border-x-0 border-t-0">
    <div class="container-app py-4">
      <div class="flex items-center justify-between mb-4">
        <button class="flex items-center gap-2 hover:opacity-70 transition-opacity" aria-label="Ir a inicio" @click="goHome">
          <AppLogo :size="26" />
          <h1 class="text-lg font-semibold text-ink tracking-tight">
            Retry <span class="font-thin">| </span><span class="text-xs font-thin text-ink-muted">Your retro collection</span>
          </h1>
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="!showSearchBar"
            class="btn btn-primary text-xs py-1.5 px-2.5"
            @click="addClick"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
            </svg>
            Añadir
          </button>

          <template v-if="isSearch">
            <button class="btn btn-secondary text-xs py-1.5 px-2.5" title="Añadir juego manualmente" @click="ui.showGameManual = true">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
              </svg>
              Manual
            </button>
            <button class="btn btn-ghost text-xs py-1.5 px-2" @click="cancelSearch">Cancelar</button>
          </template>

          <template v-if="platformSearchActive">
            <button class="btn btn-secondary text-xs py-1.5 px-2.5" title="Añadir plataforma manualmente" @click="ui.showPlatformManual = true">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
              </svg>
              Manual
            </button>
            <button class="btn btn-ghost text-xs py-1.5 px-2" @click="cancelPlatformSearch">Cancelar</button>
          </template>

          <button
            class="p-1.5 text-ink-dim hover:text-ink rounded-lg transition-colors"
            aria-label="Abrir menú"
            @click="ui.openDrawer()"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
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
        ⚠️ Configura tus credenciales de ScreenScraper para empezar
      </p>
    </div>
  </header>
</template>
