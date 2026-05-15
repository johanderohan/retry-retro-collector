import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dbGetAll, dbAdd, dbRemove } from '../services/api.js'

export const useLibrosStore = defineStore('libros', () => {
  const items = ref([])
  let loaded = false

  async function load() {
    items.value = await dbGetAll('libros')
    loaded = true
  }
  async function ensureLoaded() { if (!loaded) await load() }

  async function add(libro) {
    await dbAdd('libros', libro)
    if (!items.value.some(l => l.id === libro.id)) items.value = [libro, ...items.value]
  }

  async function remove(id) {
    await dbRemove('libros', id)
    items.value = items.value.filter(l => l.id !== id)
  }

  return { items, load, ensureLoaded, add, remove }
})
