<script setup>
import { reactive, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useConfigStore } from '../stores/configStore.js'
import { useCollectionStore } from '../stores/collectionStore.js'
import { exportCollectionCSV } from '../utils/csv.js'

const emit = defineEmits(['close'])
const configStore = useConfigStore()
const collection = useCollectionStore()

const config = reactive({
  devid:       configStore.config.devid       || '',
  devpassword: configStore.config.devpassword || '',
  ssid:        configStore.config.ssid        || '',
  sspassword:  configStore.config.sspassword  || '',
  softname:    configStore.config.softname    || 'retro-search',
})

const canSave = computed(() => !!config.devid && !!config.devpassword)

const requiredFields = [
  { label: 'Dev ID',       key: 'devid',       type: 'text',     placeholder: 'Tu devid de ScreenScraper' },
  { label: 'Dev Password', key: 'devpassword', type: 'password', placeholder: 'Tu devpassword de ScreenScraper' },
]
const optionalFields = [
  { label: 'SS ID',              key: 'ssid',       type: 'text',     placeholder: 'Tu nombre de usuario' },
  { label: 'SS Password',        key: 'sspassword', type: 'password', placeholder: 'Tu contraseña' },
  { label: 'Nombre de software', key: 'softname',   type: 'text',     placeholder: 'Nombre de tu app' },
]

async function save() {
  await configStore.save({ ...config })
  emit('close')
}
</script>

<template>
  <BaseModal max-width="max-w-md" @close="emit('close')">
    <div class="flex items-center justify-between px-6 py-4 border-b border-retro-line">
      <h2 class="text-base font-semibold text-ink">Configuración</h2>
      <button class="text-ink-dim hover:text-ink transition-colors" @click="emit('close')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
      <div class="flex items-center gap-3 text-xs text-ink-dim">
        <span class="font-medium">ScreenScraper</span>
        <div class="flex-1 h-px bg-retro-line" />
      </div>
      <p class="text-xs text-ink-muted surface px-3 py-2.5 leading-relaxed">
        Regístrate en <strong class="text-ink">screenscraper.fr</strong> para obtener credenciales.
      </p>

      <div v-for="f in requiredFields" :key="f.key" class="flex flex-col gap-1.5">
        <label class="text-xs font-medium text-ink-muted">
          {{ f.label }} <span class="text-retro-red">*</span>
        </label>
        <input v-model="config[f.key]" :type="f.type" class="input" :placeholder="f.placeholder" />
      </div>

      <div class="flex items-center gap-3 text-xs text-ink-dim">
        <div class="flex-1 h-px bg-retro-line" />
        <span>Cuenta de usuario (opcional)</span>
        <div class="flex-1 h-px bg-retro-line" />
      </div>

      <div v-for="f in optionalFields" :key="f.key" class="flex flex-col gap-1.5">
        <label class="text-xs font-medium text-ink-muted">{{ f.label }}</label>
        <input v-model="config[f.key]" :type="f.type" class="input" :placeholder="f.placeholder" />
      </div>

      <div class="flex items-center gap-3 text-xs text-ink-dim mt-1">
        <span class="font-medium">Exportar datos</span>
        <div class="flex-1 h-px bg-retro-line" />
      </div>
      <div class="flex items-center justify-between p-3 surface">
        <div>
          <p class="text-xs font-medium text-ink">Colección completa</p>
          <p class="text-[11px] text-ink-dim mt-0.5">
            {{ collection.items.length }} juego{{ collection.items.length !== 1 ? 's' : '' }} · CSV con título, plataforma, región, año y estado
          </p>
        </div>
        <button
          class="btn btn-secondary text-xs flex-shrink-0 ml-4"
          :disabled="collection.items.length === 0"
          title="Descargar CSV"
          @click="exportCollectionCSV(collection.items)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar CSV
        </button>
      </div>
    </div>

    <div class="flex gap-2 justify-end px-6 pb-5 border-t border-retro-line pt-4">
      <button class="btn btn-secondary" @click="emit('close')">Cancelar</button>
      <button class="btn btn-primary" :disabled="!canSave" @click="save">Guardar</button>
    </div>
  </BaseModal>
</template>
