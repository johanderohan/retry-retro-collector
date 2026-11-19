<script setup>
// Mando de trazo fino: marcador de «sin portada» y de estados vacíos.
defineProps({ size: { type: Number, default: 34 } })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="11" rx="5" />
    <path d="M7 11v3M5.5 12.5h3M16 11.5h.01M18 13.5h.01" />
  </svg>
</template>
