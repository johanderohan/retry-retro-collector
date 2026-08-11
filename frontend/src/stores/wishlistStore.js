import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dbAdd, dbRemove } from '../services/api.js'

export const useWishlistStore = defineStore('wishlist', () => {
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
    await dbAdd('wishlist', game)
    if (!items.value.some(g => g.id === game.id)) items.value = [game, ...items.value]
  }

  async function remove(id) {
    await dbRemove('wishlist', id)
    items.value = items.value.filter(g => g.id !== id)
  }

  function inWishlist(id) { return items.value.some(g => g.id === id) }

  return { items, setItems, ensureLoaded, add, remove, inWishlist }
})
