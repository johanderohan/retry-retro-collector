<script setup>
import { ref } from 'vue'

defineProps({
  platform: { type: Object, required: true },
  add: { type: Boolean, default: false },
  inCollection: { type: Boolean, default: false },
  remove: { type: Boolean, default: false },
})
const emit = defineEmits(['add', 'remove'])

const imgError = ref(false)
const imgLoaded = ref(false)
</script>

<template>
  <article class="card relative flex gap-4 p-4 cursor-default">
    <button
      v-if="add && !inCollection"
      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-amber hover:text-retro-amber transition-colors"
      title="Añadir a mis plataformas"
      @click="emit('add', platform)"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
      </svg>
    </button>
    <span
      v-if="add && inCollection"
      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-retro-amber text-retro-dark"
      title="En tus plataformas"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1.5,6 4.5,9 10.5,3" />
      </svg>
    </span>
    <button
      v-if="remove"
      class="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-red hover:text-retro-red transition-colors"
      title="Eliminar"
      @click="emit('remove', platform.id)"
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
      </svg>
    </button>

    <div class="w-16 min-w-[64px] h-16 rounded overflow-hidden flex-shrink-0 flex items-center justify-center bg-retro-surface">
      <template v-if="platform.logoUrl && !imgError">
        <svg v-if="!imgLoaded" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-ink-dim">
          <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h2m2 0h2M12 8v4" /><circle cx="17" cy="12" r="1" fill="currentColor" />
        </svg>
        <img
          :src="platform.logoUrl"
          :alt="platform.name"
          class="w-full h-full object-contain"
          :style="{ display: imgLoaded ? 'block' : 'none' }"
          @error="imgError = true"
          @load="imgLoaded = true"
        />
      </template>
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-ink-dim">
        <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h2m2 0h2M12 8v4" /><circle cx="17" cy="12" r="1" fill="currentColor" />
      </svg>
    </div>

    <div class="flex-1 min-w-0 flex flex-col gap-1.5 pr-6">
      <h3 class="text-sm font-semibold text-ink leading-snug line-clamp-2">{{ platform.name }}</h3>
      <div class="flex items-center gap-1.5 flex-wrap">
        <span v-if="platform.type" class="chip">{{ platform.type }}</span>
        <span v-if="platform.yearStart" class="text-xs text-ink-dim">
          {{ platform.yearStart }}{{ platform.yearEnd && platform.yearEnd !== platform.yearStart ? `–${platform.yearEnd}` : '' }}
        </span>
      </div>
      <p v-if="platform.company" class="text-xs text-ink-dim mt-auto">{{ platform.company }}</p>
    </div>
  </article>
</template>
