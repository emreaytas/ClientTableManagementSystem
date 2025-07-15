import axios, { AxiosResponse, AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import router from '@/router'

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7018/api'

// Axios instance oluştur
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 saniye timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Token'ı header'a ekle
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Request log (development ortamında)
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      })
    }

    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  },
)

// Response Interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Response log (development ortamında)
    if (import.meta.env.DEV) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }

    return response
  },
  (error: AxiosError) => {
    const toast = useToast()

    // Error log
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    })

    // Status code'a göre hata yönetimi
    if (error.response?.status === 401) {
      // Unauthorized - Token geçersiz
      const authStore = useAuthStore()
      authStore.logout()

      toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.')

      // Auth sayfasına yönlendir (sadece auth sayfasında değilsek)
      if (router.currentRoute.value.name !== 'Auth') {
        router.push({
          name: 'Auth',
          query: { redirect: router.currentRoute.value.fullPath },
        })
      }
    } else if (error.response?.status === 403) {
      // Forbidden - Yetkisiz erişim
      toast.error('Bu işlem için yetkiniz bulunmamaktadır.')
    } else if (error.response?.status === 404) {
      // Not Found - Kaynak bulunamadı
      toast.error('İstenen kaynak bulunamadı.')
    } else if (error.response?.status === 422) {
      // Validation Error - Form validasyon hatası
      const errorData = error.response.data as any
      if (errorData?.errors) {
        // ModelState errors
        const errors = Object.values(errorData.errors).flat() as string[]
        errors.forEach((err) => toast.error(err))
      } else if (errorData?.message) {
        toast.error(errorData.message)
      } else {
        toast.error('Form verilerinde hata bulundu.')
      }
    } else if (error.response?.status === 429) {
      // Too Many Requests - Rate limit
      toast.error('Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.')
    } else if (error.response?.status >= 500) {
      // Server Error - Sunucu hatası
      toast.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.')
    } else if (error.code === 'ECONNABORTED') {
      // Timeout Error
      toast.error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.')
    } else if (!error.response) {
      // Network Error
      toast.error('Bağlantı hatası. İnternet bağlantınızı kontrol edin.')
    }

    return Promise.reject(error)
  },
)

// Helper functions
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  if (error.response?.data?.errors) {
    const errors = Object.values(error.response.data.errors).flat() as string[]
    return errors.join(', ')
  }

  if (error.message) {
    return error.message
  }

  return 'Bilinmeyen bir hata oluştu'
}

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    CONFIRM_EMAIL: '/auth/confirm-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    RESEND_EMAIL: '/auth/resend-email-confirmation',
    ME: '/auth/me',
  },

  // User endpoints
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
  },

  // Table endpoints
  TABLES: {
    LIST: '/tables',
    CREATE: '/tables',
    GET: (id: string) => `/tables/${id}`,
    UPDATE: (id: string) => `/tables/${id}`,
    DELETE: (id: string) => `/tables/${id}`,
    DATA: (id: string) => `/tables/${id}/data`,
    ADD_DATA: (id: string) => `/tables/${id}/data`,
    UPDATE_DATA: (id: string, dataId: string) => `/tables/${id}/data/${dataId}`,
    DELETE_DATA: (id: string, dataId: string) => `/tables/${id}/data/${dataId}`,
  },
}

// Export configured axios instance
export default apiClient
