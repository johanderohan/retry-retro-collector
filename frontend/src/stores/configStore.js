import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { configSave } from '../services/api.js'

export const useConfigStore = defineStore('config', () => {
  const config = ref({})

  function setConfig(nueva) {
    config.value = nueva ?? {}
  }

  // Ya no espera a la red: la config viene del snapshot. Se mantiene el nombre
  // fetch() porque lo llama el guard del router.
  async function fetch() { return config.value }

  async function save(newConfig) {
    config.value = newConfig
    await configSave(newConfig)
  }

  const isConfigured = computed(() => !!config.value.devid && !!config.value.devpassword)

  return { config, setConfig, fetch, save, isConfigured }
})
