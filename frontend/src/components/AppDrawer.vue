<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '../stores/uiStore.js'
import { useCollectionStore } from '../stores/collectionStore.js'
import { useConfigStore } from '../stores/configStore.js'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const collection = useCollectionStore()
const configStore = useConfigStore()

const nav = [
  { label: 'Inicio',      name: 'dashboard',  path: '/' },
  { label: 'Colección',   name: 'collection', path: '/coleccion' },
  { label: 'Plataformas', name: 'platforms',  path: '/plataformas' },
  { label: 'Libros',      name: 'libros',     path: '/libros' },
  { label: 'Wishlist',    name: 'wishlist',   path: '/wishlist' },
  { label: 'Playground',  name: 'playground', path: '/playground' },
]
const count = computed(() => collection.items.length)

function go(path) { router.push(path); ui.closeDrawer() }
function openConfig() { ui.closeDrawer(); ui.showConfig = true }
</script>

<template>
  <Transition name="fade">
    <div v-if="ui.drawerOpen" class="fixed inset-0 z-30 flex" @click="ui.closeDrawer()">
      <div class="absolute inset-0 bg-black/50" />
      <div class="relative ml-auto w-64 h-full bg-retro-panel border-l border-retro-line shadow-card flex flex-col" @click.stop>
        <div class="flex items-center justify-end px-5 py-4 border-b border-retro-line">
          <button class="text-ink-dim hover:text-ink transition-colors" @click="ui.closeDrawer()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav class="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <button
            v-for="item in nav"
            :key="item.name"
            class="w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2.5"
            :class="route.name === item.name
              ? 'bg-retro-surface text-ink font-medium'
              : 'text-ink-muted hover:bg-retro-surface/60'"
            @click="go(item.path)"
          >
            {{ item.label }}
          </button>
        </nav>

        <div class="px-5 py-3 flex justify-center">
          <span class="chip">
            <span class="font-bold text-ink">{{ count }}</span>
            juego{{ count !== 1 ? 's' : '' }} en tu colección
          </span>
        </div>

        <div class="px-3 pb-5 border-t border-retro-line pt-3">
          <div class="flex items-center gap-1">
            <button
              class="flex-1 flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-ink-muted hover:bg-retro-surface/60"
              @click="openConfig"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              {{ !configStore.isConfigured ? 'Configurar API' : 'Configuración' }}
            </button>
            <button
              class="p-2.5 rounded-lg text-ink-dim hover:bg-retro-surface/60 transition-colors"
              :title="ui.dark ? 'Modo claro' : 'Modo oscuro'"
              @click="ui.toggleDark()"
            >
              <svg v-if="ui.dark" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
