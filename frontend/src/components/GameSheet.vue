<script setup>
import IconGamepad from './IconGamepad.vue'
import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue'
import { useUiStore } from '../stores/uiStore.js'
import { useCollectionStore } from '../stores/collectionStore.js'
import { useWishlistStore } from '../stores/wishlistStore.js'
import { usePlaygroundStore } from '../stores/playgroundStore.js'
import { useConfirm } from '../composables/useConfirm.js'
import { REGION_FLAGS, MANUAL_REGIONS, MANUAL_REGION_MAP, CONDITION_KEYS } from '../utils/constants.js'
import { thumbUrl } from '../utils/covers.js'

// Ficha de un juego de la colección: se abre al tocar una portada o una fila.
// Aquí viven editar y eliminar, que antes eran botones de 24 px en la tarjeta.
const ui = useUiStore()
const collection = useCollectionStore()
const wishlist = useWishlistStore()
const playground = usePlaygroundStore()
const { confirm } = useConfirm()

// La ficha sirve para un juego de la colección o para uno de la wishlist; en
// este segundo caso solo se puede pasar a la colección o quitar de la lista.
const owned = computed(() => collection.items.find(g => g.id === ui.sheetGameId) || null)
const wished = computed(() => (owned.value ? null : wishlist.items.find(g => g.id === ui.sheetGameId) || null))
const game = computed(() => owned.value || wished.value)
const editing = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive({ title: '', platform: '', year: '', region: '', condition: {}, esSpanish: false, isPlatino: false })

const flag = computed(() =>
  game.value?.esSpanish ? '🇪🇸' : (REGION_FLAGS[game.value?.regionLabel] || '🌐'))
