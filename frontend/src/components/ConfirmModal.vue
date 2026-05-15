<script setup>
import BaseModal from './BaseModal.vue'
import { useConfirm } from '../composables/useConfirm.js'

const { pending, accept, cancel } = useConfirm()
</script>

<template>
  <BaseModal v-if="pending" max-width="max-w-sm" @close="cancel">
    <div class="px-6 pt-6 pb-4">
      <h2 class="text-sm font-semibold text-ink mb-1">{{ pending.title }}</h2>
      <p class="text-sm text-ink-muted">{{ pending.message }}</p>
    </div>
    <div class="flex gap-2 justify-end px-6 pb-5">
      <button class="btn btn-secondary" @click="cancel">Cancelar</button>
      <button class="btn btn-danger" @click="accept">Eliminar</button>
    </div>
  </BaseModal>
</template>
