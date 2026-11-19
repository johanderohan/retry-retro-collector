<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { REGION_FLAGS } from '../utils/constants.js'
import { thumbUrl } from '../utils/covers.js'
import HeartButton from './HeartButton.vue'
import { groupByPlatform, isComplete } from '../utils/collection.js'

// Portada de la colección: una balda por plataforma (todas, sin recortar),
// con sus cifras y un carrusel de las últimas portadas añadidas.
const props = defineProps({
  items: { type: Array, required: true },
})
const emit = defineEmits(['platform', 'open', 'playground'])
const router = useRouter()

const groups = computed(() => groupByPlatform(props.items))
const complete = computed(() => props.items.filter(isComplete).length)
const flag = label => REGION_FLAGS[label] || '🌐'
</script>

<template>
  <div class="flex flex-col">
    <div class="flex items-end justify-between gap-4 pb-5">
      <div class="flex gap-6">
        <div class="flex flex-col">
          <b class="display text-3xl leading-none font-normal tabular-nums text-ink">{{ items.length }}</b>
          <span class="text-xs text-ink-muted">juegos</span>
        </div>
        <div class="flex flex-col">
          <b class="display text-3xl leading-none font-normal tabular-nums text-ink">{{ groups.length }}</b>
          <span class="text-xs text-ink-muted">consolas</span>
        </div>
        <div class="flex flex-col">
          <b class="display text-3xl leading-none font-normal tabular-nums text-ink">{{ complete }}</b>
          <span class="text-xs text-ink-muted">completos</span>
        </div>
      </div>
      <button
        class="flex-none w-11 h-11 flex items-center justify-center rounded-[0.6rem] border border-retro-line text-ink-muted hover:border-retro-amber hover:text-retro-amber transition-colors"
        aria-label="Ver estadísticas"
        title="Ver estadísticas"
        @click="router.push('/estadisticas')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="6" y1="20" x2="6" y2="12" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="18" y1="20" x2="18" y2="9" />
        </svg>
      </button>
    </div>

    <section v-for="g in groups" :key="g.name" class="border-t border-retro-line pt-4 pb-2">
      <component
        :is="g.filterValue ? 'button' : 'div'"
        class="group w-full flex items-baseline justify-between gap-3 text-left min-h-[44px]"
        @click="g.filterValue && emit('platform', g.filterValue)"
      >
        <h2 class="display text-2xl leading-none font-normal text-ink group-hover:text-retro-amber transition-colors truncate">
          {{ g.name }}
        </h2>
        <span class="flex items-center gap-2.5 text-xs text-ink-muted whitespace-nowrap tabular-nums">
          <span v-for="r in g.regions.slice(0, 3)" :key="r.label" :title="r.label" class="hidden min-[380px]:inline">
            {{ flag(r.label) }} {{ r.count }}
          </span>
          <span class="text-ink font-semibold">{{ g.count }} {{ g.count === 1 ? 'juego' : 'juegos' }}</span>
          <span v-if="g.filterValue" class="text-ink-dim group-hover:text-retro-amber" aria-hidden="true">›</span>
        </span>
      </component>

      <div class="reel flex items-end gap-3 overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 pt-2 pb-3">
        <div v-for="game in g.latest" :key="game.id" class="relative flex-none h-36 sm:h-44 min-w-[80px] flex items-end justify-center">
          <button class="h-full flex items-end" :title="game.title" :aria-label="game.title" @click="emit('open', game)">
            <img
              v-if="game.coverUrl"
              :src="thumbUrl(game.coverUrl)"
              :alt="`Portada de ${game.title}`"
              loading="lazy"
              class="max-h-36 sm:max-h-44 max-w-[160px] sm:max-w-[200px] rounded shadow-card"
            />
            <span v-else class="h-36 sm:h-44 w-[108px] sm:w-[132px] rounded bg-retro-surface flex items-center justify-center p-2 text-xs leading-tight text-ink-muted text-center overflow-hidden">
              {{ game.title }}
            </span>
          </button>
          <HeartButton class="absolute top-1.5 right-1.5" :active="!!game.inPlayground" @toggle="emit('playground', game)" />
        </div>
        <button
          v-if="g.filterValue && g.count > g.latest.length"
          class="flex-none h-36 sm:h-44 px-5 rounded border border-retro-line text-xs text-ink-muted hover:border-retro-amber hover:text-retro-amber transition-colors whitespace-nowrap"
          @click="emit('platform', g.filterValue)"
        >
          Ver los {{ g.count }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.reel { scrollbar-width: none; }
.reel::-webkit-scrollbar { display: none; }
</style>
