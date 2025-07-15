import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/auth',
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
router.beforeEach(async (to, from, next) => {
  // Dynamically import auth store to avoid circular dependency
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  // Sayfa başlığını güncelle
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Auth store'u initialize et
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    authStore.initializeAuth()
  }

  // Token geçerliliğini kontrol et
  if (authStore.isAuthenticated && !authStore.checkTokenValidity()) {
    console.log('Token expired during navigation')
    authStore.logout()
  }

  const requiresAuth = to.meta.requiresAuth
  const requiresGuest = to.meta.requiresGuest
  const isAuthenticated = authStore.isAuthenticated

  console.log('Navigation:', {
    to: to.path,
    requiresAuth,
    requiresGuest,
    isAuthenticated,
  })

  if (requiresAuth && !isAuthenticated) {
    // Giriş gerekli ama kullanıcı giriş yapmamış
    console.log('Redirecting to auth - authentication required')
    next({
      name: 'Auth',
      query: { redirect: to.fullPath },
    })
  } else if (requiresGuest && isAuthenticated) {
    // Misafir gerekli ama kullanıcı giriş yapmış
    const redirectPath = (to.query.redirect as string) || '/dashboard'
    console.log('User already authenticated, redirecting to:', redirectPath)
    next(redirectPath)
  } else {
    next()
  }
})

export default router
