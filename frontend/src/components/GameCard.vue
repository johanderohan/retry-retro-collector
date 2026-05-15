<script setup>
import { ref, computed } from 'vue'
import { REGION_FLAGS, conditionLabel } from '../utils/constants.js'

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
const emit = defineEmits(['add', 'wishlist', 'playground', 'remove'])

const imgError = ref(false)
const imgLoaded = ref(false)

const regionLabel = computed(() => (props.game.esSpanish ? 'España' : props.game.regionLabel))
const flag = computed(() =>
  props.game.esSpanish ? '🇪🇸' : (REGION_FLAGS[props.game.regionLabel] || '🌐'))
const condLabel = computed(() => conditionLabel(props.game.condition))
const removeTop = computed(() => (props.add || props.playground ? 'top-11' : 'top-3'))
</script>

<template>
  <article class="card relative flex gap-4 p-4 cursor-default">
    <button
      v-if="add && !inCollection"
      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-amber hover:text-retro-amber transition-colors"
      title="Añadir a mi colección"
      @click="emit('add', game)"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
      </svg>
    </button>
    <span
      v-if="add && inCollection"
      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-retro-amber text-retro-dark"
      title="En tu colección"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1.5,6 4.5,9 10.5,3" />
      </svg>
    </span>

    <button
      v-if="wishlist"
      class="absolute top-11 right-3 w-6 h-6 flex items-center justify-center rounded-full border transition-colors"
      :class="inWishlist
        ? 'bg-retro-amber text-retro-dark border-retro-amber'
        : 'border-retro-line text-ink-dim hover:border-retro-amber hover:text-retro-amber'"
      :title="inWishlist ? 'En tu wishlist' : 'Añadir a wishlist'"
      @click="emit('wishlist', game)"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" :fill="inWishlist ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>

    <button
      v-if="playground"
      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border transition-colors"
      :class="inPlayground
        ? 'bg-retro-red border-retro-red text-white'
        : 'border-retro-line text-ink-dim hover:border-retro-red hover:text-retro-red'"
      :title="inPlayground ? 'Quitar del Playground' : 'Añadir al Playground'"
      @click="emit('playground', game)"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>

    <button
      v-if="remove"
      class="absolute right-3 w-6 h-6 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-red hover:text-retro-red transition-colors"
      :class="removeTop"
      title="Eliminar"
      @click="emit('remove', game.id)"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
      </svg>
    </button>

    <div class="w-20 min-w-[80px] h-28 rounded overflow-hidden flex-shrink-0">
      <template v-if="game.coverUrl && !imgError">
        <div v-if="!imgLoaded" class="w-full h-full flex items-center justify-center text-2xl text-ink-dim">🎮</div>
        <img
          :src="game.coverUrl"
          :alt="`Portada de ${game.title}`"
          class="w-full h-full object-contain"
          :style="{ display: imgLoaded ? 'block' : 'none' }"
          @error="imgError = true"
          @load="imgLoaded = true"
        />
      </template>
      <div v-else class="w-full h-full flex items-center justify-center text-2xl text-ink-dim">🎮</div>
    </div>

    <div class="flex-1 min-w-0 flex flex-col gap-1.5 pr-6">
      <h3 class="text-sm font-semibold text-ink leading-snug line-clamp-2">{{ game.title }}</h3>
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="chip" :class="game.isPlatino && 'chip-amber'">{{ game.platform }}</span>
        <span v-if="condLabel" class="chip font-semibold tracking-wide" :class="game.isPlatino && 'chip-amber'">{{ condLabel }}</span>
      </div>
      <div class="flex flex-col gap-1 mt-auto">
        <div class="flex items-center gap-2">
          <span class="text-xs text-ink-dim w-14">Región</span>
          <span class="text-xs text-ink-muted">{{ flag }} {{ regionLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-ink-dim w-14">Año</span>
          <span class="text-xs font-semibold text-ink">{{ game.year }}</span>
        </div>
      </div>
    </div>
  </article>
</template>
