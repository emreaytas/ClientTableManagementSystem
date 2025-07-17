// src/services/api.ts - Backend Uyumlu API Service

import axios from 'axios'

// ========== INTERFACES - Backend Uyumlu ==========

// Backend'den gelen tablo yapısı
export interface ApiTable {
  id: number
  tableName: string
  description: string
  createdAt: string
  updatedAt?: string
  isActive: boolean
  recordCount?: number
  columns: ApiColumn[]
}

// Backend'den gelen kolon yapısı
export interface ApiColumn {
  id: number
  columnName: string
  dataType: number // 0=VARCHAR, 1=INT, 2=DECIMAL, 3=DATETIME
  isRequired: boolean
  displayOrder: number
  defaultValue: string
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
  VARCHAR = 0,
  INT = 1,
  DECIMAL = 2,
  DATETIME = 3,
}

// ========== AXIOS INSTANCE ==========

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7138/api',
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
      console.error('Error during login:', error)
      throw this.extractError(error)
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>('/Auth/register', userData)
      return response.data
    } catch (error) {
      console.error('Error during registration:', error)
      throw this.extractError(error)
    }
  }

  async confirmEmail(token: string, email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/Auth/confirm-email', { token, email })
      return response.data
    } catch (error) {
      console.error('Error confirming email:', error)
      throw this.extractError(error)
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/Auth/logout')
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      localStorage.removeItem('token')
    }
  }

  // ========== TABLES ==========

  async getTables(): Promise<ApiTable[]> {
    try {
      const response = await apiClient.get<ApiTable[]>('/Tables')
      return response.data
    } catch (error) {
      console.error('Error fetching tables:', error)
      throw this.extractError(error)
    }
  }

  async getTable(id: number): Promise<ApiTable> {
    try {
      const response = await apiClient.get<ApiTable>(`/Tables/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching table:', error)
      throw this.extractError(error)
    }
  }

  async createTable(data: CreateTableRequest): Promise<ApiTable> {
    try {
      console.log('Creating table with data:', data)
      const response = await apiClient.post('/Tables', data)

      // Backend'den gelen yanıt yapısına göre table'ı çıkar
      if (response.data.table) {
        return response.data.table
      }
      return response.data
    } catch (error) {
      console.error('Error creating table:', error)
      throw this.extractError(error)
    }
  }

  async updateTable(id: number, data: UpdateTableRequest): Promise<ApiTable> {
    try {
      console.log('Updating table with data:', data)
      const response = await apiClient.put(`/Tables/${id}`, data)

      // Backend'den gelen yanıt yapısına göre table'ı çıkar
      if (response.data.table) {
        return response.data.table
      }
      return response.data
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
      const response = await apiClient.get<TableData>(`/Tables/${tableId}/data`)
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

  // Data type helpers - Mevcut yapınızla uyumlu
  getDataTypeLabel(dataType: number): string {
    switch (dataType) {
      case 0: // ColumnDataType.VARCHAR
        return 'VARCHAR'
      case 1: // ColumnDataType.INT
        return 'INT'
      case 2: // ColumnDataType.DECIMAL
        return 'DECIMAL'
      case 3: // ColumnDataType.DATETIME
        return 'DATETIME'
      default:
        return 'UNKNOWN'
    }
  }

  getDataTypeColor(dataType: number): string {
    switch (dataType) {
      case 0: // ColumnDataType.VARCHAR
        return 'blue'
      case 1: // ColumnDataType.INT
        return 'green'
      case 2: // ColumnDataType.DECIMAL
        return 'orange'
      case 3: // ColumnDataType.DATETIME
        return 'purple'
      default:
        return 'grey'
    }
  }

  getDataTypeOptions() {
    return [
      { title: 'Metin (VARCHAR)', value: 0, color: 'blue' },
      { title: 'Sayı (INT)', value: 1, color: 'green' },
      { title: 'Ondalık (DECIMAL)', value: 2, color: 'orange' },
      { title: 'Tarih/Saat (DATETIME)', value: 3, color: 'purple' },
    ]
  }

  // Data formatting helpers
  formatDataValue(value: any, dataType: number): string {
    if (value === null || value === undefined || value === '') return ''

    switch (dataType) {
      case 3: // ColumnDataType.DATETIME
        try {
          return new Date(value).toLocaleString('tr-TR')
        } catch {
          return value.toString()
        }
      case 2: // ColumnDataType.DECIMAL
        try {
          return parseFloat(value).toFixed(2)
        } catch {
          return value.toString()
        }
      case 1: // ColumnDataType.INT
        try {
          return parseInt(value).toString()
        } catch {
          return value.toString()
        }
      default:
        return value.toString()
    }
  }

  // Data validation helpers
  validateDataValue(
    value: any,
    dataType: number,
    isRequired: boolean,
  ): { isValid: boolean; error?: string } {
    if (isRequired && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: 'Bu alan zorunludur' }
    }

    if (!value && !isRequired) {
      return { isValid: true }
    }

    switch (dataType) {
      case 1: // ColumnDataType.INT
        if (isNaN(parseInt(value))) {
          return { isValid: false, error: 'Geçerli bir sayı giriniz' }
        }
        break
      case 2: // ColumnDataType.DECIMAL
        if (isNaN(parseFloat(value))) {
          return { isValid: false, error: 'Geçerli bir ondalık sayı giriniz' }
        }
        break
      case 3: // ColumnDataType.DATETIME
        if (!Date.parse(value)) {
          return { isValid: false, error: 'Geçerli bir tarih giriniz' }
        }
        break
      case 0: // ColumnDataType.VARCHAR
        if (value.length > 255) {
          return { isValid: false, error: 'Metin 255 karakterden uzun olamaz' }
        }
        break
    }

    return { isValid: true }
  }

  // Sample data generator
  getSampleData(column: { columnName: string; dataType: number; defaultValue?: string }): string {
    if (column.defaultValue) {
      return column.defaultValue
    }

    switch (column.dataType) {
      case 0: // ColumnDataType.VARCHAR
        return 'Örnek metin'
      case 1: // ColumnDataType.INT
        return '123'
      case 2: // ColumnDataType.DECIMAL
        return '123.45'
      case 3: // ColumnDataType.DATETIME
        return new Date().toLocaleString('tr-TR')
      default:
        return 'Veri'
    }
  }

  // ========== ERROR HANDLING ==========

  private extractError(error: any): Error {
    // Backend'den gelen hata yapısını analiz et
    if (error.response?.data) {
      const data = error.response.data

      // Backend'den success: false ile gelen yapı
      if (data.success === false && data.message) {
        return new Error(data.message)
      }

      // Validation errors
      if (data.errors) {
        const errors = Array.isArray(data.errors) ? data.errors : Object.values(data.errors).flat()
        return new Error(errors.join(', '))
      }

      // Direct message
      if (data.message) {
        return new Error(data.message)
      }

      // Issues array
      if (data.issues) {
        return new Error(data.issues.join(', '))
      }
    }

    // Network or other errors
    if (error.message) {
      return new Error(error.message)
    }

    return new Error('Bilinmeyen bir hata oluştu')
  }

  // ========== VALIDATION HELPERS ==========

  validateTableName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Tablo adı boş olamaz' }
    }

    if (name.length < 2) {
      return { isValid: false, error: 'Tablo adı en az 2 karakter olmalıdır' }
    }

    if (name.length > 50) {
      return { isValid: false, error: 'Tablo adı en fazla 50 karakter olabilir' }
    }

    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ][a-zA-ZçÇğĞıİöÖşŞüÜ0-9\s_-]*$/.test(name)) {
      return { isValid: false, error: 'Tablo adı geçersiz karakterler içeriyor' }
    }

    return { isValid: true }
  }

  validateColumnName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: 'Kolon adı boş olamaz' }
    }

    if (name.length < 1) {
      return { isValid: false, error: 'Kolon adı en az 1 karakter olmalıdır' }
    }

    if (name.length > 50) {
      return { isValid: false, error: 'Kolon adı en fazla 50 karakter olabilir' }
    }

    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ][a-zA-ZçÇğĞıİöÖşŞüÜ0-9\s_-]*$/.test(name)) {
      return { isValid: false, error: 'Kolon adı geçersiz karakterler içeriyor' }
    }

    return { isValid: true }
  }

  // ========== FORMAT HELPERS ==========

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  formatRowCount(count: number): string {
    if (count < 1000) return count.toString()
    if (count < 1000000) return (count / 1000).toFixed(1) + 'K'
    return (count / 1000000).toFixed(1) + 'M'
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now.getTime() - date.getTime()

      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'Az önce'
      if (minutes < 60) return `${minutes} dakika önce`
      if (hours < 24) return `${hours} saat önce`
      if (days < 7) return `${days} gün önce`

      return this.formatDate(dateString)
    } catch {
      return dateString
    }
  }

  // ========== AUTHENTICATION HELPERS ==========

  getAuthToken(): string | null {
    return localStorage.getItem('token')
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }

  clearAuthData(): void {
    localStorage.removeItem('token')
  }
}

// ========== EXPORT ==========

// Singleton instance export - Mevcut yapınızla uyumlu
export const apiService = new ApiService()

// Default export
export default apiService

// Type exports
export type {
  ApiTable,
  ApiColumn,
  CreateTableRequest,
  UpdateTableRequest,
  UpdateColumnRequest,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  TableData,
  TableColumn,
  TableRowData,
  AddTableDataRequest,
  UpdateTableDataRequest,
  DashboardStats,
}
