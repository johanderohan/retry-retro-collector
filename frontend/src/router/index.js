import { createRouter, createWebHistory } from 'vue-router'
import { useConfigStore } from '../stores/configStore.js'

const routes = [
  { path: '/',            name: 'dashboard',  component: () => import('../views/DashboardView.vue') },
  { path: '/coleccion',   name: 'collection', component: () => import('../views/CollectionView.vue') },
  { path: '/buscar',      name: 'search',     component: () => import('../views/SearchView.vue') },
  { path: '/wishlist',    name: 'wishlist',   component: () => import('../views/WishlistView.vue') },
  { path: '/playground',  name: 'playground', component: () => import('../views/PlaygroundView.vue') },
  { path: '/plataformas', name: 'platforms',  component: () => import('../views/PlatformsView.vue') },
  { path: '/libros',      name: 'libros',     component: () => import('../views/LibrosView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async () => {
  await useConfigStore().fetch()
  return true
})

export default router
