<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '../stores/uiStore.js'
import { useCollectionStore } from '../stores/collectionStore.js'
import { useWishlistStore } from '../stores/wishlistStore.js'
import { usePlaygroundStore } from '../stores/playgroundStore.js'
import { usePlatformsStore } from '../stores/platformsStore.js'
import { useLibrosStore } from '../stores/librosStore.js'
import { SORT_OPTIONS } from '../utils/constants.js'

// context: 'collection' | 'wishlist' | 'playground' | 'platforms' | 'libros'
const props = defineProps({ context: { type: String, required: true } })

const ui = useUiStore()
const collection = useCollectionStore()
const wishlist = useWishlistStore()
const playground = usePlaygroundStore()
const platforms = usePlatformsStore()
const libros = useLibrosStore()
const { filtersOpen } = storeToRefs(ui)

const isPlatforms = computed(() => props.context === 'platforms')
const isLibros = computed(() => props.context === 'libros')

const uniqSorted = (arr, key) =>
  [...new Set(arr.map(x => x[key]).filter(Boolean))].sort()

const gameSource = computed(() =>
  props.context === 'wishlist' ? wishlist.items
  : props.context === 'playground' ? playground.games
  : collection.items)

const placeholder = computed(() => ({
  collection: '¿Lo tengo? Busca un juego',
  wishlist: 'Buscar en tu wishlist',
  playground: 'Buscar en tu Playground',
  platforms: 'Buscar en tu hardware',
  libros: 'Buscar en tus libros',
}[props.context] ?? 'Buscar...'))

const filters = computed({
  get() {
    return isLibros.value ? ui.libroFilters
      : isPlatforms.value ? ui.platformFilters
      : ui.gameFilters
  },
  set() {},
})

const dropdowns = computed(() => {
  if (isLibros.value) {
    return [{ key: 'tipo', label: 'Todos los tipos', options: uniqSorted(libros.items, 'tipo') }]
  }
  if (isPlatforms.value) {
    return [
      { key: 'type', label: 'Todos los tipos', options: uniqSorted(platforms.items, 'type') },
      { key: 'company', label: 'Todas las marcas', options: uniqSorted(platforms.items, 'company') },
    ]
  }
  return [
    { key: 'platform', label: 'Consola', options: uniqSorted(gameSource.value, 'platform') },
    { key: 'region', label: 'Región', options: uniqSorted(gameSource.value, 'regionLabel') },
  ]
})

const showSort = computed(() => !isPlatforms.value && !isLibros.value)

// Con el panel plegado, el icono avisa de cuántos filtros siguen aplicados.
const activeCount = computed(() =>
  dropdowns.value.filter(d => filters.value[d.key]).length +
  (showSort.value && ui.collectionSort !== 'date-desc' ? 1 : 0))
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Name + botón de filtros -->
    <div class="flex gap-2">
    <div class="relative flex-1 min-w-0">
      <span class="search-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        v-model="filters.name"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        :placeholder="placeholder"
        :aria-label="placeholder"
        class="input search-input"
      />
      <button
        v-if="filters.name"
        type="button"
        class="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ink-dim hover:text-ink transition-colors"
        aria-label="Borrar búsqueda"
        @click="filters.name = ''"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
      <button
        type="button"
        class="relative flex-none w-10 h-10 flex items-center justify-center rounded-[0.6rem] border transition-colors"
        :class="filtersOpen || activeCount
          ? 'border-retro-amber text-retro-amber'
          : 'border-retro-line text-ink-muted hover:text-ink'"
        :aria-expanded="filtersOpen"
        aria-controls="filter-panel"
        :aria-label="filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'"
        :title="filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'"
        @click="filtersOpen = !filtersOpen"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="17" x2="20" y2="17" />
          <circle cx="9" cy="7" r="2.5" fill="var(--panel)" /><circle cx="15" cy="17" r="2.5" fill="var(--panel)" />
        </svg>
        <span
          v-if="activeCount"
          class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-retro-amber text-retro-dark text-[10px] font-bold flex items-center justify-center"
        >{{ activeCount }}</span>
      </button>
    </div>

    <!-- Dropdowns + sort (plegados por defecto) -->
    <div v-show="filtersOpen" id="filter-panel" class="flex gap-2">
      <div v-for="d in dropdowns" :key="d.key" class="relative flex-1 min-w-0">
        <select
          v-model="filters[d.key]"
          class="input text-xs h-9 py-0 pl-2.5 pr-5 appearance-none cursor-pointer truncate"
          :class="filters[d.key] && 'input-active'"
        >
          <option value="">{{ d.label }}</option>
          <option v-for="v in d.options" :key="v" :value="v">{{ v }}</option>
        </select>
        <svg class="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2,4 6,8 10,4" />
        </svg>
      </div>

      <div v-if="showSort" class="relative flex-1 min-w-0">
        <select
          v-model="ui.collectionSort"
          class="input text-xs h-9 py-0 pl-2.5 pr-5 appearance-none cursor-pointer truncate"
          :class="ui.collectionSort !== 'date-desc' && 'input-active'"
        >
          <option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <svg class="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2,4 6,8 10,4" />
        </svg>
      </div>
    </div>
  </div>
</template>
