<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  options: { type: Array, default: () => [] }, // [{value,label}]
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const query = ref('')
const containerRef = ref(null)
const inputRef = ref(null)

const selectedLabel = computed(
  () => props.options.find(o => o.value === props.modelValue)?.label,
)
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? props.options.filter(o => o.label.toLowerCase().includes(q)) : props.options
})

function onOutside(e) {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    open.value = false; query.value = ''
  }
}
onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))

function select(val) { emit('update:modelValue', val); open.value = false; query.value = '' }
function clear() { emit('update:modelValue', '') }
function toggle() {
  if (props.loading) return
  open.value = !open.value
  if (open.value) nextTick(() => inputRef.value?.focus())
}
</script>

<template>
  <div ref="containerRef" class="relative flex-1">
    <button
      type="button"
      :disabled="loading"
      class="input flex items-center gap-1 text-xs text-left"
      :class="[modelValue && 'input-active', loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer']"
      @click="toggle"
    >
      <span class="flex-1 truncate min-w-0" :class="!modelValue && 'text-ink-dim'">
        {{ loading ? 'Cargando plataformas…' : (selectedLabel || placeholder) }}
      </span>
      <span
        v-if="modelValue && !loading"
        role="button"
        class="text-ink-dim hover:text-ink flex-shrink-0 p-0.5"
        @click.stop="clear"
      >
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
        </svg>
      </span>
      <svg v-else class="text-ink-dim flex-shrink-0" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="2,4 6,8 10,4" />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute top-full left-0 right-0 mt-1 surface rounded-lg shadow-card z-30 overflow-hidden"
    >
      <div class="p-2 border-b border-retro-line">
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          placeholder="Buscar plataforma…"
          class="input text-xs py-1.5"
          @click.stop
        />
      </div>
      <div class="overflow-y-auto max-h-52">
        <p v-if="filtered.length === 0" class="px-3 py-2.5 text-xs text-ink-dim">Sin resultados</p>
        <button
          v-for="o in filtered"
          :key="o.value"
          type="button"
          class="w-full text-left px-3 py-1.5 text-xs transition-colors"
          :class="o.value === modelValue
            ? 'bg-retro-amber text-retro-dark'
            : 'text-ink-muted hover:bg-retro-surface'"
          @click="select(o.value)"
        >
          {{ o.label }}
        </button>
      </div>
    </div>
  </div>
</template>
