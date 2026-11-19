<script setup>
import IconGamepad from '../components/IconGamepad.vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import StatBar from '../components/StatBar.vue'
import EmptyState from '../components/EmptyState.vue'
import { useCollectionStore } from '../stores/collectionStore.js'
import { useWishlistStore } from '../stores/wishlistStore.js'
import { usePlaygroundStore } from '../stores/playgroundStore.js'
import { usePlatformsStore } from '../stores/platformsStore.js'
import { useLibrosStore } from '../stores/librosStore.js'
import { useUiStore } from '../stores/uiStore.js'
import { REGION_FLAGS } from '../utils/constants.js'
import { thumbUrl } from '../utils/covers.js'
import { displayRegion } from '../utils/collection.js'
import {
  countBy, summary, platformStats, conditionBreakdown, yearStats, sagaStats,
  addedByMonth, addedSince, duplicates, reviewList,
} from '../utils/stats.js'

const router = useRouter()
const ui = useUiStore()
const collection = useCollectionStore()
const wishlist = useWishlistStore()
const playground = usePlaygroundStore()
const hardware = usePlatformsStore()
const libros = useLibrosStore()

const games = computed(() => collection.items)
const isEmpty = computed(() => games.value.length === 0)
const max = list => Math.max(1, ...list.map(x => x.value))
const flag = label => REGION_FLAGS[label] || '🌐'

const s = computed(() => summary(games.value))
const totals = computed(() => [
  { label: 'Juegos', value: s.value.total, path: '/' },
  { label: 'Consolas con juegos', value: s.value.platforms, path: '/' },
  { label: 'Hardware', value: hardware.items.length, path: '/plataformas' },
  { label: 'Libros', value: libros.items.length, path: '/libros' },
  { label: 'Wishlist', value: wishlist.items.length, path: '/wishlist' },
  { label: 'Playground', value: playground.games.length, path: '/playground' },
])

// Estado
const states = computed(() => conditionBreakdown(games.value))
const STATE_COLOR = {
  'Precintado': 'var(--ok)', 'Completo': 'var(--amber)', 'Sin manual': 'color-mix(in srgb, var(--amber) 55%, var(--surface))',
  'Sin caja': 'color-mix(in srgb, var(--amber) 30%, var(--surface))', 'Solo el juego': 'var(--red)', 'Otros': 'var(--ink-dim)',
}

// Plataformas, fabricantes, formato, región
const platforms = computed(() => platformStats(games.value))
const makers = computed(() => countBy(games.value.map(g => platforms.value.find(p => p.label === g.platform)).filter(Boolean), p => p.maker))
const formats = computed(() => countBy(games.value.map(g => platforms.value.find(p => p.label === g.platform)).filter(Boolean), p => p.format))
const regions = computed(() => countBy(games.value, displayRegion))

// Años
const years = computed(() => yearStats(games.value))
const yearTicks = computed(() => years.value.years.filter(y => y.year % 5 === 0).map(y => y.year))

// Sagas, ritmo, repetidos
const sagas = computed(() => sagaStats(games.value).slice(0, 15))
const months = computed(() => addedByMonth(games.value).slice(-12))
const added30 = computed(() => addedSince(games.value, 30))
const added365 = computed(() => addedSince(games.value, 365))
const latest = computed(() =>
  [...games.value].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).slice(0, 8))
const dupes = computed(() => duplicates(games.value))

// Hardware, libros, wishlist
const TYPE_ALIAS = { Console: 'Consola' }
const hwTypes = computed(() => countBy(hardware.items, p => TYPE_ALIAS[p.type] || p.type))
const hwCompanies = computed(() => countBy(hardware.items, p => p.company).slice(0, 8))
const libroTipos = computed(() => countBy(libros.items, l => l.tipo))
const wishPlatforms = computed(() => countBy(wishlist.items, g => g.platform))

// Por revisar
const review = computed(() => reviewList(games.value))
const reviewCount = computed(() =>
  review.value.noYear.length + review.value.noCover.length + review.value.noPlatform.length)

function openPlatform(name) {
  ui.resetGameFilters()
  router.push({ path: '/', query: { consola: name } })
}
function openGame(game) { ui.sheetGameId = game.id }
</script>

