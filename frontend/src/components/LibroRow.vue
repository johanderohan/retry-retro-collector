<script setup>
import { ref } from 'vue'

defineProps({
  libro: { type: Object, required: true },
  remove: { type: Boolean, default: false },
})
const emit = defineEmits(['remove'])
const imgError = ref(false)
</script>

<template>
  <article class="list-row">
    <div class="w-9 h-12 rounded overflow-hidden flex-shrink-0 bg-retro-surface flex items-center justify-center">
      <img v-if="libro.coverUrl && !imgError" :src="libro.coverUrl" :alt="libro.name" class="w-full h-full object-contain" @error="imgError = true" />
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-ink-dim">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-medium text-ink truncate">{{ libro.name }}</h3>
      <div class="flex items-center gap-1.5 mt-0.5 text-xs text-ink-dim">
        <span v-if="libro.tipo">{{ libro.tipo }}</span>
        <span v-if="libro.tipo && libro.idioma">·</span>
        <span v-if="libro.idioma">{{ libro.idioma }}</span>
        <span v-if="(libro.tipo || libro.idioma) && (libro.editorial || libro.year)">·</span>
        <span v-if="libro.editorial || libro.year">{{ [libro.editorial, libro.year].filter(Boolean).join(' - ') }}</span>
      </div>
    </div>
    <button
      v-if="remove"
      class="w-9 h-9 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-red hover:text-retro-red transition-colors flex-shrink-0"
      title="Eliminar"
      @click="emit('remove', libro.id)"
    >
      <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
      </svg>
    </button>
  </article>
</template>
