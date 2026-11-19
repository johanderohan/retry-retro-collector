<script setup>
import IconAlert from '../components/IconAlert.vue'
import IconGamepad from '../components/IconGamepad.vue'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import CollectionGrid from '../components/CollectionGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import IconSearch from '../components/IconSearch.vue'
import { useSearchStore } from '../stores/searchStore.js'
import { useWishlistStore } from '../stores/wishlistStore.js'
import { useCollectionStore } from '../stores/collectionStore.js'
import { useUiStore } from '../stores/uiStore.js'
import { useSyncStore } from '../stores/syncStore.js'
import NeedsConnection from '../components/NeedsConnection.vue'
import PageTitle from '../components/PageTitle.vue'

const search = useSearchStore()
const wishlist = useWishlistStore()
const collection = useCollectionStore()
const ui = useUiStore()
const sync = useSyncStore()
const {
  games, isLoading, error, lastQuery, hasSearched, pageInfo, searchRegionFilter,
} = storeToRefs(search)

const filteredGames = computed(() =>
  searchRegionFilter.value
    ? games.value.filter(g => g.regionLabel === searchRegionFilter.value)
    : games.value)

const distinctGames = computed(() => new Set(games.value.map(g => g.gameId)).size)
const isFiltered = computed(() => filteredGames.value.length < games.value.length)

// Versiones (juego × consola × región) que ya están en la colección.
const ownedIds = computed(() => new Set(collection.items.map(g => g.gameId)))

function onAdd(game) { ui.pendingAdd = game }
function onWishlist(game) { wishlist.add(game) }
function clearRegion() { search.searchRegionFilter = '' }
</script>

<template>
  <PageTitle title="Añadir juego" />

  <NeedsConnection v-if="!sync.online" accion="buscar juegos nuevos" />

  <template v-else>
  <EmptyState v-if="isLoading" subtitle="Buscando en ScreenScraper… suele tardar entre 10 y 20 segundos">
    <template #icon><IconGamepad class="animate-pulse" /></template>
  </EmptyState>

  <div v-else-if="error" class="flex flex-col items-center justify-center min-h-64 gap-4">
    <div class="surface max-w-md w-full p-6 text-center border border-retro-red/40">
      <IconAlert class="mx-auto mb-3 text-retro-red" />
      <p class="text-sm text-retro-red mb-2">{{ error }}</p>
      <p class="text-xs text-ink-dim mb-4">Revisa las credenciales de ScreenScraper o añade el juego a mano.</p>
      <button class="btn btn-secondary text-xs" @click="ui.showConfig = true">Abrir configuración</button>
    </div>
  </div>

  <EmptyState
    v-else-if="hasSearched && games.length === 0"
    :subtitle="`No se encontraron resultados para «${lastQuery}»`"
    action-label="Añadir manualmente"
    @action="ui.showGameManual = true"
  >
    <template #icon><IconSearch /></template>
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
      <template #icon><IconSearch /></template>
    </EmptyState>

    <CollectionGrid
      v-else
      :items="filteredGames"
      type="game"
      add
      wishlist
      force-gallery
      :in-collection="g => ownedIds.has(g.id)"
      :in-wishlist="g => wishlist.inWishlist(g.id)"
      @open="onAdd"
      @add="onAdd"
      @wishlist="onWishlist"
    />
  </template>

  <EmptyState
    v-else
    title="Busca un juego"
    subtitle="Escribe el título y pulsa Buscar. Puede tardar unos segundos."
    action-label="o añadir manualmente"
    @action="ui.showGameManual = true"
  >
    <template #icon><IconSearch /></template>
  </EmptyState>
</template>
</template>
