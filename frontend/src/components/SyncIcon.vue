<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useSyncStore } from '../stores/syncStore.js'

const sync = useSyncStore()
const UNA_HORA = 60 * 60 * 1000

// El estado depende del paso del tiempo, no solo de los datos: sin este tic la
// nube seguiría en verde para siempre tras una sincronización.
const ahora = ref(Date.now())
let temporizador = null
onMounted(() => { temporizador = setInterval(() => { ahora.value = Date.now() }, 60_000) })
onUnmounted(() => clearInterval(temporizador))

const antiguedad = computed(() =>
  sync.lastSyncAt ? ahora.value - new Date(sync.lastSyncAt).getTime() : Infinity)

const alDia = computed(() => sync.online && antiguedad.value < UNA_HORA)

function hace(ms) {
  if (!Number.isFinite(ms)) return 'nunca'
  const minutos = Math.round(ms / 60000)
  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.round(horas / 24)} días`
}

const descripcion = computed(() => {
  if (sync.syncing) return 'Sincronizando…'
  const cuando = `Última sincronización ${hace(antiguedad.value)}`
  return sync.online ? cuando : `Sin conexión · ${cuando}`
})
</script>

<template>
  <button
    class="p-1.5 rounded-lg transition-colors hover:bg-black/5 disabled:opacity-50"
    :class="alDia ? 'text-emerald-500/70' : 'text-ink-dim'"
    :title="descripcion"
    :aria-label="descripcion"
    :disabled="sync.syncing"
    @click="sync.sync()"
  >
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      :class="{ 'animate-pulse': sync.syncing }"
    >
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.3 8.8 4.5 4.5 0 0 0 6.5 19h11Z" />
      <polyline v-if="alDia" points="9.5 13.5 11.5 15.5 15 11.5" />
      <template v-else>
        <line x1="12" y1="10.5" x2="12" y2="14" />
        <line x1="12" y1="16" x2="12" y2="16.1" />
      </template>
    </svg>
  </button>
</template>
