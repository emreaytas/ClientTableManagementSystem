import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7018/api'

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
      // Axios default header'ına token'ı ekle
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
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

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    loading.value = true
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials)

      const { data } = response

      if (data.success && data.token && data.user) {
        setToken(data.token)
        setUser(data.user)
      }

      return data
    } catch (error: any) {
      console.error('Login error:', error)

      // API'den gelen hata mesajını kullan
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }

      // HTTP status code'a göre mesaj ver
      if (error.response?.status === 401) {
        throw new Error('Kullanıcı adı veya şifre hatalı')
      }

      throw new Error('Giriş yapılırken bir hata oluştu')
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    loading.value = true
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, userData)

      return response.data
    } catch (error: any) {
      console.error('Register error:', error)

      // API'den gelen hata mesajını kullan
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }

      // Validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMessages = Object.values(errors).flat().join(', ')
        throw new Error(errorMessages)
      }

      throw new Error('Kayıt olurken bir hata oluştu')
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const refreshUserData = async (): Promise<void> => {
    if (!token.value) return

    try {
      // Kullanıcı bilgilerini güncelle (API endpoint'i gerekli)
      // const response = await axios.get<User>(`${API_BASE_URL}/auth/me`)
      // setUser(response.data)
    } catch (error) {
      console.error('User refresh error:', error)
      // Token geçersizse logout yap
      logout()
    }
  }

  const confirmEmail = async (token: string, email: string): Promise<AuthResponse> => {
    try {
      const response = await axios.get<AuthResponse>(`${API_BASE_URL}/auth/confirm-email`, {
        params: { token, email },
      })

      return response.data
    } catch (error: any) {
      console.error('Email confirmation error:', error)
      throw new Error(error.response?.data?.message || 'E-posta doğrulama başarısız')
    }
  }

  const forgotPassword = async (email: string): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/forgot-password`, {
        email,
      })

      return response.data
    } catch (error: any) {
      console.error('Forgot password error:', error)
      throw new Error(error.response?.data?.message || 'Şifre sıfırlama başarısız')
    }
  }

  const resetPassword = async (
    token: string,
    email: string,
    newPassword: string,
  ): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/reset-password`, {
        token,
        email,
        password: newPassword,
      })

      return response.data
    } catch (error: any) {
      console.error('Reset password error:', error)
      throw new Error(error.response?.data?.message || 'Şifre sıfırlama başarısız')
    }
  }

  // Token'ı başlangıçta kontrol et
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

  // JWT Token'ın geçerlilik süresini kontrol et
  const isTokenExpired = (): boolean => {
    if (!token.value) return true

    try {
      const payload = JSON.parse(atob(token.value.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch (error) {
      return true
    }
  }

  // Token geçerlilik kontrolü
  const checkTokenValidity = () => {
    if (isTokenExpired()) {
      logout()
      return false
    }
    return true
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
    confirmEmail,
    forgotPassword,
    resetPassword,
    refreshUserData,
    initializeAuth,
    checkTokenValidity,
    isTokenExpired,
  }
})
