<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '../stores/uiStore.js'

// Menú inferior, en móvil y en escritorio: lo que antes estaba escondido en la
// hamburguesa. «Más» abre el cajón con el resto (plataformas, libros, ajustes).
const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const tabs = [
  { label: 'Colección', name: 'collection', path: '/' },
  { label: 'Wishlist',  name: 'wishlist',   path: '/wishlist' },
  { label: 'Playground', name: 'playground', path: '/playground' },
]
function go(tab) {
  if (tab.name === 'collection') ui.resetGameFilters()
  router.push(tab.path)
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-20 bg-retro-panel border-t border-retro-line pb-[env(safe-area-inset-bottom)]"
    aria-label="Secciones"
  >
    <div class="grid grid-cols-4 max-w-xl mx-auto">
    <button
      v-for="t in tabs"
      :key="t.name"
      class="flex flex-col items-center justify-center gap-0.5 h-14 sm:h-16 text-[11px] sm:text-xs font-medium transition-colors"
      :class="route.name === t.name ? 'text-retro-amber' : 'text-ink-dim'"
      :aria-current="route.name === t.name ? 'page' : undefined"
      @click="go(t)"
    >
      <svg v-if="t.name === 'collection'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      <svg v-else-if="t.name === 'wishlist'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 11v3M5.5 12.5h3M16 11.5h.01M18 13.5h.01" />
      </svg>
      {{ t.label }}
    </button>
    <button
      class="flex flex-col items-center justify-center gap-0.5 h-14 sm:h-16 text-[11px] sm:text-xs font-medium text-ink-dim"
      @click="ui.openDrawer()"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
        <path d="M5 12h.01M12 12h.01M19 12h.01" />
      </svg>
      Más
    </button>
    </div>
  </nav>
</template>
