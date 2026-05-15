<script setup>
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['close'])
defineProps({ maxWidth: { type: String, default: 'max-w-sm' } })

function onKey(e) { if (e.key === 'Escape') emit('close') }
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
    @click="emit('close')"
  >
    <div
      class="surface w-full shadow-card"
      :class="maxWidth"
      @click.stop
    >
      <slot />
    </div>
  </div>
</template>
