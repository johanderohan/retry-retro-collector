<script setup>
import { computed } from 'vue'
import GameCard from './GameCard.vue'
import GameRow from './GameRow.vue'
import GameTile from './GameTile.vue'
import PlatformCard from './PlatformCard.vue'
import LibroCard from './LibroCard.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  type: { type: String, required: true }, // 'game' | 'platform' | 'libro'
  forceList: { type: Boolean, default: false }, // resultados de búsqueda: siempre filas
  tiles: { type: Boolean, default: false }, // galería de solo portadas (colección)
  add: { type: Boolean, default: false },
  wishlist: { type: Boolean, default: false },
  playground: { type: Boolean, default: false },
  remove: { type: Boolean, default: false },
  inCollection: { type: Function, default: () => false },
  inWishlist: { type: Function, default: () => false },
  inPlayground: { type: Function, default: () => false },
})
const emit = defineEmits(['add', 'wishlist', 'playground', 'remove', 'open'])

// Solo los resultados de búsqueda de juegos van en filas; el resto, en rejilla.
const isList = computed(() => props.forceList && props.type === 'game')

const comp = computed(() => {
  if (props.type === 'platform') return PlatformCard
  if (props.type === 'libro') return LibroCard
  if (isList.value) return GameRow
  return props.tiles ? GameTile : GameCard
})
const itemKey = it => it.id

function bindFor(it) {
  if (props.type === 'platform') {
    return { platform: it, add: props.add, remove: props.remove, inCollection: props.inCollection(it) }
  }
  if (props.type === 'libro') {
    return { libro: it, remove: props.remove }
  }
  return {
    game: it,
    add: props.add, wishlist: props.wishlist, playground: props.playground, remove: props.remove,
    inCollection: props.inCollection(it),
    inWishlist: props.inWishlist(it),
    inPlayground: props.inPlayground(it),
  }
}
</script>

<template>
  <div :class="isList ? 'flex flex-col gap-2' : (tiles && type === 'game' ? 'grid-tiles' : 'grid-covers')">
    <component
      :is="comp"
      v-for="it in items"
      :key="itemKey(it)"
      v-bind="bindFor(it)"
      @add="emit('add', $event)"
      @wishlist="emit('wishlist', $event)"
      @playground="emit('playground', $event)"
      @remove="emit('remove', $event)"
      @open="emit('open', $event)"
    />
  </div>
</template>
