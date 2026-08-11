import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',             name: 'collection', component: () => import('../views/CollectionView.vue') },
  { path: '/estadisticas', name: 'dashboard',  component: () => import('../views/DashboardView.vue') },
  { path: '/buscar',       name: 'search',     component: () => import('../views/SearchView.vue') },
  { path: '/wishlist',     name: 'wishlist',   component: () => import('../views/WishlistView.vue') },
  { path: '/playground',   name: 'playground', component: () => import('../views/PlaygroundView.vue') },
  { path: '/plataformas',  name: 'platforms',  component: () => import('../views/PlatformsView.vue') },
  { path: '/libros',       name: 'libros',     component: () => import('../views/LibrosView.vue') },
  { path: '/coleccion',    redirect: '/' },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// Antes esto esperaba a configLoad() por axios, con timeout de 60 s: sin
// conexión, la app se quedaba hasta un minuto en blanco antes de pintar la
// primera ruta. La config ya viene del snapshot local, así que aquí no hay nada
// que esperar.
router.beforeEach(() => true)

export default router
