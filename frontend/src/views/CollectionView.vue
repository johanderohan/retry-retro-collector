<script setup>
import IconGamepad from '../components/IconGamepad.vue'
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import CollectionGrid from '../components/CollectionGrid.vue'
import ConsolasHome from '../components/ConsolasHome.vue'
import EmptyState from '../components/EmptyState.vue'
import IconSearch from '../components/IconSearch.vue'
import { useCollectionStore } from '../stores/collectionStore.js'
import { useWishlistStore } from '../stores/wishlistStore.js'
import { usePlaygroundStore } from '../stores/playgroundStore.js'
import { useUiStore } from '../stores/uiStore.js'
import { REGION_FLAGS } from '../utils/constants.js'
import { filteredSortedGames, groupByPlatform, hasActiveGameFilters } from '../utils/collection.js'

const route = useRoute()
const router = useRouter()
const collection = useCollectionStore()
const wishlist = useWishlistStore()
const playground = usePlaygroundStore()
const ui = useUiStore()
const { gameFilters, collectionSort } = storeToRefs(ui)

// Tres estados en la misma ruta, según los filtros de la cabecera:
//  · sin filtros          → portada «Mis consolas»
//  · con plataforma       → la balda de esa consola
//  · con texto de búsqueda → veredicto «¿lo tengo?» (colección + wishlist)
// Los desplegables y el orden siguen activos en los tres. Al buscar, los
// resultados salen siempre en filas (consola, región y estado a la vista).
const filtering = computed(() => hasActiveGameFilters(gameFilters.value))
const query = computed(() => gameFilters.value.name.trim())

const filtered = computed(() =>
  filteredSortedGames(collection.items, gameFilters.value, collectionSort.value))
const wished = computed(() =>
  query.value ? filteredSortedGames(wishlist.items, gameFilters.value, collectionSort.value) : [])

const platformInfo = computed(() => {
  const p = gameFilters.value.platform
  if (!p) return null
  return groupByPlatform(collection.items.filter(g => g.platform === p))[0] || { name: p, count: 0, complete: 0, regions: [] }
})
const flag = label => REGION_FLAGS[label] || '🌐'

const verdict = computed(() => {
  if (!query.value) return null
  const n = filtered.value.length
  const w = wished.value.length
  if (n) return {
    tone: 'have',
    title: n === 1 ? 'Lo tienes' : `Lo tienes · ${n} coincidencias`,
    detail: w ? `Además, ${w} en la wishlist` : '',
  }
  if (w) return { tone: 'wish', title: 'No lo tienes, pero está en tu wishlist', detail: '' }
  return { tone: 'none', title: 'No lo tienes', detail: 'Tampoco está en la wishlist.' }
})

// La consola elegida vive en la URL (?consola=…) para que «atrás» vuelva a la
// portada. El filtro de la cabecera y la URL se mantienen a la par.
watch(() => route.query.consola, v => {
  const p = typeof v === 'string' ? v : ''
  if (gameFilters.value.platform !== p) gameFilters.value.platform = p
}, { immediate: true })
watch(() => gameFilters.value.platform, p => {
  if ((route.query.consola || '') === p || route.name !== 'collection') return
  router.push({ path: '/', query: p ? { consola: p } : {} })
})

function openPlatform(p) { gameFilters.value.platform = p }
function backHome() { gameFilters.value.platform = '' }
function openGame(game) { ui.sheetGameId = game.id }
function onPlayground(game) { playground.toggle(game) }
function onWishAdd(game) { ui.pendingAdd = game }
</script>

<template>
  <EmptyState
    v-if="collection.items.length === 0"
    title="Tu colección está vacía"
    subtitle="Pulsa + para buscar tu primer juego"
  >
    <template #icon><IconGamepad :size="40" /></template>
  </EmptyState>

  <ConsolasHome v-else-if="!filtering" :items="collection.items" @platform="openPlatform" @open="openGame" @playground="onPlayground" />

  <div v-else class="flex flex-col gap-5">
    <header v-if="platformInfo" class="flex flex-col gap-4 pb-5 border-b border-retro-line">
      <button class="self-start flex items-center gap-1.5 text-sm text-ink-muted hover:text-retro-amber transition-colors min-h-[36px] -mb-2" @click="backHome">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Mis consolas
      </button>
      <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <h2 class="display text-5xl sm:text-6xl leading-[0.9] font-normal text-ink">{{ platformInfo.name }}</h2>
        <div class="flex gap-6">
          <div class="flex flex-col">
            <b class="display text-3xl leading-none font-normal tabular-nums text-ink">{{ platformInfo.count }}</b>
            <span class="text-xs text-ink-muted">{{ platformInfo.count === 1 ? 'juego' : 'juegos' }}</span>
          </div>
          <div class="flex flex-col">
            <b class="display text-3xl leading-none font-normal tabular-nums text-ink">{{ platformInfo.complete }}</b>
            <span class="text-xs text-ink-muted">completos</span>
          </div>
        </div>
      </div>
      <ul class="flex flex-wrap gap-2">
        <li v-for="r in platformInfo.regions" :key="r.label" class="chip py-1 px-2.5 tabular-nums">
          {{ flag(r.label) }} {{ r.label }} <b class="text-ink font-semibold ml-0.5">{{ r.count }}</b>
        </li>
      </ul>
    </header>

    <div
      v-if="verdict"
      class="rounded-xl px-4 py-3 flex flex-col gap-0.5"
      :class="{
        'verdict-have': verdict.tone === 'have',
        'verdict-wish': verdict.tone === 'wish',
        'bg-retro-surface text-ink': verdict.tone === 'none',
      }"
      role="status"
    >
      <strong class="text-base font-semibold">{{ verdict.title }}</strong>
      <span v-if="verdict.detail" class="text-xs text-ink-muted">{{ verdict.detail }}</span>
    </div>

    <section v-if="filtered.length" class="flex flex-col gap-2">
      <h3 v-if="query" class="section-label">En tu colección</h3>
      <CollectionGrid
        :items="filtered"
        type="game"
        tiles
        :force-list="!!query"
        playground
        :in-playground="g => !!g.inPlayground"
        @playground="onPlayground"
        @open="openGame"
      />
    </section>

    <section v-if="wished.length" class="flex flex-col gap-2">
      <h3 class="section-label">En tu wishlist</h3>
      <CollectionGrid :items="wished" type="game" force-list add @add="onWishAdd" />
    </section>

    <EmptyState
      v-if="!filtered.length && !wished.length && !verdict"
      subtitle="No hay juegos que coincidan con los filtros"
      action-label="Limpiar filtros"
      @action="ui.resetGameFilters()"
    >
      <template #icon><IconSearch /></template>
    </EmptyState>
    <button
      v-else-if="!filtered.length && !wished.length"
      class="self-center text-xs text-ink-dim hover:text-ink underline underline-offset-2"
      @click="ui.resetGameFilters()"
    >
      Limpiar filtros
    </button>
  </div>
</template>