<template>
  <div class="flex flex-col gap-10">
    <header class="flex flex-col gap-1">
      <RouterLink to="/" class="self-start inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-retro-amber transition-colors min-h-[36px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Mis consolas
      </RouterLink>
      <h2 class="display text-5xl sm:text-6xl leading-[0.9] font-normal text-ink">Estadísticas</h2>
    </header>

    <div class="grid grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-6">
      <button v-for="t in totals" :key="t.label" class="group flex flex-col text-left" @click="router.push(t.path)">
        <b class="big-number text-5xl group-hover:text-retro-amber transition-colors">{{ t.value }}</b>
        <span class="text-xs text-ink-muted mt-1">{{ t.label }}</span>
      </button>
    </div>

    <EmptyState v-if="isEmpty" title="Tu colección está vacía" subtitle="Pulsa + para buscar tu primer juego">
      <template #icon><IconGamepad :size="40" /></template>
    </EmptyState>

    <template v-else>
      <!-- Estado -->
      <section class="flex flex-col gap-4">
        <div class="flex items-baseline justify-between gap-4">
          <h3 class="section-title">Estado</h3>
          <p class="text-sm text-ink-muted"><b class="text-ink font-semibold">{{ s.completePct }}%</b> completos o precintados</p>
        </div>
        <div class="flex h-4 rounded-full overflow-hidden bg-retro-surface" role="img" :aria-label="states.map(x => `${x.label}: ${x.value}`).join(', ')">
          <div v-for="st in states" :key="st.label" class="h-full border-r-2 border-[var(--bg)] last:border-r-0" :style="{ width: (st.value / s.total * 100) + '%', background: STATE_COLOR[st.label] }" :title="`${st.label}: ${st.value}`" />
        </div>
        <ul class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li v-for="st in states" :key="st.label" class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full flex-none" :style="{ background: STATE_COLOR[st.label] }" />
            <span class="text-ink-muted">{{ st.label }}</span>
            <b class="text-ink font-semibold tabular-nums">{{ st.value }}</b>
            <span class="text-ink-dim tabular-nums">{{ st.pct }}%</span>
          </li>
        </ul>
        <ul class="flex flex-wrap gap-2">
          <li class="chip py-1 px-2.5">🇪🇸 Versión española <b class="text-ink font-semibold ml-0.5">{{ s.spanish }}</b> · {{ s.spanishPct }}%</li>
          <li class="chip py-1 px-2.5">🇯🇵 Importación japonesa <b class="text-ink font-semibold ml-0.5">{{ s.japanese }}</b> · {{ s.japanesePct }}%</li>
          <li class="chip py-1 px-2.5">Platino <b class="text-ink font-semibold ml-0.5">{{ s.platino }}</b></li>
          <li class="chip py-1 px-2.5">Con extras <b class="text-ink font-semibold ml-0.5">{{ s.extras }}</b></li>
        </ul>
      </section>

      <!-- Plataformas -->
      <section class="flex flex-col gap-4">
        <div class="flex items-baseline justify-between gap-4">
          <h3 class="section-title">Por consola</h3>
          <p class="text-sm text-ink-muted">{{ platforms.length }} consolas · la mayor, {{ platforms[0].label }}</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
          <button v-for="p in platforms" :key="p.label" class="text-left rounded hover:opacity-80 transition-opacity" :title="`Ver ${p.label}`" @click="openPlatform(p.label)">
            <StatBar :label="p.label" :value="p.value" :max="max(platforms)" />
          </button>
        </div>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
        <section class="flex flex-col gap-3">
          <h3 class="section-title">Por fabricante</h3>
          <StatBar v-for="m in makers" :key="m.label" :label="m.label" :value="m.value" :max="max(makers)" />
        </section>
        <section class="flex flex-col gap-3">
          <h3 class="section-title">Por región</h3>
          <StatBar v-for="r in regions" :key="r.label" :label="`${flag(r.label)} ${r.label}`" :value="r.value" :max="max(regions)" />
        </section>
        <section class="flex flex-col gap-3">
          <h3 class="section-title">Por formato</h3>
          <StatBar v-for="f in formats" :key="f.label" :label="f.label" :value="f.value" :max="max(formats)" />
        </section>
      </div>

      <!-- Años -->
      <section v-if="years.years.length" class="flex flex-col gap-4">
        <div class="flex items-baseline justify-between gap-4">
          <h3 class="section-title">Año de lanzamiento</h3>
          <p class="text-sm text-ink-muted">El año con más juegos: <b class="text-ink font-semibold">{{ years.top.year }}</b> ({{ years.top.value }})</p>
        </div>
        <div>
          <div class="flex items-end gap-px h-36" role="img" :aria-label="`Juegos por año, de ${years.years[0].year} a ${years.years.at(-1).year}`">
            <div
              v-for="y in years.years"
              :key="y.year"
              class="flex-1 min-w-0 rounded-t-sm"
              :class="y.year === years.top.year ? 'bg-retro-amber' : 'bg-[color-mix(in_srgb,var(--amber)_45%,var(--surface))]'"
              :style="{ height: y.value ? Math.max(3, y.value / years.max * 100) + '%' : '1px' }"
              :title="`${y.year}: ${y.value}`"
            />
          </div>
          <div class="flex gap-px border-t border-retro-line pt-1">
            <span v-for="y in years.years" :key="y.year" class="flex-1 min-w-0 text-[10px] text-ink-dim tabular-nums overflow-visible whitespace-nowrap">
              {{ yearTicks.includes(y.year) ? y.year : '' }}
            </span>
          </div>
        </div>
        <ul class="flex flex-wrap gap-2">
          <li v-for="d in years.decades" :key="d.label" class="chip py-1 px-2.5">{{ d.label }} <b class="text-ink font-semibold ml-0.5">{{ d.value }}</b></li>
          <li v-if="years.undated" class="chip py-1 px-2.5">Sin año <b class="text-ink font-semibold ml-0.5">{{ years.undated }}</b></li>
        </ul>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button class="list-row text-left" @click="openGame(years.oldest)">
            <span class="section-label flex-none whitespace-nowrap">El más antiguo</span>
            <span class="flex-1 min-w-0 truncate text-sm text-ink">{{ years.oldest.title }}</span>
            <b class="text-sm text-ink-muted tabular-nums">{{ years.oldest.year }}</b>
          </button>
          <button class="list-row text-left" @click="openGame(years.newest)">
            <span class="section-label flex-none whitespace-nowrap">El más reciente</span>
            <span class="flex-1 min-w-0 truncate text-sm text-ink">{{ years.newest.title }}</span>
            <b class="text-sm text-ink-muted tabular-nums">{{ years.newest.year }}</b>
          </button>
        </div>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        <!-- Sagas -->
        <section v-if="sagas.length" class="flex flex-col gap-3">
          <h3 class="section-title">Sagas más repetidas</h3>
          <StatBar v-for="g in sagas" :key="g.label" :label="g.label" :value="g.value" :max="max(sagas)" />
        </section>

        <!-- Ritmo -->
        <section class="flex flex-col gap-3">
          <div class="flex items-baseline justify-between gap-4">
            <h3 class="section-title">Ritmo</h3>
            <p class="text-sm text-ink-muted"><b class="text-ink font-semibold">{{ added30 }}</b> en 30 días · <b class="text-ink font-semibold">{{ added365 }}</b> en un año</p>
          </div>
          <StatBar v-for="m in months" :key="m.label" :label="m.label" :value="m.value" :max="max(months)" />
        </section>
      </div>

      <!-- Últimos añadidos -->
      <section class="flex flex-col gap-3">
        <h3 class="section-title">Últimos añadidos</h3>
        <div class="reel flex items-end gap-3 overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 pb-2">
          <button v-for="g in latest" :key="g.id" class="flex-none h-36 min-w-[80px] flex items-end justify-center" :title="g.title" :aria-label="g.title" @click="openGame(g)">
            <img v-if="g.coverUrl" :src="thumbUrl(g.coverUrl)" :alt="`Portada de ${g.title}`" loading="lazy" class="max-h-36 max-w-[160px] rounded shadow-card" />
            <span v-else class="h-36 w-[108px] rounded bg-retro-surface flex items-center justify-center p-2 text-xs text-ink-muted text-center">{{ g.title }}</span>
          </button>
        </div>
      </section>

      <!-- Repetidos -->
      <section v-if="dupes.length" class="flex flex-col gap-3">
        <div class="flex items-baseline justify-between gap-4">
          <h3 class="section-title">Repetidos</h3>
          <p class="text-sm text-ink-muted">{{ dupes.length }} títulos con más de una copia</p>
        </div>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <li v-for="d in dupes" :key="d.title" class="list-row">
            <span class="flex-1 min-w-0">
              <span class="block text-sm text-ink truncate">{{ d.title }}</span>
              <span class="block text-xs text-ink-dim truncate">{{ d.copies.map(c => `${c.platform} ${flag(displayRegion(c))}`).join(' · ') }}</span>
            </span>
            <b class="chip chip-amber tabular-nums">×{{ d.count }}</b>
          </li>
        </ul>
      </section>

      <!-- Hardware, libros, wishlist -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
        <section v-if="hardware.items.length" class="flex flex-col gap-3">
          <h3 class="section-title">Hardware por tipo</h3>
          <StatBar v-for="t in hwTypes" :key="t.label" :label="t.label" :value="t.value" :max="max(hwTypes)" tone="red" />
        </section>
        <section v-if="hardware.items.length" class="flex flex-col gap-3">
          <h3 class="section-title">Hardware por marca</h3>
          <StatBar v-for="c in hwCompanies" :key="c.label" :label="c.label" :value="c.value" :max="max(hwCompanies)" tone="red" />
        </section>
        <section v-if="wishlist.items.length || libros.items.length" class="flex flex-col gap-3">
          <template v-if="wishlist.items.length">
            <h3 class="section-title">Wishlist</h3>
            <StatBar v-for="w in wishPlatforms" :key="w.label" :label="w.label" :value="w.value" :max="max(wishPlatforms)" />
          </template>
          <template v-if="libros.items.length">
            <h3 class="section-title" :class="wishlist.items.length && 'mt-4'">Libros</h3>
            <StatBar v-for="l in libroTipos" :key="l.label" :label="l.label" :value="l.value" :max="max(libroTipos)" />
          </template>
        </section>
      </div>

      <!-- Por revisar -->
      <section class="flex flex-col gap-3">
        <div class="flex items-baseline justify-between gap-4">
          <h3 class="section-title">Por revisar</h3>
          <p class="text-sm text-ink-muted">{{ reviewCount ? `${reviewCount} fichas con algún dato sin rellenar` : 'Todas las fichas están completas' }}</p>
        </div>
        <ul class="flex flex-wrap gap-2">
          <li class="chip py-1 px-2.5">Sin año <b class="text-ink font-semibold ml-0.5">{{ review.noYear.length }}</b></li>
          <li class="chip py-1 px-2.5">Sin portada <b class="text-ink font-semibold ml-0.5">{{ review.noCover.length }}</b></li>
          <li class="chip py-1 px-2.5">Sin consola <b class="text-ink font-semibold ml-0.5">{{ review.noPlatform.length }}</b></li>
        </ul>
        <div v-if="review.lonePlatforms.length" class="flex flex-col gap-2">
          <p class="text-sm text-ink-muted">Consolas con un solo juego (ahí es donde se cuelan las erratas):</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="p in review.lonePlatforms" :key="p" class="chip py-1 px-2.5 hover:text-retro-amber transition-colors" @click="openPlatform(p)">{{ p }}</button>
          </div>
        </div>
        <details v-if="review.noYear.length" class="text-sm">
          <summary class="cursor-pointer text-ink-muted hover:text-ink py-1">Ver los {{ review.noYear.length }} juegos sin año</summary>
          <div class="flex flex-wrap gap-2 pt-2">
            <button v-for="g in review.noYear" :key="g.id" class="chip py-1 px-2.5 hover:text-retro-amber transition-colors" @click="openGame(g)">{{ g.title }}</button>
          </div>
        </details>
      </section>
    </template>
  </div>
</template>

<style scoped>
.reel { scrollbar-width: none; }
.reel::-webkit-scrollbar { display: none; }
</style>
