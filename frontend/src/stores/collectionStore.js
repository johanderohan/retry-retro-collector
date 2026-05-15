import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dbGetAll, dbAdd, dbRemove, downloadCover } from '../services/api.js'
import { useWishlistStore } from './wishlistStore.js'

export const useCollectionStore = defineStore('collection', () => {
  const items = ref([])
  let loaded = false

  async function load() {
    items.value = await dbGetAll('collection')
    loaded = true
  }
  async function ensureLoaded() { if (!loaded) await load() }

  async function add(game) {
    await dbAdd('collection', game)
    if (!items.value.some(g => g.id === game.id)) items.value = [game, ...items.value]
  }

  async function remove(id) {
    await dbRemove('collection', id)
    items.value = items.value.filter(g => g.id !== id)
  }

  async function update(game) {
    await dbAdd('collection', game)
    items.value = items.value.map(g => (g.id === game.id ? game : g))
  }

  function has(id) { return items.value.some(g => g.id === id) }

  // Flujo "añadir a la colección" portado de App.jsx:788-796:
  // descarga la portada remota antes de persistir y promueve desde wishlist.
  async function addFromModal(source, { condition, esSpanish, coverUrl, isPlatino }) {
    let finalCover = coverUrl || source.coverUrl
    if (finalCover && !finalCover.startsWith('/covers/')) {
      try { finalCover = await downloadCover(finalCover) } catch { /* fallback URL original */ }
    }
    await add({
      ...source,
      id: `${source.id}-${Date.now()}`,
      gameId: source.id,
      condition, esSpanish, isPlatino,
      coverUrl: finalCover,
      addedAt: Date.now(),
    })
    const wishlist = useWishlistStore()
    if (wishlist.inWishlist(source.id)) await wishlist.remove(source.id)
  }

  return { items, load, ensureLoaded, add, remove, update, has, addFromModal }
})
