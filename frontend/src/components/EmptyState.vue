<script setup>
import IconGamepad from './IconGamepad.vue'
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
})
const emit = defineEmits(['action'])
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-64 gap-4 text-center py-12">
    <div class="text-ink-dim"><slot name="icon"><IconGamepad :size="40" /></slot></div>
    <div>
      <h2 v-if="title" class="text-base font-medium text-ink mb-1">{{ title }}</h2>
      <p v-if="subtitle" class="text-sm text-ink-muted">{{ subtitle }}</p>
    </div>
    <button
      v-if="actionLabel"
      class="text-xs text-ink-dim hover:text-ink underline underline-offset-2 transition-colors"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
