<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import CollectionGrid from '../components/CollectionGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import { usePlaygroundStore } from '../stores/playgroundStore.js'
import { useUiStore } from '../stores/uiStore.js'
import { filteredSortedGames } from '../utils/collection.js'

const playground = usePlaygroundStore()
const ui = useUiStore()
const { gameFilters, collectionSort } = storeToRefs(ui)

const filtered = computed(() =>
  filteredSortedGames(playground.games, gameFilters.value, collectionSort.value))

function onPlayground(game) { playground.toggle(game) }
</script>

<template>
  <EmptyState
    v-if="playground.games.length === 0"
    title="Tu Playground está vacío"
    subtitle="Marca los juegos completados con ♥ desde tu colección"
  >
    <template #icon>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </template>
  </EmptyState>

  <EmptyState
    v-else-if="filtered.length === 0"
    subtitle="No hay juegos que coincidan"
    action-label="Limpiar filtros"
    @action="ui.resetGameFilters()"
  >
    <template #icon><span class="text-3xl">🔍</span></template>
  </EmptyState>

  <CollectionGrid
    v-else
    :items="filtered"
    type="game"
    playground
    :in-playground="() => true"
    @playground="onPlayground"
  />
</template>
