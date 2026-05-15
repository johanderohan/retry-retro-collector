<script setup>
import { ref } from 'vue'

defineProps({
  libro: { type: Object, required: true },
  remove: { type: Boolean, default: false },
})
const emit = defineEmits(['remove'])
const imgError = ref(false)
const imgLoaded = ref(false)
</script>

<template>
  <article class="card relative flex gap-4 p-4 cursor-default">
    <button
      v-if="remove"
      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-red hover:text-retro-red transition-colors"
      title="Eliminar"
      @click="emit('remove', libro.id)"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
      </svg>
    </button>

    <div class="w-20 min-w-[80px] h-28 rounded overflow-hidden flex-shrink-0">
      <template v-if="libro.coverUrl && !imgError">
        <div v-if="!imgLoaded" class="w-full h-full flex items-center justify-center text-ink-dim">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <img
          :src="libro.coverUrl"
          :alt="`Portada de ${libro.name}`"
          class="w-full h-full object-contain"
          :style="{ display: imgLoaded ? 'block' : 'none' }"
          @error="imgError = true"
          @load="imgLoaded = true"
        />
      </template>
      <div v-else class="w-full h-full flex items-center justify-center text-ink-dim">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
    </div>

    <div class="flex-1 min-w-0 flex flex-col gap-1.5 pr-6">
      <h3 class="text-sm font-semibold text-ink leading-snug line-clamp-2">{{ libro.name }}</h3>
      <div class="flex items-center gap-1.5 flex-wrap">
        <span v-if="libro.tipo" class="chip">{{ libro.tipo }}</span>
        <span v-if="libro.idioma" class="chip">{{ libro.idioma }}</span>
      </div>
      <p v-if="libro.editorial || libro.year" class="text-xs text-ink-dim mt-auto">
        {{ [libro.editorial, libro.year].filter(Boolean).join(' - ') }}
      </p>
    </div>
  </article>
</template>
