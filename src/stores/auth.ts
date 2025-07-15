import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Basit tip tanımları
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  userName: string
  emailConfirmed: boolean
}

interface LoginRequest {
  userName: string
  password: string
}

interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  userName: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userName = computed(() => user.value?.userName || '')
  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.firstName} ${user.value.lastName}`.trim()
  })

  // Actions
  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUser = (userData: User | null) => {
    user.value = userData
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }

  const login = async (credentials: LoginRequest) => {
    loading.value = true
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock successful login
      const mockUser: User = {
        id: '1',
        firstName: 'Test',
        lastName: 'User',
        email: credentials.userName + '@example.com',
        userName: credentials.userName,
        emailConfirmed: true,
      }

      const mockToken = 'mock-jwt-token-' + Date.now()

      setToken(mockToken)
      setUser(mockUser)

      return { success: true, message: 'Giriş başarılı' }
    } catch (error: any) {
      throw new Error('Giriş yapılırken bir hata oluştu')
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: RegisterRequest) => {
    loading.value = true
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      return {
        success: true,
        message: 'Kayıt başarılı! E-posta doğrulama linkini kontrol ediniz.',
      }
    } catch (error: any) {
      throw new Error('Kayıt olurken bir hata oluştu')
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const initializeAuth = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Auth initialization error:', error)
        logout()
      }
    }
  }

  return {
    // State
    user,
    token,
    loading,

    // Computed
    isAuthenticated,
    userName,
    fullName,

    // Actions
    login,
    register,
    logout,
    initializeAuth,
  }
})
