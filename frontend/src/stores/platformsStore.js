import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dbAdd, dbRemove, downloadLogo } from '../services/api.js'

export const usePlatformsStore = defineStore('platforms', () => {
  const items = ref([])
  let loaded = false

  function setItems(nuevos) {
    items.value = nuevos ?? []
    loaded = true
  }

  // Los datos llegan del snapshot local (syncStore), no de la red: la app tiene
  // que pintar sin esperar a nadie.
  async function ensureLoaded() { return loaded }

  async function add(platform) {
    await dbAdd('platforms', platform)
    if (!items.value.some(p => p.id === platform.id)) items.value = [platform, ...items.value]
  }

  async function remove(id) {
    await dbRemove('platforms', id)
    items.value = items.value.filter(p => p.id !== id)
  }

  function has(id) { return items.value.some(p => p.id === id) }

  // Descarga el logo remoto antes de persistir (App.jsx:49-55).
  async function addWithLogo(platform) {
    let logoUrl = platform.logoUrl
    if (logoUrl && !logoUrl.startsWith('/logos/')) {
      try { logoUrl = await downloadLogo(logoUrl) } catch { /* fallback URL original */ }
    }
    await add({ ...platform, logoUrl })
  }

  return { items, setItems, ensureLoaded, add, remove, has, addWithLogo }
})
