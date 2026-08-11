import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import { useSyncStore } from './stores/syncStore.js'
import './style.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

const app = createApp(App)
const pinia = createPinia()
app.use(pinia).use(router)

// Hidratar ANTES de montar: así la primera pintura ya sale con datos y nunca se
// espera a la red.
const sync = useSyncStore(pinia)
sync.hydrate()

app.mount('#app')

// Y sincronizar en segundo plano, sin bloquear nada.
sync.sync()
