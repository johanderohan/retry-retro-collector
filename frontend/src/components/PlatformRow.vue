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
</script>

<template>
  <article class="list-row">
    <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-retro-surface flex items-center justify-center">
      <img v-if="platform.logoUrl && !imgError" :src="platform.logoUrl" :alt="platform.name" class="w-full h-full object-contain" @error="imgError = true" />
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-ink-dim">
        <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h2m2 0h2M12 8v4" /><circle cx="17" cy="12" r="1" fill="currentColor" />
      </svg>
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="text-sm font-medium text-ink truncate">{{ platform.name }}</h3>
      <div class="flex items-center gap-1.5 mt-0.5 text-xs text-ink-dim">
        <span v-if="platform.type">{{ platform.type }}</span>
        <span v-if="platform.type && (platform.company || platform.yearStart)">·</span>
        <span v-if="platform.company">{{ platform.company }}</span>
        <span v-if="platform.company && platform.yearStart">·</span>
        <span v-if="platform.yearStart">
          {{ platform.yearStart }}{{ platform.yearEnd && platform.yearEnd !== platform.yearStart ? `–${platform.yearEnd}` : '' }}
        </span>
      </div>
    </div>
    <div class="flex items-center gap-1 flex-shrink-0">
      <button
        v-if="add && !inCollection"
        class="w-7 h-7 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-amber hover:text-retro-amber transition-colors"
        title="Añadir a mis plataformas"
        @click="emit('add', platform)"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
        </svg>
      </button>
      <span v-if="add && inCollection" class="w-7 h-7 flex items-center justify-center rounded-full bg-retro-amber text-retro-dark" title="En tus plataformas">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1.5,6 4.5,9 10.5,3" />
        </svg>
      </span>
      <button
        v-if="remove"
        class="w-7 h-7 flex items-center justify-center rounded-full border border-retro-line text-ink-dim hover:border-retro-red hover:text-retro-red transition-colors"
        title="Eliminar"
        @click="emit('remove', platform.id)"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
        </svg>
      </button>
    </div>
  </article>
</template>
