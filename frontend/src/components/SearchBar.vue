<script setup>
import { ref } from 'vue'

const props = defineProps({
  isLoading: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
})
const emit = defineEmits(['search'])

const query = ref('')
const inputRef = ref(null)

function submit() {
  const trimmed = query.value.trim()
  if (trimmed.length < 2) return
  emit('search', trimmed)
}
function onKeydown(e) {
  if (e.key === 'Escape') { query.value = ''; inputRef.value?.focus() }
}
function clear() { query.value = ''; inputRef.value?.focus() }
</script>

<template>
  <form class="flex gap-2" @submit.prevent="submit">
    <div class="relative flex-1">
      <span class="search-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        ref="inputRef"
        v-model="query"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        class="input search-input"
        :placeholder="placeholder || 'Buscar juego para añadir'"
        :disabled="isLoading"
        autofocus
        @keydown="onKeydown"
      />
      <button
        v-if="query"
        type="button"
        class="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ink-dim hover:text-ink transition-colors"
        aria-label="Limpiar"
        @click="clear"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
    <button
      type="submit"
      class="btn btn-primary min-w-[80px] h-10"
      :disabled="isLoading || query.trim().length < 2"
    >
      <span v-if="isLoading" class="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
      <span v-else>Buscar</span>
    </button>
  </form>
</template>
