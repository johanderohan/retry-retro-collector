import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dbGetAll, dbAdd, dbRemove, downloadLogo } from '../services/api.js'

export const usePlatformsStore = defineStore('platforms', () => {
  const items = ref([])
  let loaded = false

  async function load() {
    items.value = await dbGetAll('platforms')
    loaded = true
  }
  async function ensureLoaded() { if (!loaded) await load() }

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

  return { items, load, ensureLoaded, add, remove, has, addWithLogo }
})
