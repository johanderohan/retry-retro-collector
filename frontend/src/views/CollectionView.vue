<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import CollectionGrid from '../components/CollectionGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import { useCollectionStore } from '../stores/collectionStore.js'
import { usePlaygroundStore } from '../stores/playgroundStore.js'
import { useUiStore } from '../stores/uiStore.js'
import { useConfirm } from '../composables/useConfirm.js'
import { filteredSortedGames } from '../utils/collection.js'

const collection = useCollectionStore()
const playground = usePlaygroundStore()
const ui = useUiStore()
const { confirm } = useConfirm()
const { gameFilters, collectionSort } = storeToRefs(ui)

const filtered = computed(() =>
  filteredSortedGames(collection.items, gameFilters.value, collectionSort.value))

async function onRemove(id) {
  const game = collection.items.find(g => g.id === id)
  if (!game) return
  if (await confirm('¿Eliminar juego?', `"${game.title}" se eliminará de tu colección.`)) {
    await collection.remove(id)
  }
}
function onPlayground(game) { playground.toggle(game) }
</script>

<template>
  <EmptyState
    v-if="collection.items.length === 0"
    title="Tu colección está vacía"
    subtitle="Pulsa + Añadir para buscar tu primer juego"
  >
    <template #icon><span class="text-4xl">🕹️</span></template>
  </EmptyState>

  <EmptyState
    v-else-if="filtered.length === 0"
    title=""
    subtitle="No hay juegos que coincidan con los filtros"
    action-label="Limpiar filtros"
    @action="ui.resetGameFilters()"
  >
    <template #icon><span class="text-3xl">🔍</span></template>
  </EmptyState>

  <CollectionGrid
    v-else
    :items="filtered"
    type="game"
    remove
    playground
    :in-playground="g => !!g.inPlayground"
    @remove="onRemove"
    @playground="onPlayground"
  />
</template>
