<script setup>
// Cabecera de sección, la misma en todas las pantallas: rótulo grande y, a la
// derecha, las cifras que pase la vista.
defineProps({
  title: { type: String, required: true },
  stats: { type: Array, default: () => [] }, // [{ value, label }]
})
</script>

<template>
  <header class="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-5 mb-6 border-b border-retro-line">
    <h2 class="display text-5xl sm:text-6xl leading-[0.9] font-normal text-ink">{{ title }}</h2>
    <div v-if="stats.length" class="flex gap-6">
      <div v-for="s in stats" :key="s.label" class="flex flex-col">
        <b class="big-number text-3xl">{{ s.value }}</b>
        <span class="text-xs text-ink-muted">{{ s.label }}</span>
      </div>
    </div>
  </header>
</template>
