<template>
  <v-app>
    <!-- Navigation Bar (sadece giriş yapmış kullanıcılar için) -->
    <v-app-bar v-if="authStore.isAuthenticated" app color="blue" dark elevation="4">
      <!-- Mobile Menu Button -->
      <v-app-bar-nav-icon
        v-if="$vuetify.display.mobile"
        @click="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-img
        src="/icons/logo.svg"
        alt="Akademedya Logo"
        class="error-logo"
        contain
        max-height="40"
        max-width="40"
        style="margin-left: 16px"
      ></v-img>
      <!-- Logo -->
      <v-toolbar-title class="font-weight-bold"> AKADEMEDYA </v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Desktop Navigation Menu -->
      <template v-if="!$vuetify.display.mobile">
        <v-btn
          v-for="item in navigationItems"
          :key="item.title"
          :to="item.to"
          variant="text"
          :prepend-icon="item.icon"
          class="mr-2"
        >
          {{ item.title }}
        </v-btn>
      </template>

      <!-- User Menu -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" icon size="large">
            <v-avatar size="36" color="secondary">
              <span class="text-h6">{{ userInitials }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item :title="authStore.fullName" :subtitle="authStore.userName">
            <template v-slot:prepend>
              <v-avatar color="secondary">
                <span class="text-h6">{{ userInitials }}</span>
              </v-avatar>
            </template>
          </v-list-item>

          <v-list-item
            prepend-icon="mdi-logout"
            title="Çıkış Yap"
            @click="handleLogout"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-if="authStore.isAuthenticated && $vuetify.display.mobile"
      v-model="drawer"
      app
      temporary
    >
      <v-list>
        <v-list-item :title="authStore.fullName" :subtitle="authStore.userName" class="mb-2">
          <template v-slot:prepend>
            <v-avatar color="primary">
              <span class="text-h6">{{ userInitials }}</span>
            </v-avatar>
          </template>
        </v-list-item>
        <v-divider class="mb-2"></v-divider>

        <v-list-item
          v-for="item in navigationItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          @click="drawer = false"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content Area -->
    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Loading Overlay -->
    <v-overlay v-if="loading" class="align-center justify-center" persistent>
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
    </v-overlay>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Composables
const router = useRouter()
const route = useRoute()
const theme = useTheme()
const authStore = useAuthStore()
const toast = useToast()

// Reactive Data
const drawer = ref(false)
const loading = ref(false)

const userInitials = computed(() => {
  if (!authStore.user) return 'U'
  const firstName = authStore.user.firstName || ''
  const lastName = authStore.user.lastName || ''
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
})

const navigationItems = computed(() => [
  {
    title: 'Ana Sayfa',
    icon: 'mdi-view-dashboard',
    to: '/dashboard',
  },
  {
    title: 'Tablolarım',
    icon: 'mdi-table',
    to: '/tables',
  },
])

// Methods
const handleLogout = async () => {
  try {
    loading.value = true
    authStore.logout()
    toast.success('Başarıyla çıkış yaptınız')
    router.push('/auth')
  } catch (error) {
    console.error('Logout error:', error)
    toast.error('Çıkış yapılırken bir hata oluştu')
  } finally {
    loading.value = false
  }
}

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  toast.info(`${theme.global.current.value.dark ? 'Karanlık' : 'Aydınlık'} tema aktif`)
}

// Watch route changes to close drawer
watch(route, () => {
  if (drawer.value) {
    drawer.value = false
  }
})

// Watch authentication status
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (!isAuth && route.meta.requiresAuth) {
      router.push('/auth')
    }
  },
)
</script>

<style scoped>
.v-toolbar-title {
  font-size: 1.25rem !important;
}

/* Custom scrollbar for navigation drawer */
.v-navigation-drawer :deep(.v-list) {
  padding: 8px 0;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .v-toolbar-title {
    font-size: 1.1rem !important;
  }
}
</style>
