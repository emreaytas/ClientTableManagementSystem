// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard', // Sisteme giriş yapılınca direkt dashboard'a yönlendir
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
    path: '/email-confirmed',
    name: 'EmailConfirmed',
    component: () => import('@/views/EmailConfirmation.vue'),
    meta: {
      requiresAuth: false,
      title: 'E-posta Doğrulama',
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
    path: '/tables',
    name: 'Tables',
    component: () => import('@/views/Tables.vue'),
    meta: {
      requiresAuth: true,
      title: 'Tablolarım - AKADEMEDYA',
    },
  },
  {
    path: '/tables/new',
    name: 'CreateTable',
    component: () => import('@/views/TablesEditor.vue'),
    meta: {
      requiresAuth: true,
      title: 'Yeni Tablo - AKADEMEDYA',
    },
  },
  {
    path: '/tables/:id/edit',
    name: 'EditTable',
    component: () => import('@/views/TablesEditor.vue'),
    meta: {
      requiresAuth: true,
      title: 'Tablo Düzenle - AKADEMEDYA',
    },
  },
  {
    path: '/tables/:id/data',
    name: 'TableData',
    component: () => import('@/views/TableData.vue'),
    meta: {
      requiresAuth: true,
      title: 'Tablo Verileri - AKADEMEDYA',
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
    // Misafir gerekli ama kullanıcı giriş yapmış - dashboard'a yönlendir
    console.log('User already authenticated, redirecting to dashboard')
    next('/dashboard')
  } else if (to.path === '/' && isAuthenticated) {
    // Ana sayfa istendi ve kullanıcı giriş yapmış - dashboard'a yönlendir
    console.log('Redirecting authenticated user from root to dashboard')
    next('/dashboard')
  } else {
    next()
  }
})

export default router
