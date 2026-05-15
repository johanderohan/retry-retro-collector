import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dbGetAll, dbAdd, dbRemove } from '../services/api.js'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref([])
  let loaded = false

  async function load() {
    items.value = await dbGetAll('wishlist')
    loaded = true
  }
  async function ensureLoaded() { if (!loaded) await load() }

  async function add(game) {
    await dbAdd('wishlist', game)
    if (!items.value.some(g => g.id === game.id)) items.value = [game, ...items.value]
  }

  async function remove(id) {
    await dbRemove('wishlist', id)
    items.value = items.value.filter(g => g.id !== id)
  }

  function inWishlist(id) { return items.value.some(g => g.id === id) }

  return { items, load, ensureLoaded, add, remove, inWishlist }
})
