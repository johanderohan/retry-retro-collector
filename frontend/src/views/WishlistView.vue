<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import CollectionGrid from '../components/CollectionGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import { useWishlistStore } from '../stores/wishlistStore.js'
import { useUiStore } from '../stores/uiStore.js'
import { useConfirm } from '../composables/useConfirm.js'
import { filteredSortedGames } from '../utils/collection.js'

const wishlist = useWishlistStore()
const ui = useUiStore()
const { confirm } = useConfirm()
const { gameFilters, collectionSort } = storeToRefs(ui)

const filtered = computed(() =>
  filteredSortedGames(wishlist.items, gameFilters.value, collectionSort.value))

function onAdd(game) { ui.pendingAdd = game }
async function onRemove(id) {
  const game = wishlist.items.find(g => g.id === id)
  if (!game) return
  if (await confirm('¿Eliminar de la wishlist?', `"${game.title}" se eliminará de tu wishlist.`)) {
    await wishlist.remove(id)
  }
}
</script>

<template>
  <EmptyState
    v-if="wishlist.items.length === 0"
    title="Tu wishlist está vacía"
    subtitle="Pulsa + Añadir para buscar juegos"
  >
    <template #icon>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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
    add
    remove
    @add="onAdd"
    @remove="onRemove"
  />
</template>
