<script setup>
// Corazón del Playground, pensado para ir encima de una carátula.
defineProps({ active: { type: Boolean, default: false } })
const emit = defineEmits(['toggle'])
</script>

<template>
  <button
    type="button"
    class="heart w-8 h-8 flex items-center justify-center rounded-full transition-colors"
    :class="active ? 'heart-on' : 'heart-off'"
    :aria-pressed="active"
    :title="active ? 'Quitar del Playground' : 'Añadir al Playground'"
    :aria-label="active ? 'Quitar del Playground' : 'Añadir al Playground'"
    @click.stop="emit('toggle')"
  >
    <svg width="15" height="15" viewBox="0 0 24 24" :fill="active ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
      <path transform="translate(0 -1.2)" d="M12 20.5 4.3 12.9a4.9 4.9 0 0 1 6.9-6.9l.8.8.8-.8a4.9 4.9 0 0 1 6.9 6.9L12 20.5Z" />
    </svg>
  </button>
</template>

<style scoped>
/* Va sobre portadas de cualquier color: fondo propio, no depende del tema. */
.heart-off { background: rgba(11, 11, 15, .62); color: rgba(255, 255, 255, .82); }
.heart-off:hover { color: #fff; background: rgba(11, 11, 15, .8); }
.heart-on { background: var(--red); color: #fff; }
</style>
