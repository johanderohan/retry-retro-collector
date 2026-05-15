<script setup>
import { reactive, ref, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { LIBRO_TIPOS, LIBRO_IDIOMAS } from '../utils/constants.js'
import { validateLibroManual } from '../utils/validation.js'
import { uploadCover } from '../services/api.js'

const emit = defineEmits(['confirm', 'cancel'])

const form = reactive({ name: '', editorial: '', tipo: '', idioma: '', year: '' })
const coverFile = ref(null)
const coverPreview = ref(null)
const uploading = ref(false)
const fileInput = ref(null)

const validation = computed(() => validateLibroManual(form))
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
  let coverUrl = null
  if (coverFile.value) {
    uploading.value = true
    try { coverUrl = await uploadCover(coverFile.value) } catch { coverUrl = null }
    finally { uploading.value = false }
  }
  emit('confirm', {
    id: `manual-${Date.now()}`,
    name: form.name.trim(),
    editorial: form.editorial.trim(),
    tipo: form.tipo,
    idioma: form.idioma,
    year: form.year.trim(),
    coverUrl,
  })
}
</script>

<template>
  <BaseModal max-width="max-w-sm" @close="emit('cancel')">
    <div class="px-6 pt-5 pb-4 border-b border-retro-line">
      <h2 class="text-sm font-semibold text-ink">Añadir libro</h2>
      <p class="text-xs text-ink-dim mt-0.5">Registra un libro de tu colección</p>
    </div>

    <div class="px-6 py-5 flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-ink-muted">Nombre<span class="text-retro-red ml-0.5">*</span></label>
        <input v-model="form.name" type="text" placeholder="ej. Zelda: Hyrule Historia" autofocus class="input" @keydown.enter="submit" />
        <span v-if="errors.name" class="text-[11px] text-retro-red">{{ errors.name }}</span>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-ink-muted">Editorial</label>
        <input v-model="form.editorial" type="text" placeholder="ej. Norma Editorial" class="input" @keydown.enter="submit" />
      </div>
      <div class="flex gap-2">
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-ink-muted">Tipo</label>
          <div class="relative">
            <select v-model="form.tipo" class="input text-sm appearance-none cursor-pointer pr-7">
              <option value="">Seleccionar tipo…</option>
              <option v-for="t in LIBRO_TIPOS" :key="t" :value="t">{{ t }}</option>
            </select>
            <svg class="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="2,4 6,8 10,4" />
            </svg>
          </div>
        </div>
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-ink-muted">Idioma</label>
          <div class="relative">
            <select v-model="form.idioma" class="input text-sm appearance-none cursor-pointer pr-7">
              <option value="">Seleccionar idioma…</option>
              <option v-for="i in LIBRO_IDIOMAS" :key="i" :value="i">{{ i }}</option>
            </select>
            <svg class="absolute right-2 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="2,4 6,8 10,4" />
            </svg>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-ink-muted">Año</label>
        <input v-model="form.year" type="text" placeholder="ej. 2013" maxlength="4" class="input" @keydown.enter="submit" />
        <span v-if="errors.year" class="text-[11px] text-retro-red">{{ errors.year }}</span>
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
          <div class="w-10 h-14 rounded flex items-center justify-center bg-retro-surface flex-shrink-0 text-ink-dim">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <p class="text-xs text-ink-dim leading-relaxed text-left">Pulsa para subir una portada, o continúa sin imagen.</p>
        </button>
      </div>
    </div>

    <div class="flex gap-2 justify-end px-6 pb-5">
      <button class="btn btn-secondary" @click="emit('cancel')">Cancelar</button>
      <button class="btn btn-primary" :disabled="!canSubmit || uploading" @click="submit">
        {{ uploading ? 'Subiendo...' : 'Añadir' }}
      </button>
    </div>
  </BaseModal>
</template>
