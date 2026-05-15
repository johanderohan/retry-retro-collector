<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import CollectionGrid from '../components/CollectionGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import { useSearchStore } from '../stores/searchStore.js'
import { useWishlistStore } from '../stores/wishlistStore.js'
import { useUiStore } from '../stores/uiStore.js'

const search = useSearchStore()
const wishlist = useWishlistStore()
const ui = useUiStore()
const {
  games, isLoading, error, lastQuery, hasSearched, pageInfo, searchRegionFilter,
} = storeToRefs(search)

const filteredGames = computed(() =>
  searchRegionFilter.value
    ? games.value.filter(g => g.regionLabel === searchRegionFilter.value)
    : games.value)

const distinctGames = computed(() => new Set(games.value.map(g => g.gameId)).size)
const isFiltered = computed(() => filteredGames.value.length < games.value.length)

function onAdd(game) { ui.pendingAdd = game }
function onWishlist(game) { wishlist.add(game) }
function clearRegion() { search.searchRegionFilter = '' }
</script>

<template>
  <EmptyState v-if="isLoading" subtitle="Buscando...">
    <template #icon><span class="text-3xl animate-pulse">🕹️</span></template>
  </EmptyState>

  <div v-else-if="error" class="flex flex-col items-center justify-center min-h-64 gap-4">
    <div class="surface max-w-md w-full p-6 text-center border border-retro-red/40">
      <span class="text-2xl block mb-3">⚠️</span>
      <p class="text-sm text-retro-red mb-2">{{ error }}</p>
      <p class="text-xs text-ink-dim mb-4">Verifica tus credenciales o abre DevTools (F12) para más detalle</p>
      <button class="btn btn-secondary text-xs" @click="ui.showConfig = true">Abrir configuración</button>
    </div>
  </div>

  <EmptyState
    v-else-if="hasSearched && games.length === 0"
    :subtitle="`No se encontraron resultados para «${lastQuery}»`"
    action-label="Añadir manualmente"
    @action="ui.showGameManual = true"
  >
    <template #icon><span class="text-3xl">🔍</span></template>
  </EmptyState>

  <template v-else-if="hasSearched && games.length > 0">
    <p class="text-xs text-ink-dim mb-5">
      <template v-if="isFiltered">
        <span class="font-medium text-ink">{{ filteredGames.length }}</span> de
        <span class="font-medium text-ink">{{ games.length }}</span>
        versión{{ games.length !== 1 ? 'es' : '' }} para
        <span class="text-ink-muted">"{{ lastQuery }}"</span>
        <button class="ml-2 text-ink-dim hover:text-ink underline underline-offset-2 transition-colors" @click="clearRegion">
          Limpiar filtros
        </button>
      </template>
      <template v-else>
        <span class="font-medium text-ink">{{ games.length }}</span>
        versión{{ games.length !== 1 ? 'es' : '' }} en
        <span class="font-medium text-ink">{{ distinctGames }}</span>
        juego{{ distinctGames !== 1 ? 's' : '' }} para
        <span class="text-ink-muted">"{{ lastQuery }}"</span>
        <span v-if="pageInfo.totalPages > 1" class="ml-2 text-ink-dim">· {{ pageInfo.pagesLoaded }}/{{ pageInfo.totalPages }} pág.</span>
      </template>
    </p>

    <EmptyState
      v-if="filteredGames.length === 0"
      subtitle="Ningún resultado coincide con los filtros"
      action-label="Limpiar filtros"
      @action="clearRegion"
    >
      <template #icon><span class="text-3xl">🔍</span></template>
    </EmptyState>

    <CollectionGrid
      v-else
      :items="filteredGames"
      type="game"
      add
      wishlist
      force-gallery
      :in-wishlist="g => wishlist.inWishlist(g.id)"
      @add="onAdd"
      @wishlist="onWishlist"
    />
  </template>

  <EmptyState
    v-else
    title="Busca un juego"
    subtitle="Escribe el nombre de un juego para buscarlo en ScreenScraper"
    action-label="o añadir manualmente"
    @action="ui.showGameManual = true"
  >
    <template #icon><span class="text-3xl">🔍</span></template>
  </EmptyState>
</template>
