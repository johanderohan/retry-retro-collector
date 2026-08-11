import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dbGetAll, dbAdd, dbRemove } from '../services/api.js'

export const useLibrosStore = defineStore('libros', () => {
  const items = ref([])
  let loaded = false

  async function load() {
    // Libros no está en el alcance offline, pero sin conexión esto rechazaría
    // tras el timeout de axios y dejaría una promesa colgando: App.vue lo llama
    // sin await. Se traga el error y punto.
    try {
      items.value = await dbGetAll('libros')
    } catch { /* sin conexión: la pantalla de Libros ya avisa */ }
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
