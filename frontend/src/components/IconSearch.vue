<script setup>
// Lupa de trazo fino para los estados vacíos (sustituye al emoji 🔍).
defineProps({ size: { type: Number, default: 34 } })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.3-4.3" />
  </svg>
</template>
