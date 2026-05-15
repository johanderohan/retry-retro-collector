import { ref } from 'vue'

// Singleton: un único <ConfirmModal> en App.vue atiende todas las confirmaciones.
const pending = ref(null) // { title, message } | null
let resolver = null

export function useConfirm() {
  function confirm(title, message) {
    pending.value = { title, message }
    return new Promise(resolve => { resolver = resolve })
  }
  function accept() {
    pending.value = null
    resolver?.(true)
    resolver = null
  }
  function cancel() {
    pending.value = null
    resolver?.(false)
    resolver = null
  }
  return { pending, confirm, accept, cancel }
}
