import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import apiClient from '@/plugins/axios'
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // States
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const fullName = computed(() => {
    if (!user.value) return 'Misafir'
    return `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim()
  })
  const userName = computed(() => user.value?.userName || 'Misafir')

  // Actions
  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.post('/auth/login', {
        userName: credentials.userName,
        password: credentials.password,
      })

      if (response.data.success) {
        token.value = response.data.token
        user.value = response.data.user
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        return {
          success: true,
          message: response.data.message || 'Giriş başarılı!',
          token: response.data.token,
          user: response.data.user,
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Giriş başarısız!',
        }
      }
    } catch (err: any) {
      console.error('Login error:', err)

      let errorMessage = 'Giriş yapılırken bir hata oluştu'

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.status === 401) {
        errorMessage = 'Kullanıcı adı veya şifre yanlış'
      } else if (err.response?.status === 400) {
        errorMessage = 'Geçersiz giriş bilgileri'
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Bağlantı zaman aşımına uğradı'
      } else if (!err.response) {
        errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.'
      }

      error.value = errorMessage
      return {
        success: false,
        message: errorMessage,
      }
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.post('/auth/register', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        userName: userData.userName,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
      })

      if (response.data.success) {
        return {
          success: true,
          message:
            response.data.message || 'Kayıt başarılı! E-posta doğrulama linkini kontrol edin.',
        }
      } else {
        return {
          success: false,
          message: response.data.message || 'Kayıt başarısız!',
        }
      }
    } catch (err: any) {
      console.error('Register error:', err)

      let errorMessage = 'Kayıt olurken bir hata oluştu'

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.errors) {
        // Validation errors
        const errors = Object.values(err.response.data.errors).flat() as string[]
        errorMessage = errors.join(', ')
      } else if (err.response?.status === 400) {
        errorMessage = 'Geçersiz kayıt bilgileri'
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Bağlantı zaman aşımına uğradı'
      } else if (!err.response) {
        errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.'
      }

      error.value = errorMessage
      return {
        success: false,
        message: errorMessage,
      }
    } finally {
      loading.value = false
    }
  }

  const confirmEmail = async (token: string, email: string): Promise<AuthResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.post('/auth/confirm-email', {
        token,
        email,
      })

      return {
        success: response.data.success,
        message:
          response.data.message ||
          (response.data.success ? 'E-posta doğrulandı!' : 'Doğrulama başarısız!'),
      }
    } catch (err: any) {
      console.error('Email confirmation error:', err)

      let errorMessage = 'E-posta doğrulanırken bir hata oluştu'

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }

      error.value = errorMessage
      return {
        success: false,
        message: errorMessage,
      }
    } finally {
      loading.value = false
    }
  }

  const resendEmailConfirmation = async (email: string): Promise<AuthResponse> => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.post('/auth/resend-email-confirmation', {
        email,
      })

      return {
        success: response.data.success,
        message: response.data.message || 'Doğrulama e-postası gönderildi!',
      }
    } catch (err: any) {
      console.error('Resend email error:', err)

      let errorMessage = 'E-posta gönderilirken bir hata oluştu'

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }

      error.value = errorMessage
      return {
        success: false,
        message: errorMessage,
      }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth')
  }

  const initializeAuth = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        token.value = storedToken
        user.value = JSON.parse(storedUser)
        console.log('Oturum token ile başlatıldı.')
      } catch (err) {
        console.error('Oturum başlatılırken hata:', err)
        logout()
      }
    }
  }

  const checkTokenValidity = (): boolean => {
    if (!token.value) return false

    try {
      // JWT token'ının expiration time'ını kontrol et
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)

      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired')
        return false
      }

      return true
    } catch (err) {
      console.error('Token validation error:', err)
      return false
    }
  }

  const refreshUserData = async (): Promise<boolean> => {
    if (!token.value) return false

    try {
      const response = await apiClient.get('/auth/me')

      if (response.data.success && response.data.user) {
        user.value = response.data.user
        localStorage.setItem('user', JSON.stringify(response.data.user))
        return true
      }

      return false
    } catch (err) {
      console.error('Failed to refresh user data:', err)
      return false
    }
  }

  return {
    // State
    user,
    token,
    loading,
    error,

    // Getters
    isAuthenticated,
    fullName,
    userName,

    // Actions
    login,
    register,
    confirmEmail,
    resendEmailConfirmation,
    logout,
    initializeAuth,
    checkTokenValidity,
    refreshUserData,
  }
})
