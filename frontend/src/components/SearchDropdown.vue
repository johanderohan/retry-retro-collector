<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  options: { type: Array, default: () => [] }, // [{value,label}]
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="relative flex-1">
    <select
      :value="modelValue"
      class="input text-xs h-9 py-0 pl-2.5 pr-6 appearance-none cursor-pointer truncate"
      :class="modelValue && 'input-active'"
      @change="emit('update:modelValue', $event.target.value)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <svg class="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="2,4 6,8 10,4" />
    </svg>
  </div>
</template>
