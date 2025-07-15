import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: () => {
      const authStore = useAuthStore()
      return authStore.isAuthenticated ? '/dashboard' : '/auth'
    },
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/Auth.vue'),
    meta: {
      requiresGuest: true,
      title: 'Giriş Yap - AKADEMEDYA',
    },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      requiresAuth: true,
      title: 'Ana Sayfa - AKADEMEDYA',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: 'Sayfa Bulunamadı - AKADEMEDYA',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// Navigation Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Sayfa başlığını güncelle
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Auth store'u initialize et
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    authStore.initializeAuth()
  }

  const requiresAuth = to.meta.requiresAuth
  const requiresGuest = to.meta.requiresGuest
  const isAuthenticated = authStore.isAuthenticated

  if (requiresAuth && !isAuthenticated) {
    // Giriş gerekli ama kullanıcı giriş yapmamış
    next({
      name: 'Auth',
      query: { redirect: to.fullPath },
    })
  } else if (requiresGuest && isAuthenticated) {
    // Misafir gerekli ama kullanıcı giriş yapmış
    const redirectPath = (to.query.redirect as string) || '/dashboard'
    next(redirectPath)
  } else {
    next()
  }
})

export default router
