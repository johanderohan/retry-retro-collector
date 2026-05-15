<script setup>
import { reactive, ref, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { MANUAL_REGIONS, MANUAL_REGION_MAP } from '../utils/constants.js'
import { validateGameManual } from '../utils/validation.js'
import { uploadCover } from '../services/api.js'

const emit = defineEmits(['confirm', 'cancel'])

const form = reactive({ title: '', platform: '', year: '', region: 'wor' })
const coverFile = ref(null)
const coverPreview = ref(null)
const uploading = ref(false)
const fileInput = ref(null)

const validation = computed(() => validateGameManual(form))
const canSubmit = computed(() => validation.value.valid)
const errors = computed(() => validation.value.errors)

function pickFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  coverFile.value = file
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = URL.createObjectURL(file)
}
function clearCover() {
  coverFile.value = null
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function submit() {
  if (!canSubmit.value || uploading.value) return
  const region = form.region || 'wor'
  let coverUrl = null
  if (coverFile.value) {
    uploading.value = true
    try { coverUrl = await uploadCover(coverFile.value) } catch { coverUrl = null }
    finally { uploading.value = false }
  }
  const ts = Date.now()
  emit('confirm', {
    id: `manual-${ts}`,
    gameId: `manual-${ts}`,
    title: form.title.trim(),
    platform: form.platform.trim(),
    platformId: '',
    region,
    regionLabel: MANUAL_REGION_MAP[region] || region.toUpperCase(),
    year: form.year.trim() || '—',
    coverUrl,
    coverUrls: coverUrl ? [{ url: coverUrl, label: 'Portada subida' }] : [],
  })
}
</script>

<template>
  <BaseModal max-width="max-w-sm" @close="emit('cancel')">
    <div class="px-6 pt-5 pb-4 border-b border-retro-line">
      <h2 class="text-sm font-semibold text-ink">Registro manual</h2>
      <p class="text-xs text-ink-dim mt-0.5">Añade un juego sin buscar en ScreenScraper</p>
    </div>

    <div class="px-6 py-5 flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-ink-muted">Título<span class="text-retro-red ml-0.5">*</span></label>
        <input v-model="form.title" type="text" placeholder="ej. Super Mario World" autofocus class="input" @keydown.enter="submit" />
        <span v-if="errors.title" class="text-[11px] text-retro-red">{{ errors.title }}</span>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-ink-muted">Plataforma</label>
        <input v-model="form.platform" type="text" placeholder="ej. Super Nintendo" class="input" @keydown.enter="submit" />
      </div>

      <div class="flex gap-2">
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-ink-muted">Año</label>
          <input v-model="form.year" type="text" placeholder="ej. 1992" maxlength="4" class="input" @keydown.enter="submit" />
          <span v-if="errors.year" class="text-[11px] text-retro-red">{{ errors.year }}</span>
        </div>
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-ink-muted">Región</label>
          <div class="relative">
            <select v-model="form.region" class="input text-sm appearance-none cursor-pointer pr-7">
              <option v-for="r in MANUAL_REGIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
            <svg class="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="2,4 6,8 10,4" />
            </svg>
          </div>
        </div>
      </div>

      <div class="mt-1">
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="pickFile" />
        <div v-if="coverPreview" class="flex items-center gap-3 p-3 surface">
          <img :src="coverPreview" alt="Vista previa" class="w-10 h-14 rounded object-contain flex-shrink-0 border border-retro-line" />
          <div class="flex-1 min-w-0">
            <p class="text-xs text-ink-muted truncate">{{ coverFile.name }}</p>
            <button type="button" class="text-xs text-retro-red hover:opacity-80 mt-0.5" @click="clearCover">Quitar</button>
          </div>
        </div>
        <button
          v-else
          type="button"
          class="flex items-center gap-3 p-3 w-full surface border-dashed hover:border-retro-amber transition-colors"
          @click="fileInput?.click()"
        >
          <div class="w-10 h-14 rounded flex items-center justify-center bg-retro-surface flex-shrink-0 text-xl">🎮</div>
          <p class="text-xs text-ink-dim leading-relaxed text-left">Pulsa para subir una portada, o continúa sin imagen.</p>
        </button>
      </div>
    </div>

    <div class="flex gap-2 justify-end px-6 pb-5">
      <button class="btn btn-secondary" @click="emit('cancel')">Cancelar</button>
      <button class="btn btn-primary" :disabled="!canSubmit || uploading" @click="submit">
        {{ uploading ? 'Subiendo...' : 'Siguiente →' }}
      </button>
    </div>
  </BaseModal>
</template>
