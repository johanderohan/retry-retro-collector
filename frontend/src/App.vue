<script setup>
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppDrawer from './components/AppDrawer.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import ConfigModal from './components/ConfigModal.vue'
import AddGameManualModal from './components/AddGameManualModal.vue'
import AddPlatformManualModal from './components/AddPlatformManualModal.vue'
import AddLibroManualModal from './components/AddLibroManualModal.vue'
import AddToCollectionModal from './components/AddToCollectionModal.vue'
import { useUiStore } from './stores/uiStore.js'
import { useCollectionStore } from './stores/collectionStore.js'
import { usePlatformsStore } from './stores/platformsStore.js'
import { useLibrosStore } from './stores/librosStore.js'
import { useWishlistStore } from './stores/wishlistStore.js'

const ui = useUiStore()
const collection = useCollectionStore()
const platforms = usePlatformsStore()
const libros = useLibrosStore()
const wishlist = useWishlistStore()

// Carga inicial de todos los datos (la wishlist y la colección se necesitan
// de forma cruzada: promoción wishlist→colección, badges, dashboard).
onMounted(() => {
  collection.ensureLoaded()
  wishlist.ensureLoaded()
  platforms.ensureLoaded()
  libros.ensureLoaded()
})

function onManualGame(game) {
  ui.showGameManual = false
  ui.pendingAdd = game
}
async function onManualPlatform(platform) {
  await platforms.add(platform)
  ui.showPlatformManual = false
  ui.platformAddMode = false
}
async function onManualLibro(libro) {
  await libros.add(libro)
  ui.showLibroManual = false
}
async function onConfirmAdd(payload) {
  await collection.addFromModal(ui.pendingAdd, payload)
  ui.pendingAdd = null
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />
    <main class="flex-1 container-app py-8">
      <RouterView />
    </main>

    <AppDrawer />
    <ConfirmModal />

    <ConfigModal v-if="ui.showConfig" @close="ui.showConfig = false" />

    <AddGameManualModal
      v-if="ui.showGameManual"
      @confirm="onManualGame"
      @cancel="ui.showGameManual = false"
    />
    <AddPlatformManualModal
      v-if="ui.showPlatformManual"
      @confirm="onManualPlatform"
      @cancel="ui.showPlatformManual = false"
    />
    <AddLibroManualModal
      v-if="ui.showLibroManual"
      @confirm="onManualLibro"
      @cancel="ui.showLibroManual = false"
    />
    <AddToCollectionModal
      v-if="ui.pendingAdd"
      :game="ui.pendingAdd"
      @confirm="onConfirmAdd"
      @cancel="ui.pendingAdd = null"
    />
  </div>
</template>
