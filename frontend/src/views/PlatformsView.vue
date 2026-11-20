<script setup>
import IconAlert from '../components/IconAlert.vue'
import IconGamepad from '../components/IconGamepad.vue'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import CollectionGrid from '../components/CollectionGrid.vue'
import EmptyState from '../components/EmptyState.vue'
import IconSearch from '../components/IconSearch.vue'
import PageTitle from '../components/PageTitle.vue'
import { useConfirm } from '../composables/useConfirm.js'
import { usePlatformsStore } from '../stores/platformsStore.js'
import { useSearchStore } from '../stores/searchStore.js'
import { useUiStore } from '../stores/uiStore.js'

const platforms = usePlatformsStore()
const search = useSearchStore()
const ui = useUiStore()
const {
  isPlatformLoading, platformError, hasPlatformSearched, platformResults, platformQuery,
} = storeToRefs(search)

const filtered = computed(() => platforms.items.filter(p => {
  const f = ui.platformFilters
  if (f.type && p.type !== f.type) return false
  if (f.company && p.company !== f.company) return false
  if (f.name.trim() && !(p.name || '').toLowerCase().includes(f.name.trim().toLowerCase())) return false
  return true
}))

function onAdd(platform) { platforms.addWithLogo(platform) }
const { confirm } = useConfirm()
async function onRemove(id) {
  const item = platforms.items.find(p => p.id === id)
  if (!item) return
  if (await confirm('¿Eliminar del hardware?', `"${item.name}" se eliminará de tu hardware.`)) {
    await platforms.remove(id)
  }
}
const stats = computed(() => [
  { value: platforms.items.length, label: 'piezas' },
  { value: new Set(platforms.items.map(p => p.company).filter(Boolean)).size, label: 'marcas' },
])
function openManual() { ui.showPlatformManual = true }
</script>

<template>
  <PageTitle :title="ui.platformAddMode ? 'Añadir hardware' : 'Hardware'" :stats="!ui.platformAddMode && platforms.items.length ? stats : []" />

  <!-- Modo añadir: búsqueda en ScreenScraper -->
  <template v-if="ui.platformAddMode">
    <EmptyState v-if="isPlatformLoading" title="" subtitle="Buscando...">
      <template #icon><IconGamepad class="animate-pulse" /></template>
    </EmptyState>

    <div v-else-if="platformError" class="flex flex-col items-center justify-center min-h-64">
      <div class="surface max-w-md w-full p-6 text-center border border-retro-red/40">
        <IconAlert class="mx-auto mb-3 text-retro-red" />
        <p class="text-sm text-retro-red">{{ platformError }}</p>
      </div>
    </div>

    <template v-else-if="hasPlatformSearched">
      <EmptyState
        v-if="platformResults.length === 0"
        :subtitle="`No se encontraron resultados para «${platformQuery}»`"
        action-label="Añadir manualmente"
        @action="openManual"
      >
        <template #icon><IconSearch /></template>
      </EmptyState>
      <template v-else>
        <p class="text-xs text-ink-dim mb-5">
          <span class="font-medium text-ink">{{ platformResults.length }}</span>
          resultado{{ platformResults.length !== 1 ? 's' : '' }} para
          <span class="text-ink-muted">"{{ platformQuery }}"</span>
        </p>
        <CollectionGrid
          :items="platformResults"
          type="platform"
          add
          :in-collection="p => platforms.has(p.id)"
          @add="onAdd"
        />
      </template>
    </template>

    <EmptyState
      v-else
      title="Busca una consola o accesorio"
      subtitle="Escribe el nombre de una consola, ordenador o periférico"
      action-label="o añadir manualmente"
      @action="openManual"
    >
      <template #icon>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h2m2 0h2M12 8v4" /><circle cx="17" cy="12" r="1" fill="currentColor" />
        </svg>
      </template>
    </EmptyState>
  </template>

  <!-- Modo lista -->
  <template v-else>
    <EmptyState
      v-if="platforms.items.length === 0"
      title="Aún no hay hardware"
      subtitle="Pulsa + para buscar una consola o un periférico"
    >
      <template #icon>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h2m2 0h2M12 8v4" /><circle cx="17" cy="12" r="1" fill="currentColor" />
        </svg>
      </template>
    </EmptyState>

    <EmptyState
      v-else-if="filtered.length === 0"
      subtitle="No hay hardware que coincida"
      action-label="Limpiar filtros"
      @action="ui.resetPlatformFilters()"
    >
      <template #icon><IconSearch /></template>
    </EmptyState>

    <CollectionGrid
      v-else
      :items="filtered"
      type="platform"
      remove
      @remove="onRemove"
    />
  </template>
</template>
