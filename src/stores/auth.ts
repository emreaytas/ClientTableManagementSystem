import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7018/api'

// Type definitions
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  userName: string
  emailConfirmed: boolean
  isEmailConfirmed: boolean
  createdAt?: string
  updatedAt?: string
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
  confirmPassword: string // Backend için gerekli
}

interface AuthResponse {
  success: boolean
  message: string
  token?: string
  user?: User
  errors?: Record<string, string[]>
}

// Axios interceptor setup
const setupAxiosInterceptors = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete axios.defaults.headers.common['Authorization']
  }
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
      setupAxiosInterceptors(newToken)
    } else {
      localStorage.removeItem('token')
      setupAxiosInterceptors(null)
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
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      const { data } = response

      if (data.success && data.token && data.user) {
        setToken(data.token)
        setUser(data.user)

        console.log('Login successful:', {
          user: data.user.userName,
          tokenLength: data.token.length,
        })
      }

      return data
    } catch (error: any) {
      console.error('Login error:', error)

      // API'den gelen hata mesajını kullan
      if (error.response?.data?.message) {
        return {
          success: false,
          message: error.response.data.message,
        }
      }

      // HTTP status code'a göre mesaj ver
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Kullanıcı adı veya şifre hatalı',
        }
      }

      if (error.response?.status === 400) {
        return {
          success: false,
          message: 'Geçersiz giriş bilgileri',
        }
      }

      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Bağlantı zaman aşımına uğradı',
        }
      }

      if (!error.response) {
        return {
          success: false,
          message: 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.',
        }
      }

      return {
        success: false,
        message: 'Giriş yapılırken beklenmeyen bir hata oluştu',
      }
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
    loading.value = true
    try {
      // Backend'in beklediği format
      const requestData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        userName: userData.userName,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
      }

      const response = await axios.post<AuthResponse>(
        `${API_BASE_URL}/auth/register`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      )

      console.log('Registration successful:', response.data.message)
      return response.data
    } catch (error: any) {
      console.error('Register error:', error)

      // API'den gelen hata mesajını kullan
      if (error.response?.data?.message) {
        return {
          success: false,
          message: error.response.data.message,
        }
      }

      // Validation errors - Backend ModelState errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMessages: string[] = []

        // Backend validation hatalarını Türkçe'ye çevir
        Object.keys(errors).forEach((field) => {
          const fieldErrors = errors[field]
          fieldErrors.forEach((error: string) => {
            if (error.includes('ConfirmPassword') && error.includes('required')) {
              errorMessages.push('Şifre tekrarı alanı zorunludur')
            } else if (error.includes('do not match')) {
              errorMessages.push('Şifreler eşleşmiyor')
            } else if (error.includes('Password') && error.includes('required')) {
              errorMessages.push('Şifre alanı zorunludur')
            } else if (error.includes('Email') && error.includes('required')) {
              errorMessages.push('E-posta alanı zorunludur')
            } else if (error.includes('FirstName') && error.includes('required')) {
              errorMessages.push('Ad alanı zorunludur')
            } else if (error.includes('LastName') && error.includes('required')) {
              errorMessages.push('Soyad alanı zorunludur')
            } else if (error.includes('UserName') && error.includes('required')) {
              errorMessages.push('Kullanıcı adı alanı zorunludur')
            } else {
              errorMessages.push(error)
            }
          })
        })

        return {
          success: false,
          message: errorMessages.join(', '),
        }
      }

      if (error.response?.status === 400) {
        return {
          success: false,
          message: 'Kayıt bilgilerinde hata var. Lütfen kontrol edin.',
        }
      }

      return {
        success: false,
        message: 'Kayıt olurken bir hata oluştu',
      }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    console.log('User logged out:', user.value?.userName)
    setToken(null)
    setUser(null)
  }

  const confirmEmail = async (token: string, email: string): Promise<AuthResponse> => {
    try {
      const response = await axios.get<AuthResponse>(`${API_BASE_URL}/auth/confirm-email`, {
        params: { token, email },
      })

      return response.data
    } catch (error: any) {
      console.error('Email confirmation error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'E-posta doğrulama başarısız',
      }
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
      return {
        success: false,
        message: error.response?.data?.message || 'Şifre sıfırlama başarısız',
      }
    }
  }

  const refreshUserData = async (): Promise<void> => {
    if (!token.value) return

    try {
      // Kullanıcı bilgilerini güncelle (eğer backend'de endpoint varsa)
      // const response = await axios.get<User>(`${API_BASE_URL}/auth/me`)
      // setUser(response.data)
    } catch (error) {
      console.error('User refresh error:', error)
      // Token geçersizse logout yap
      logout()
    }
  }

  const initializeAuth = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)

        console.log('Auth initialized:', {
          user: parsedUser.userName,
          tokenExists: !!savedToken,
        })
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
  const checkTokenValidity = (): boolean => {
    if (isTokenExpired()) {
      console.log('Token expired, logging out')
      logout()
      return false
    }
    return true
  }

  // Initialize axios interceptors
  setupAxiosInterceptors(token.value)

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
    refreshUserData,
    initializeAuth,
    checkTokenValidity,
    isTokenExpired,
  }
})
