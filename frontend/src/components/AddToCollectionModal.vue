<script setup>
import IconGamepad from './IconGamepad.vue'
import { ref, reactive, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { CONDITION_KEYS, REGION_FLAGS } from '../utils/constants.js'
import { normalizeText } from '../utils/collection.js'
import { useCollectionStore } from '../stores/collectionStore.js'

const props = defineProps({ game: { type: Object, required: true } })
const emit = defineEmits(['confirm', 'cancel'])

const collection = useCollectionStore()

const selected = reactive({ Juego: false, Manual: false, Caja: false, Otros: false, Nuevo: false })
const esSpanish = ref(false)
const isPlatino = ref(false)
const selectedCover = ref(props.game.coverUrl || null)
const coverOpen = ref(false)

const covers = computed(() => props.game.coverUrls || [])
const selectedCoverData = computed(() => covers.value.find(c => c.url === selectedCover.value))
const noneSelected = computed(() => !CONDITION_KEYS.some(i => selected[i]))
const isComplete = computed(() => selected.Juego && selected.Manual && selected.Caja)
const flag = computed(() => REGION_FLAGS[props.game.regionLabel] || '🌐')

// Copias que ya hay del mismo título en la misma consola: avisa, no bloquea
// (una segunda copia —otra región, una edición Foil— es un alta legítima).
const owned = computed(() => {
  const t = normalizeText(props.game.title)
  return collection.items.filter(g =>
    g.gameId === props.game.id || (normalizeText(g.title) === t && g.platform === props.game.platform))
})

function toggleItem(item) { selected[item] = !selected[item] }
function setComplete() {
  const v = !isComplete.value
  selected.Juego = selected.Manual = selected.Caja = v
}
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
    <div class="flex gap-4 px-5 pt-5 pb-4 border-b border-retro-line">
      <div class="w-16 flex-none">
        <img v-if="selectedCover" :src="selectedCover" :alt="`Portada de ${game.title}`" class="w-full rounded" />
        <div v-else class="w-full aspect-[3/4] rounded bg-retro-surface flex items-center justify-center text-2xl"><IconGamepad :size="24" /></div>
      </div>
      <div class="min-w-0 flex-1 flex flex-col gap-1">
        <p class="section-label">Añadir a la colección</p>
        <h2 class="text-base font-semibold leading-snug text-ink line-clamp-2">{{ game.title }}</h2>
        <p class="text-sm text-ink-muted truncate">
          {{ game.platform || 'Sin consola' }} · {{ flag }} {{ game.regionLabel }}<template v-if="game.year && game.year !== '—'"> · {{ game.year }}</template>
        </p>
      </div>
    </div>

    <div class="px-5 py-4 flex flex-col gap-4">
      <p v-if="owned.length" class="rounded-lg px-3 py-2 text-xs verdict-wish" role="status">
        Ya tienes {{ owned.length === 1 ? 'una copia' : `${owned.length} copias` }} de este juego en {{ game.platform || 'la colección' }}.
        Si añades esta, quedará como otra copia.
      </p>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-ink-muted">¿Qué incluye?</p>
          <button
            class="h-9 px-3 text-sm font-medium rounded-lg border transition-colors"
            :class="isComplete
              ? 'bg-retro-amber text-retro-dark border-retro-amber'
              : 'text-retro-amber border-retro-amber/60 hover:border-retro-amber'"
            @click="setComplete"
          >
            Completo
          </button>
        </div>
        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="item in CONDITION_KEYS"
            :key="item"
            class="h-10 text-xs sm:text-sm rounded-lg border transition-colors"
            :class="selected[item]
              ? 'bg-retro-amber text-retro-dark border-retro-amber font-medium'
              : 'text-ink-muted border-retro-line hover:border-retro-amber'"
            :aria-pressed="selected[item]"
            @click="toggleItem(item)"
          >
            {{ item }}
          </button>
        </div>
      </div>

      <div class="flex flex-col">
        <button class="flex items-center justify-between w-full min-h-[40px]" role="switch" :aria-checked="esSpanish" @click="esSpanish = !esSpanish">
          <span class="text-sm text-ink-muted">Versión española</span>
          <span class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors" :class="esSpanish ? 'bg-retro-amber' : 'bg-retro-surface'">
            <span class="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform" :class="esSpanish ? 'translate-x-5' : 'translate-x-0'" />
          </span>
        </button>
        <button class="flex items-center justify-between w-full min-h-[40px]" role="switch" :aria-checked="isPlatino" @click="isPlatino = !isPlatino">
          <span class="text-sm text-ink-muted">Edición Platino</span>
          <span class="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors" :class="isPlatino ? 'bg-retro-amber' : 'bg-retro-surface'">
            <span class="inline-block h-5 w-5 rounded-full bg-white shadow transition-transform" :class="isPlatino ? 'translate-x-5' : 'translate-x-0'" />
          </span>
        </button>
      </div>

      <div v-if="covers.length > 1" class="border border-retro-line rounded-lg overflow-hidden">
        <button class="flex items-center justify-between w-full px-3 min-h-[44px] hover:bg-retro-surface/50 transition-colors" :aria-expanded="coverOpen" @click="coverOpen = !coverOpen">
          <span class="text-sm text-ink-muted">Cambiar portada <span v-if="selectedCoverData" class="text-xs text-ink-dim">· {{ selectedCoverData.label }}</span></span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink-dim transition-transform" :class="coverOpen && 'rotate-180'">
            <polyline points="2,4 6,8 10,4" />
          </svg>
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
              <span class="text-[10px] text-ink-dim leading-tight text-center">{{ cover.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 px-5 pb-5">
      <button class="btn btn-secondary h-11" @click="emit('cancel')">Cancelar</button>
      <button class="btn btn-primary h-11" :disabled="noneSelected" @click="confirm">
        {{ noneSelected ? 'Marca qué incluye' : 'Añadir' }}
      </button>
    </div>
  </BaseModal>
</template>
