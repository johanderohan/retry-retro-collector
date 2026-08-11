<script setup>
import { ref, computed } from 'vue'
import { REGION_FLAGS, conditionLabel } from '../utils/constants.js'
import { thumbUrl } from '../utils/covers.js'

const props = defineProps({
  game: { type: Object, required: true },
  add: { type: Boolean, default: false },
  inCollection: { type: Boolean, default: false },
  wishlist: { type: Boolean, default: false },
  inWishlist: { type: Boolean, default: false },
  playground: { type: Boolean, default: false },
  inPlayground: { type: Boolean, default: false },
  remove: { type: Boolean, default: false },
})

// Miniatura en vez de la carátula completa: la caja mide 80 px CSS y el
// original 400, así que a 160 se ve igual y pesa la cuarta parte.
const cover = computed(() => thumbUrl(props.game.coverUrl))
const emit = defineEmits(['add', 'wishlist', 'playground', 'remove'])

const imgError = ref(false)
const regionLabel = computed(() => (props.game.esSpanish ? 'España' : props.game.regionLabel))
const flag = computed(() =>
  props.game.esSpanish ? '🇪🇸' : (REGION_FLAGS[props.game.regionLabel] || '🌐'))
const condLabel = computed(() => conditionLabel(props.game.condition))
</script>

<template>
  <article class="list-row">
    <div class="w-9 h-12 rounded overflow-hidden flex-shrink-0 bg-retro-surface flex items-center justify-center">
      <img v-if="game.coverUrl && !imgError" :src="cover" :alt="game.title" class="w-full h-full object-contain" @error="imgError = true" />
      <span v-else class="text-base">🎮</span>
    </div>

    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-medium text-ink truncate">{{ game.title }}</h3>
      <div class="flex items-center gap-1.5 mt-0.5 text-xs text-ink-dim">
        <span class="truncate">{{ game.platform }}</span>
        <span>·</span>
        <span class="whitespace-nowrap">{{ flag }} {{ regionLabel }}</span>
        <span>·</span>
        <span>{{ game.year }}</span>
        <span v-if="condLabel" class="chip ml-1" :class="game.isPlatino && 'chip-amber'">{{ condLabel }}</span>
      </div>
    </div>

    <div class="flex items-center gap-1 flex-shrink-0">
      <button
        v-if="add && !inCollection"
        class="w-7 h-7 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-amber hover:text-retro-amber transition-colors"
        title="Añadir a mi colección"
        @click="emit('add', game)"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
        </svg>
      </button>
      <span v-if="add && inCollection" class="w-7 h-7 flex items-center justify-center rounded-full bg-retro-amber text-retro-dark" title="En tu colección">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1.5,6 4.5,9 10.5,3" />
        </svg>
      </span>
      <button
        v-if="wishlist"
        class="w-7 h-7 flex items-center justify-center rounded-full border transition-colors"
        :class="inWishlist ? 'bg-retro-amber text-retro-dark border-retro-amber' : 'border-retro-line text-ink-dim hover:border-retro-amber hover:text-retro-amber'"
        :title="inWishlist ? 'En tu wishlist' : 'Añadir a wishlist'"
        @click="emit('wishlist', game)"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" :fill="inWishlist ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      <button
        v-if="playground"
        class="w-7 h-7 flex items-center justify-center rounded-full border transition-colors"
        :class="inPlayground ? 'bg-retro-red border-retro-red text-white' : 'border-retro-line text-ink-dim hover:border-retro-red hover:text-retro-red'"
        :title="inPlayground ? 'Quitar del Playground' : 'Añadir al Playground'"
        @click="emit('playground', game)"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
      <button
        v-if="remove"
        class="w-7 h-7 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-red hover:text-retro-red transition-colors"
        title="Eliminar"
        @click="emit('remove', game.id)"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
        </svg>
      </button>
    </div>
  </article>
</template>
