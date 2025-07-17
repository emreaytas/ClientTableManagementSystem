// src/services/api.ts - Backend Uyumlu API Service

import axios from 'axios'

// ========== INTERFACES - Backend Uyumlu ==========

// Backend'den gelen API yanıt yapısı
export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

// Backend'den gelen tablo yapısı
export interface ApiTable {
  id: number
  tableName: string
  description: string
  userId: number
  createdAt: string
  updatedAt: string | null
  columns: ApiColumn[]
}

// Backend'den gelen kolon yapısı
export interface ApiColumn {
  id: number
  columnName: string
  dataType: number // 1=string, 2=int, 3=decimal, 4=datetime
  isRequired: boolean
  displayOrder: number
  defaultValue: string
  createdAt: string
  updatedAt: string | null
}

// Tablo oluşturma isteği
export interface CreateTableRequest {
  tableName: string
  description: string
  columns: {
    columnName: string
    dataType: number
    isRequired: boolean
    displayOrder: number
    defaultValue: string
  }[]
}

// Tablo güncelleme isteği
export interface UpdateTableRequest {
  tableId: number
  tableName: string
  description: string
  columns: UpdateColumnRequest[]
}

// Kolon güncelleme isteği
export interface UpdateColumnRequest {
  columnId?: number // Yeni kolonlar için null
  columnName: string
  dataType: number
  isRequired: boolean
  displayOrder: number
  defaultValue?: string
  forceUpdate?: boolean
}

// Giriş isteği - Backend'e uygun
export interface LoginRequest {
  userName: string // Backend'de userName kullanılıyor
  password: string
}

// Kayıt isteği - Backend'e uygun
export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  userName: string
  password: string
  confirmPassword: string
}

// Giriş yanıtı - Backend'den gelen yapı
export interface LoginResponse {
  success: boolean
  message: string
  token?: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    userName: string
    emailConfirmed: boolean
  }
}

// Kayıt yanıtı - Backend'den gelen yapı
export interface RegisterResponse {
  success: boolean
  message: string
  requiresEmailConfirmation?: boolean
}

// Tablo verisi
export interface TableData {
  tableId: number
  tableName: string
  columns: TableColumn[]
  data: TableRowData[]
}

export interface TableColumn {
  id: number
  columnName: string
  dataType: number
  isRequired: boolean
  displayOrder: number
  defaultValue?: string
}

export interface TableRowData {
  rowIdentifier: number
  values: Record<string, any>
}

// Veri ekleme isteği
export interface AddTableDataRequest {
  tableId: number
  columnValues: Record<number, string>
}

// Veri güncelleme isteği
export interface UpdateTableDataRequest {
  tableId: number
  rowId: number
  columnValues: Record<number, string>
}

// Dashboard istatistikleri
export interface DashboardStats {
  totalTables: number
  totalRecords: number
  tablesThisMonth: number
  activeTables: number
}

// Data type enum
export enum ColumnDataType {
  VARCHAR = 1,
  INT = 2,
  DECIMAL = 3,
  DATETIME = 4,
}

// ========== AXIOS INSTANCE ==========

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7018/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor - Token ekleme
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') // Mevcut yapınızda 'token' kullanılıyor
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor - Hata yönetimi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // AuthStore'dan logout işlemi yapmak için
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  },
)

// ========== API SERVICE CLASS ==========

class ApiService {
  // ========== AUTHENTICATION ==========

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/Auth/login', credentials)

      // Token'ı localStorage'a kaydet (mevcut yapınızla uyumlu)
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token)
      }

      return response.data
    } catch (error) {
      console.error('Login error:', error)
      throw this.extractError(error)
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>('/Auth/register', userData)
      return response.data
    } catch (error) {
      console.error('Register error:', error)
      throw this.extractError(error)
    }
  }

  async confirmEmail(token: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/Auth/confirm-email', { token, email })
      return response.data
    } catch (error) {
      console.error('Email confirmation error:', error)
      throw this.extractError(error)
    }
  }

  // ========== TABLES ==========

  // Backend API'sine uygun getAllTables metodu
  async getAllTables(): Promise<ApiResponse<ApiTable[]>> {
    try {
      const response = await apiClient.get<ApiResponse<ApiTable[]>>('/Tables')
      return response.data
    } catch (error) {
      console.error('Error fetching tables:', error)
      throw this.extractError(error)
    }
  }

  async getTableById(id: number): Promise<ApiTable> {
    try {
      const response = await apiClient.get<ApiResponse<ApiTable>>(`/Tables/${id}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching table:', error)
      throw this.extractError(error)
    }
  }

  async createTable(data: CreateTableRequest): Promise<ApiTable> {
    try {
      console.log('Creating table with data:', data)
      const response = await apiClient.post<ApiResponse<ApiTable>>('/Tables', data)
      return response.data.data
    } catch (error) {
      console.error('Error creating table:', error)
      throw this.extractError(error)
    }
  }

  async updateTable(id: number, data: UpdateTableRequest): Promise<ApiTable> {
    try {
      console.log('Updating table with data:', data)
      const response = await apiClient.put<ApiResponse<ApiTable>>(`/Tables/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Error updating table:', error)
      throw this.extractError(error)
    }
  }

  async deleteTable(id: number): Promise<void> {
    try {
      await apiClient.delete(`/Tables/${id}`)
    } catch (error) {
      console.error('Error deleting table:', error)
      throw this.extractError(error)
    }
  }

  // ========== TABLE DATA ==========

  async getTableData(tableId: number): Promise<TableData> {
    try {
      const response = await apiClient.get<TableData>(`/TableData/${tableId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching table data:', error)
      throw this.extractError(error)
    }
  }

  async addTableData(data: AddTableDataRequest): Promise<void> {
    try {
      await apiClient.post('/TableData', data)
    } catch (error) {
      console.error('Error adding table data:', error)
      throw this.extractError(error)
    }
  }

  async updateTableData(data: UpdateTableDataRequest): Promise<void> {
    try {
      await apiClient.put(`/TableData/${data.rowId}`, {
        tableId: data.tableId,
        columnValues: data.columnValues,
      })
    } catch (error) {
      console.error('Error updating table data:', error)
      throw this.extractError(error)
    }
  }

  async deleteTableData(tableId: number, rowId: number): Promise<void> {
    try {
      await apiClient.delete(`/TableData/${rowId}?tableId=${tableId}`)
    } catch (error) {
      console.error('Error deleting table data:', error)
      throw this.extractError(error)
    }
  }

  // ========== DASHBOARD ==========

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/Dashboard/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw this.extractError(error)
    }
  }

  // ========== UTILITY METHODS ==========

  private extractError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message)
    }
    if (error.response?.data?.errors) {
      const errorMessages = Object.values(error.response.data.errors).flat()
      return new Error(errorMessages.join(', '))
    }
    if (error.message) {
      return new Error(error.message)
    }
    return new Error('Bilinmeyen bir hata oluştu')
  }

  // Data type labels for UI
  getDataTypeLabel(dataType: number): string {
    switch (dataType) {
      case 1:
        return 'Metin'
      case 2:
        return 'Sayı'
      case 3:
        return 'Ondalık'
      case 4:
        return 'Tarih'
      default:
        return 'Bilinmiyor'
    }
  }

  // Data type colors for UI
  getDataTypeColor(dataType: number): string {
    switch (dataType) {
      case 1:
        return 'primary'
      case 2:
        return 'success'
      case 3:
        return 'warning'
      case 4:
        return 'info'
      default:
        return 'grey'
    }
  }
}

// Singleton instance
export const apiService = new ApiService()

export default apiService
