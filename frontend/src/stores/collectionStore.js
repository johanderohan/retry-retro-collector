import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dbAdd, dbRemove, downloadCover } from '../services/api.js'
import { useWishlistStore } from './wishlistStore.js'

export const useCollectionStore = defineStore('collection', () => {
  const items = ref([])
  let loaded = false

  function setItems(nuevos) {
    items.value = nuevos ?? []
    loaded = true
  }

  // Los datos llegan del snapshot local (syncStore), no de la red: la app tiene
  // que pintar sin esperar a nadie.
  async function ensureLoaded() { return loaded }

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

  return { items, setItems, ensureLoaded, add, remove, update, has, addFromModal }
})
