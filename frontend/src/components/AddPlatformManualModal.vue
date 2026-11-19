<script setup>
import { reactive, ref, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { validatePlatformManual } from '../utils/validation.js'
import { uploadLogo } from '../services/api.js'

const emit = defineEmits(['confirm', 'cancel'])

const form = reactive({ name: '', company: '', type: '', yearStart: '', yearEnd: '' })
const logoFile = ref(null)
const logoPreview = ref(null)
const uploading = ref(false)
const fileInput = ref(null)

const validation = computed(() => validatePlatformManual(form))
const canSubmit = computed(() => validation.value.valid)
const errors = computed(() => validation.value.errors)

function pickFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  logoFile.value = file
  if (logoPreview.value) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = URL.createObjectURL(file)
}
function clearLogo() {
  logoFile.value = null
  if (logoPreview.value) URL.revokeObjectURL(logoPreview.value)
  logoPreview.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function submit() {
  if (!canSubmit.value || uploading.value) return
  let logoUrl = null
  if (logoFile.value) {
    uploading.value = true
    try { logoUrl = await uploadLogo(logoFile.value) } catch { logoUrl = null }
    finally { uploading.value = false }
  }
  emit('confirm', {
    id: `manual-${Date.now()}`,
    name: form.name.trim(),
    company: form.company.trim(),
    type: form.type.trim(),
    yearStart: form.yearStart.trim(),
    yearEnd: form.yearEnd.trim(),
    aliases: '',
    logoUrl,
  })
}
</script>

<template>
  <BaseModal max-width="max-w-sm" @close="emit('cancel')">
    <div class="px-6 pt-5 pb-4 border-b border-retro-line">
      <h2 class="text-base font-semibold text-ink">Registro manual</h2>
      <p class="text-xs text-ink-dim mt-0.5">Añade una plataforma sin buscar en ScreenScraper</p>
    </div>

    <div class="px-6 py-5 flex flex-col gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-ink-muted">Nombre<span class="text-retro-red ml-0.5">*</span></label>
        <input v-model="form.name" type="text" placeholder="ej. Super Nintendo" autofocus class="input" @keydown.enter="submit" />
        <span v-if="errors.name" class="text-[11px] text-retro-red">{{ errors.name }}</span>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-ink-muted">Fabricante</label>
        <input v-model="form.company" type="text" placeholder="ej. Nintendo" class="input" @keydown.enter="submit" />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-xs text-ink-muted">Tipo</label>
        <input v-model="form.type" type="text" placeholder="ej. Console, Portable, Arcade…" class="input" @keydown.enter="submit" />
      </div>
      <div class="flex gap-2">
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-ink-muted">Año lanzamiento</label>
          <input v-model="form.yearStart" type="text" placeholder="ej. 1990" maxlength="4" class="input" @keydown.enter="submit" />
          <span v-if="errors.yearStart" class="text-[11px] text-retro-red">{{ errors.yearStart }}</span>
        </div>
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-xs text-ink-muted">Año fin</label>
          <input v-model="form.yearEnd" type="text" placeholder="ej. 2003" maxlength="4" class="input" @keydown.enter="submit" />
          <span v-if="errors.yearEnd" class="text-[11px] text-retro-red">{{ errors.yearEnd }}</span>
        </div>
      </div>

      <div class="mt-1">
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="pickFile" />
        <div v-if="logoPreview" class="flex items-center gap-3 p-3 surface">
          <img :src="logoPreview" alt="Vista previa" class="w-10 h-10 rounded object-contain flex-shrink-0 border border-retro-line" />
          <div class="flex-1 min-w-0">
            <p class="text-xs text-ink-muted truncate">{{ logoFile.name }}</p>
            <button type="button" class="text-xs text-retro-red hover:opacity-80 mt-0.5" @click="clearLogo">Quitar</button>
          </div>
        </div>
        <button
          v-else
          type="button"
          class="flex items-center gap-3 p-3 w-full surface border-dashed hover:border-retro-amber transition-colors"
          @click="fileInput?.click()"
        >
          <div class="w-10 h-10 rounded flex items-center justify-center bg-retro-surface flex-shrink-0 text-ink-dim">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h2m2 0h2M12 8v4" /><circle cx="17" cy="12" r="1" fill="currentColor" />
            </svg>
          </div>
          <p class="text-xs text-ink-dim leading-relaxed text-left">Pulsa para subir un logo, o continúa sin imagen.</p>
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
