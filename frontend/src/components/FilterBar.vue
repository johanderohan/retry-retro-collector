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
const { density } = storeToRefs(ui)

const isPlatforms = computed(() => props.context === 'platforms')
const isLibros = computed(() => props.context === 'libros')

const uniqSorted = (arr, key) =>
  [...new Set(arr.map(x => x[key]).filter(Boolean))].sort()

const gameSource = computed(() =>
  props.context === 'wishlist' ? wishlist.items
  : props.context === 'playground' ? playground.games
  : collection.items)

const placeholder = computed(() => ({
  collection: 'Buscar en tu colección...',
  wishlist: 'Buscar en tu wishlist...',
  playground: 'Buscar en tu playground...',
  platforms: 'Buscar en tus plataformas...',
  libros: 'Buscar en tus libros...',
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
    { key: 'platform', label: 'Todas las plataformas', options: uniqSorted(gameSource.value, 'platform') },
    { key: 'region', label: 'Todas las regiones', options: uniqSorted(gameSource.value, 'regionLabel') },
  ]
})

const showSort = computed(() => !isPlatforms.value && !isLibros.value)
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Name -->
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        v-model="filters.name"
        type="text"
        :placeholder="placeholder"
        class="input pl-9 pr-8"
      />
      <button
        v-if="filters.name"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink transition-colors"
        @click="filters.name = ''"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Dropdowns + sort + density -->
    <div class="flex gap-2">
      <div v-for="d in dropdowns" :key="d.key" class="relative flex-1 min-w-0">
        <select
          v-model="filters[d.key]"
          class="input text-xs py-1.5 pr-6 appearance-none cursor-pointer"
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
          class="input text-xs py-1.5 pr-6 appearance-none cursor-pointer"
          :class="ui.collectionSort !== 'date-desc' && 'input-active'"
        >
          <option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <svg class="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2,4 6,8 10,4" />
        </svg>
      </div>

      <!-- Density toggle -->
      <div class="flex rounded-lg border border-retro-line overflow-hidden flex-shrink-0">
        <button
          type="button"
          class="px-2.5 py-1.5 transition-colors"
          :class="density === 'gallery' ? 'bg-retro-amber text-retro-dark' : 'text-ink-dim hover:text-ink'"
          title="Galería"
          @click="ui.setDensity('gallery')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        </button>
        <button
          type="button"
          class="px-2.5 py-1.5 transition-colors"
          :class="density === 'list' ? 'bg-retro-amber text-retro-dark' : 'text-ink-dim hover:text-ink'"
          title="Lista"
          @click="ui.setDensity('list')"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
