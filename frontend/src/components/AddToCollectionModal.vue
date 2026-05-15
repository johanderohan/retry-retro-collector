<script setup>
import { ref, reactive, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { CONDITION_KEYS } from '../utils/constants.js'

const props = defineProps({ game: { type: Object, required: true } })
const emit = defineEmits(['confirm', 'cancel'])

const selected = reactive({ Juego: false, Manual: false, Caja: false, Otros: false, Nuevo: false })
const esSpanish = ref(false)
const isPlatino = ref(false)
const selectedCover = ref(props.game.coverUrl || null)
const coverOpen = ref(false)

const covers = computed(() => props.game.coverUrls || [])
const selectedCoverData = computed(() => covers.value.find(c => c.url === selectedCover.value))
const noneSelected = computed(() => !CONDITION_KEYS.some(i => selected[i]))

function toggleItem(item) { selected[item] = !selected[item] }
function confirm() {
  if (noneSelected.value) return
  emit('confirm', {
    condition: { ...selected },
    esSpanish: esSpanish.value,
    coverUrl: selectedCover.value,
    isPlatino: isPlatino.value,
  })
}
</script>

<template>
  <BaseModal max-width="max-w-sm" @close="emit('cancel')">
    <div class="px-6 pt-5 pb-4 border-b border-retro-line">
      <h2 class="text-sm font-semibold text-ink">Añadir a la colección</h2>
      <p class="text-xs text-ink-dim mt-0.5 truncate">{{ game.title }} · {{ game.platform }}</p>
    </div>

    <div class="px-6 py-5 flex flex-col gap-3">
      <p class="text-xs text-ink-muted">¿Qué incluye este juego?</p>
      <div class="flex gap-1.5">
        <button
          v-for="item in CONDITION_KEYS"
          :key="item"
          class="flex-1 py-1.5 text-xs rounded-lg border transition-colors"
          :class="selected[item]
            ? 'bg-retro-amber text-retro-dark border-retro-amber'
            : 'text-ink-muted border-retro-line hover:border-retro-amber'"
          @click="toggleItem(item)"
        >
          {{ item }}
        </button>
      </div>

      <button class="flex items-center justify-between w-full mt-1" @click="esSpanish = !esSpanish">
        <span class="text-xs text-ink-muted">¿Versión en español?</span>
        <span class="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors" :class="esSpanish ? 'bg-retro-amber' : 'bg-retro-surface'">
          <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" :class="esSpanish ? 'translate-x-4' : 'translate-x-0'" />
        </span>
      </button>

      <button class="flex items-center justify-between w-full" @click="isPlatino = !isPlatino">
        <span class="text-xs text-ink-muted">¿Versión Platino?</span>
        <span class="relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors" :class="isPlatino ? 'bg-retro-amber' : 'bg-retro-surface'">
          <span class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform" :class="isPlatino ? 'translate-x-4' : 'translate-x-0'" />
        </span>
      </button>

      <div v-if="covers.length > 0" class="border border-retro-line rounded-lg overflow-hidden mt-1">
        <button class="flex items-center justify-between w-full px-3 py-2 hover:bg-retro-surface/50 transition-colors" @click="coverOpen = !coverOpen">
          <div class="flex items-center gap-2">
            <span class="text-xs text-ink-muted">Portada</span>
            <span v-if="selectedCoverData" class="text-[10px] text-ink-dim">{{ selectedCoverData.label }}</span>
          </div>
          <div class="flex items-center gap-2">
            <img v-if="selectedCover" :src="selectedCover" alt="portada seleccionada" class="h-8 w-6 object-contain rounded" />
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink-dim transition-transform" :class="coverOpen && 'rotate-180'">
              <polyline points="2,4 6,8 10,4" />
            </svg>
          </div>
        </button>
        <div v-if="coverOpen" class="border-t border-retro-line px-3 py-3">
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="cover in covers"
              :key="cover.url"
              :title="cover.label"
              class="flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-colors"
              :class="selectedCover === cover.url ? 'border-retro-amber bg-retro-surface' : 'border-transparent hover:border-retro-line'"
              @click="selectedCover = cover.url; coverOpen = false"
            >
              <img :src="cover.url" :alt="cover.label" class="h-16 w-full object-contain" />
              <span class="text-[9px] text-ink-dim leading-tight text-center">{{ cover.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-2 justify-end px-6 pb-5">
      <button class="btn btn-secondary" @click="emit('cancel')">Cancelar</button>
      <button class="btn btn-primary" :disabled="noneSelected" @click="confirm">Añadir</button>
    </div>
  </BaseModal>
</template>
