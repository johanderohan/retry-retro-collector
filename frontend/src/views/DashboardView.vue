<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import StatBar from '../components/StatBar.vue'
import EmptyState from '../components/EmptyState.vue'
import { useCollectionStore } from '../stores/collectionStore.js'
import { useWishlistStore } from '../stores/wishlistStore.js'
import { usePlaygroundStore } from '../stores/playgroundStore.js'
import { usePlatformsStore } from '../stores/platformsStore.js'
import { useLibrosStore } from '../stores/librosStore.js'
import { CONDITION_KEYS } from '../utils/constants.js'

const router = useRouter()
const collection = useCollectionStore()
const wishlist = useWishlistStore()
const playground = usePlaygroundStore()
const platforms = usePlatformsStore()
const libros = useLibrosStore()

const totals = computed(() => [
  { label: 'Colección',   value: collection.items.length, path: '/' },
  { label: 'Wishlist',    value: wishlist.items.length,   path: '/wishlist' },
  { label: 'Playground',  value: playground.games.length, path: '/playground' },
  { label: 'Plataformas', value: platforms.items.length,  path: '/plataformas' },
  { label: 'Libros',      value: libros.items.length,     path: '/libros' },
])

function topN(map, n = 8) {
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1])
  const head = entries.slice(0, n)
  const rest = entries.slice(n).reduce((s, [, v]) => s + v, 0)
  if (rest > 0) head.push(['Otros', rest])
  return head.map(([label, value]) => ({ label, value }))
}

const byPlatform = computed(() => {
  const m = new Map()
  for (const g of collection.items) {
    if (!g.platform) continue
    m.set(g.platform, (m.get(g.platform) || 0) + 1)
  }
  return topN(m)
})

const byRegion = computed(() => {
  const m = new Map()
  for (const g of collection.items) {
    const label = g.esSpanish ? 'España' : (g.regionLabel || '—')
    m.set(label, (m.get(label) || 0) + 1)
  }
  return topN(m)
})

const byCondition = computed(() => {
  const arr = CONDITION_KEYS.map(k => ({
    label: k,
    value: collection.items.filter(g => g.condition && g.condition[k]).length,
  }))
  arr.push({ label: 'Versión ES', value: collection.items.filter(g => g.esSpanish).length, tone: 'red' })
  arr.push({ label: 'Platino', value: collection.items.filter(g => g.isPlatino).length, tone: 'red' })
  return arr
})

const maxPlatform = computed(() => Math.max(1, ...byPlatform.value.map(x => x.value)))
const maxRegion = computed(() => Math.max(1, ...byRegion.value.map(x => x.value)))
const maxCondition = computed(() => Math.max(1, ...byCondition.value.map(x => x.value)))

const isEmpty = computed(() => collection.items.length === 0)
</script>

<template>
  <div class="flex flex-col gap-8">
    <div>
      <RouterLink
        to="/"
        class="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-retro-amber transition-colors mb-2"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver a la colección
      </RouterLink>
      <h2 class="display text-3xl text-ink mb-1">Estadísticas</h2>
      <p class="text-sm text-ink-muted">Tu colección retro de un vistazo</p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <button
        v-for="t in totals"
        :key="t.label"
        class="card p-4 text-left"
        @click="router.push(t.path)"
      >
        <div class="display text-4xl text-retro-amber leading-none">{{ t.value }}</div>
        <div class="text-xs text-ink-muted mt-2 uppercase tracking-wide">{{ t.label }}</div>
      </button>
    </div>

    <EmptyState
      v-if="isEmpty"
      title="Tu colección está vacía"
      subtitle="Pulsa + Añadir para buscar tu primer juego"
    >
      <template #icon><span class="text-4xl">🕹️</span></template>
    </EmptyState>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section class="surface p-5 flex flex-col gap-3">
        <h3 class="text-sm font-semibold text-ink">Por plataforma</h3>
        <StatBar
          v-for="s in byPlatform"
          :key="s.label"
          :label="s.label"
          :value="s.value"
          :max="maxPlatform"
        />
      </section>

      <section class="surface p-5 flex flex-col gap-3">
        <h3 class="text-sm font-semibold text-ink">Por región</h3>
        <StatBar
          v-for="s in byRegion"
          :key="s.label"
          :label="s.label"
          :value="s.value"
          :max="maxRegion"
        />
      </section>

      <section class="surface p-5 flex flex-col gap-3">
        <h3 class="text-sm font-semibold text-ink">Por estado</h3>
        <StatBar
          v-for="s in byCondition"
          :key="s.label"
          :label="s.label"
          :value="s.value"
          :max="maxCondition"
          :tone="s.tone || 'amber'"
        />
      </section>
    </div>
  </div>
</template>
