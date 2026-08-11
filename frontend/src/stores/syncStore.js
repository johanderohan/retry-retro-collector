import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readSnapshot, writeSnapshot } from '../lib/storage.js'
import { fetchSnapshot, precargarMiniaturas } from '../services/sync.js'
import { useCollectionStore } from './collectionStore.js'
import { useWishlistStore } from './wishlistStore.js'
import { usePlatformsStore } from './platformsStore.js'
import { useConfigStore } from './configStore.js'
import { thumbUrl } from '../utils/covers.js'

export const useSyncStore = defineStore('sync', () => {
  const lastSyncAt = ref(null)
  const syncing = ref(false)
  const online = ref(true)
  const hasData = ref(false)

  function repartir(snapshot) {
    useCollectionStore().setItems(snapshot.collection)
    useWishlistStore().setItems(snapshot.wishlist)
    usePlatformsStore().setItems(snapshot.platforms)
    useConfigStore().setConfig(snapshot.config)
    lastSyncAt.value = snapshot.generatedAt ?? null
    hasData.value = true
  }

  // Síncrono y antes de montar: leer 300 KB de localStorage cuesta
  // milisegundos, así que la primera pintura ya lleva datos.
  function hydrate() {
    const snap = readSnapshot()
    if (snap) repartir(snap)
  }

  async function sync() {
    if (syncing.value) return
    syncing.value = true

    try {
      const fresco = await fetchSnapshot()
      repartir(fresco)
      writeSnapshot(fresco)
      online.value = true

      // En segundo plano y sin await: que la app no dependa de esto.
      precargarMiniaturas(
        fresco.collection.map(g => thumbUrl(g.coverUrl)).filter(Boolean),
      )
    } catch {
      // Sin conexión o NAS inalcanzable: se sigue con lo local, sin ruido.
      online.value = false
    } finally {
      syncing.value = false
    }
  }

  return { lastSyncAt, syncing, online, hasData, hydrate, sync }
})
