<script setup>
import { computed } from 'vue'
import CollectionGrid from '../components/CollectionGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import { useLibrosStore } from '../stores/librosStore.js'
import { useUiStore } from '../stores/uiStore.js'

const libros = useLibrosStore()
const ui = useUiStore()

const filtered = computed(() => libros.items.filter(l => {
  const f = ui.libroFilters
  if (f.tipo && l.tipo !== f.tipo) return false
  if (f.name.trim() && !(l.name || '').toLowerCase().includes(f.name.trim().toLowerCase())) return false
  return true
}))

function onRemove(id) { libros.remove(id) }
</script>

<template>
  <EmptyState
    v-if="libros.items.length === 0"
    title="Sin libros"
    subtitle="Pulsa + Añadir para registrar un libro"
  >
    <template #icon>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </template>
  </EmptyState>

  <EmptyState
    v-else-if="filtered.length === 0"
    subtitle="No hay libros que coincidan"
    action-label="Limpiar filtros"
    @action="ui.resetLibroFilters()"
  >
    <template #icon><span class="text-3xl">🔍</span></template>
  </EmptyState>

  <CollectionGrid
    v-else
    :items="filtered"
    type="libro"
    remove
    @remove="onRemove"
  />
</template>
