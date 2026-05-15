<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  max: { type: Number, required: true },
  tone: { type: String, default: 'amber' }, // 'amber' | 'red'
})
const pct = computed(() => (props.max > 0 ? Math.round((props.value / props.max) * 100) : 0))
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex items-baseline justify-between gap-2 text-xs">
      <span class="text-ink-muted truncate">{{ label }}</span>
      <span class="text-ink font-semibold tabular-nums">{{ value }}</span>
    </div>
    <div class="h-2 rounded-full bg-retro-surface overflow-hidden">
      <div
        class="h-full rounded-full transition-all"
        :class="tone === 'red' ? 'bg-retro-red' : 'bg-retro-amber'"
        :style="{ width: pct + '%' }"
      />
    </div>
  </div>
</template>
