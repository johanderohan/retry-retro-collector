<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import CollectionGrid from '../components/CollectionGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import IconSearch from '../components/IconSearch.vue'
import PageTitle from '../components/PageTitle.vue'
import { usePlaygroundStore } from '../stores/playgroundStore.js'
import { useUiStore } from '../stores/uiStore.js'
import { filteredSortedGames } from '../utils/collection.js'

const playground = usePlaygroundStore()
const ui = useUiStore()
const { gameFilters, collectionSort } = storeToRefs(ui)

const filtered = computed(() =>
  filteredSortedGames(playground.games, gameFilters.value, collectionSort.value))
const stats = computed(() => [
  { value: playground.games.length, label: playground.games.length === 1 ? 'juego' : 'juegos' },
  { value: new Set(playground.games.map(g => g.platform).filter(Boolean)).size, label: 'consolas' },
])

function onPlayground(game) { playground.toggle(game) }
function onOpen(game) { ui.sheetGameId = game.id }
</script>

<template>
  <PageTitle title="Playground" :stats="playground.games.length ? stats : []" />

  <EmptyState
    v-if="playground.games.length === 0"
    title="Tu Playground está vacío"
    subtitle="Marca juegos con el corazón desde tu colección"
  >
    <template #icon>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
        <path d="M12 20.5 4.3 12.9a4.9 4.9 0 0 1 6.9-6.9l.8.8.8-.8a4.9 4.9 0 0 1 6.9 6.9L12 20.5Z" />
      </svg>
    </template>
  </EmptyState>

  <EmptyState
    v-else-if="filtered.length === 0"
    subtitle="No hay juegos que coincidan"
    action-label="Limpiar filtros"
    @action="ui.resetGameFilters()"
  >
    <template #icon><IconSearch /></template>
  </EmptyState>

  <CollectionGrid
    v-else
    :items="filtered"
    type="game"
    tiles
    playground
    :in-playground="() => true"
    @playground="onPlayground"
    @open="onOpen"
  />
</template>