const regionLabel = computed(() => (game.value?.esSpanish ? 'España' : game.value?.regionLabel))
const platformNames = computed(() =>
  [...new Set(collection.items.map(g => g.platform).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')))
// La región de un juego de ScreenScraper puede no estar en la lista manual.
const regionOptions = computed(() => {
  const g = game.value
  if (!g || MANUAL_REGION_MAP[g.region]) return MANUAL_REGIONS
  return [{ value: g.region, label: g.regionLabel || g.region }, ...MANUAL_REGIONS]
})
const yearOk = computed(() => !form.year.trim() || /^\d{4}$/.test(form.year.trim()) || form.year.trim() === '—')
const canSave = computed(() => !!form.title.trim() && yearOk.value && !saving.value)

function close() { ui.sheetGameId = null }
function startEdit() {
  const g = game.value
  Object.assign(form, {
    title: g.title || '', platform: g.platform || '', year: g.year || '', region: g.region || 'wor',
    condition: Object.fromEntries(CONDITION_KEYS.map(k => [k, !!g.condition?.[k]])),
    esSpanish: !!g.esSpanish, isPlatino: !!g.isPlatino,
  })
  error.value = ''
  editing.value = true
}
async function save() {
  if (!canSave.value) return
  const g = game.value
  saving.value = true
  error.value = ''
  try {
    await collection.update({
      ...g,
      title: form.title.trim(),
      platform: form.platform.trim(),
      year: form.year.trim() || '—',
      region: form.region,
      regionLabel: form.region === g.region ? g.regionLabel : (MANUAL_REGION_MAP[form.region] || form.region.toUpperCase()),
      condition: { ...form.condition },
      esSpanish: form.esSpanish,
      isPlatino: form.isPlatino,
    })
    editing.value = false
  } catch {
    error.value = 'No se ha podido guardar. Hace falta conexión con el NAS.'
  } finally {
    saving.value = false
  }
}
async function togglePlayground() {
  error.value = ''
  try { await playground.toggle(game.value) } catch { error.value = 'No se ha podido guardar. Hace falta conexión con el NAS.' }
}
function promote() {
  const g = wished.value
  close()
  ui.pendingAdd = g
}
async function removeWish() {
  const g = wished.value
  if (await confirm('¿Eliminar de la wishlist?', `"${g.title}" se eliminará de tu wishlist.`)) {
    try { await wishlist.remove(g.id); close() } catch { error.value = 'No se ha podido eliminar. Hace falta conexión con el NAS.' }
  }
}
async function removeGame() {
  const g = game.value
  if (await confirm('¿Eliminar juego?', `"${g.title}" se eliminará de tu colección.`)) {
    try { await collection.remove(g.id); close() } catch { error.value = 'No se ha podido eliminar. Hace falta conexión con el NAS.' }
  }
}

watch(() => ui.sheetGameId, () => { editing.value = false; error.value = '' })
function onKey(e) { if (e.key === 'Escape' && game.value) close() }
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="sheet">
    <div v-if="game" class="fixed inset-0 z-40 flex items-end sm:items-center justify-center" @click="close">
      <div class="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        class="sheet-panel relative w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-retro-panel border border-retro-line
               rounded-t-3xl sm:rounded-2xl shadow-card px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-4"
        role="dialog" aria-modal="true" :aria-label="game.title"
        @click.stop
      >
        <span class="w-10 h-1 rounded-full bg-retro-surface self-center sm:hidden" />

        <div class="flex gap-4">
          <div class="w-28 flex-none">
            <img v-if="game.coverUrl" :src="thumbUrl(game.coverUrl)" :alt="`Portada de ${game.title}`" class="w-full rounded-md" />
            <div v-else class="w-full aspect-[3/4] rounded-md bg-retro-surface flex items-center justify-center text-3xl"><IconGamepad :size="24" /></div>
          </div>
          <div class="min-w-0 flex-1 flex flex-col gap-2">
            <h2 class="text-lg font-semibold leading-snug text-ink">{{ game.title }}</h2>
            <p class="text-sm text-ink-muted">{{ game.platform || 'Sin plataforma' }}</p>
            <p class="text-sm text-ink-muted">{{ flag }} {{ regionLabel }} · {{ game.year }}</p>
            <div v-if="wished" class="mt-auto"><span class="chip chip-amber">En tu wishlist</span></div>
            <div v-else class="flex flex-wrap gap-1.5 mt-auto">
              <span
                v-for="k in CONDITION_KEYS.filter(k => k !== 'Otros' && k !== 'Nuevo' || game.condition?.[k])"
                :key="k"
                class="chip"
                :class="game.condition?.[k] ? 'chip-amber' : 'opacity-60 line-through'"
              >{{ k }}</span>
              <span v-if="game.isPlatino" class="chip chip-red">Platino</span>
            </div>
          </div>
        </div>

        <p v-if="error" class="text-xs text-retro-red" role="alert">{{ error }}</p>

        <!-- Wishlist -->
        <div v-if="wished" class="grid grid-cols-1 gap-2">
          <button class="btn btn-primary h-11" @click="promote">Ya lo tengo: añadir a la colección</button>
          <button class="text-sm text-retro-red hover:opacity-80 py-2.5" @click="removeWish">Quitar de la wishlist</button>
        </div>

        <!-- Vista -->
        <div v-else-if="!editing" class="grid grid-cols-2 gap-2">
          <button class="btn h-11" :class="game.inPlayground ? 'btn-danger' : 'btn-primary'" @click="togglePlayground">
            {{ game.inPlayground ? 'Quitar del Playground' : 'Al Playground' }}
          </button>
          <button class="btn btn-secondary h-11" @click="startEdit">Editar</button>
          <button class="col-span-2 text-sm text-retro-red hover:opacity-80 py-2.5" @click="removeGame">
            Eliminar de la colección
          </button>
        </div>

        <!-- Edición -->
        <form v-else class="flex flex-col gap-3" @submit.prevent="save">
          <label class="flex flex-col gap-1 text-xs text-ink-muted">
            Título
            <input v-model="form.title" type="text" class="input text-base" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-ink-muted">
            Plataforma
            <input v-model="form.platform" type="text" list="sheet-platforms" class="input text-base" autocomplete="off" />
            <datalist id="sheet-platforms">
              <option v-for="p in platformNames" :key="p" :value="p" />
            </datalist>
          </label>
          <div class="flex gap-2">
            <label class="flex flex-col gap-1 text-xs text-ink-muted flex-1 min-w-0">
              Año
              <input v-model="form.year" type="text" maxlength="4" inputmode="numeric" class="input text-base" />
              <span v-if="!yearOk" class="text-[11px] text-retro-red">Año de 4 dígitos</span>
            </label>
            <label class="flex flex-col gap-1 text-xs text-ink-muted flex-1 min-w-0">
              Región
              <select v-model="form.region" class="input text-base cursor-pointer">
                <option v-for="r in regionOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
            </label>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink">
            <label v-for="k in CONDITION_KEYS" :key="k" class="flex items-center gap-1.5 min-h-[32px] cursor-pointer">
              <input v-model="form.condition[k]" type="checkbox" class="accent-[var(--amber)] w-4 h-4" /> {{ k }}
            </label>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink">
            <label class="flex items-center gap-1.5 min-h-[32px] cursor-pointer">
              <input v-model="form.esSpanish" type="checkbox" class="accent-[var(--amber)] w-4 h-4" /> Versión española
            </label>
            <label class="flex items-center gap-1.5 min-h-[32px] cursor-pointer">
              <input v-model="form.isPlatino" type="checkbox" class="accent-[var(--amber)] w-4 h-4" /> Platino
            </label>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-1">
            <button type="button" class="btn btn-secondary h-11" @click="editing = false">Cancelar</button>
            <button type="submit" class="btn btn-primary h-11" :disabled="!canSave">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sheet-enter-active, .sheet-leave-active { transition: opacity .16s ease; }
.sheet-enter-active .sheet-panel, .sheet-leave-active .sheet-panel { transition: transform .18s ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet-panel, .sheet-leave-to .sheet-panel { transform: translateY(24px); }
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active .sheet-panel, .sheet-leave-active .sheet-panel { transition: none; }
}
</style>
