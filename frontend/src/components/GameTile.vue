<script setup>
import { ref, computed } from 'vue'
import { thumbUrl } from '../utils/covers.js'
import HeartButton from './HeartButton.vue'
import IconGamepad from './IconGamepad.vue'

// Portada sola para la rejilla de la colección: 3 por fila en móvil. Los datos
// y las acciones están en la ficha, que se abre al tocarla; el corazón del
// Playground se queda a mano encima de la carátula.
const props = defineProps({
  game: { type: Object, required: true },
  playground: { type: Boolean, default: false },
  inPlayground: { type: Boolean, default: false },
})
const emit = defineEmits(['open', 'playground'])
// CollectionGrid pasa también add/wishlist/remove…, que aquí no pintan nada.
defineOptions({ inheritAttrs: false })

// La celda mide hasta ~170 px: a 320 se ve nítida. Sin conexión solo está
// precargada la de 160, así que si la grande falla se cae a esa.
const step = ref(0) // 0 → 320, 1 → 160, 2 → sin imagen
const cover = computed(() => thumbUrl(props.game.coverUrl, step.value === 0 ? 320 : 160))
const loaded = ref(false)
</script>

<template>
  <div class="group flex flex-col gap-2 min-w-0">
    <!-- flex-1 + items-end: todas las carátulas de la fila apoyan en la misma
         línea aunque tengan alturas distintas, como en una balda. -->
    <div class="flex-1 w-full flex items-end">
      <div class="relative w-full">
        <button class="block w-full" :title="game.title" :aria-label="game.title" @click="emit('open', game)">
          <img
            v-if="game.coverUrl && step < 2"
            :src="cover"
            :alt="`Portada de ${game.title}`"
            loading="lazy"
            class="block w-full h-auto rounded-md shadow-card transition-transform duration-150 group-hover:-translate-y-1"
            :class="!loaded && 'aspect-[3/4] bg-retro-surface'"
            @load="loaded = true"
            @error="step++"
          />
          <span v-else class="w-full aspect-[3/4] rounded-md bg-retro-surface flex items-center justify-center text-ink-dim">
            <IconGamepad />
          </span>
        </button>
        <HeartButton
          v-if="playground"
          class="absolute top-1.5 right-1.5"
          :active="inPlayground"
          @toggle="emit('playground', game)"
        />
      </div>
    </div>
    <button
      class="h-[2.5em] text-left text-xs leading-[1.25] line-clamp-2 transition-colors group-hover:text-ink"
      :class="game.isPlatino ? 'text-retro-amber' : 'text-ink-muted'"
      tabindex="-1"
      @click="emit('open', game)"
    >
      {{ game.title }}
    </button>
  </div>
</template>
