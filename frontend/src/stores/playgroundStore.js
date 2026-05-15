import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCollectionStore } from './collectionStore.js'

// Sin red: playground = colección filtrada por inPlayground.
export const usePlaygroundStore = defineStore('playground', () => {
  const collection = useCollectionStore()

  const games = computed(() => collection.items.filter(g => g.inPlayground))

  function toggle(game) {
    return collection.update({ ...game, inPlayground: !game.inPlayground })
  }

  return { games, toggle }
})
