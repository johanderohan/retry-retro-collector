import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { configLoad, configSave } from '../services/api.js'

export const useConfigStore = defineStore('config', () => {
  const config = ref({})
  let inFlight = null

  function fetch() {
    if (inFlight) return inFlight
    inFlight = configLoad().then(c => { config.value = c })
    return inFlight
  }

  async function save(newConfig) {
    config.value = newConfig
    await configSave(newConfig)
  }

  const isConfigured = computed(() => !!config.value.devid && !!config.value.devpassword)

  return { config, fetch, save, isConfigured }
})
