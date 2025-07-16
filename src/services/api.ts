import axios from 'axios'
import { useToast } from 'vue-toastification'

// API Base Configuration
const API_BASE_URL = 'https://localhost:7018/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to auth
      localStorage.removeItem('token')
      window.location.href = '/auth'
    }

    return Promise.reject(error)
  },
)

// API Response Interfaces (matching actual API responses)
export interface ApiTable {
  id: number
  tableName: string
  description: string
  createdAt: string
  columns: ApiColumn[]
}

export interface ApiColumn {
  id: number
  columnName: string
  dataType: number // Enum: 0=VARCHAR, 1=INT, 2=DECIMAL, 3=DATETIME
  isRequired: boolean
  displayOrder: number
  defaultValue: string
}

// API Request Interfaces (for creating/updating)
export interface CreateTableRequest {
  tableName: string
  description: string
  columns: CreateColumnRequest[]
}

export interface CreateColumnRequest {
  columnName: string
  dataType: number // ColumnDataType enum
  isRequired: boolean
  displayOrder: number
  defaultValue: string
}

export interface UpdateTableRequest extends CreateTableRequest {
  id: number
}

// Legacy interfaces for backward compatibility
export interface Table {
  id: number
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  recordCount?: number
  columns: Column[]
}

export interface Column {
  id?: number
  name: string
  type: 'varchar' | 'int' | 'decimal' | 'datetime'
  maxLength?: number
  isRequired: boolean
  isUnique: boolean
  precision?: number
  scale?: number
}

export interface TableData {
  tableId: number
  tableName: string
  columns: Column[]
  rows: TableRow[]
}

export interface TableRow {
  rowIdentifier: number
  values: Record<number, string>
}

export interface AddTableDataRequest {
  tableId: number
  columnValues: Record<number, string>
}

export interface UpdateTableDataRequest {
  tableId: number
  rowId: number
  columnValues: Record<number, string>
}

// Data Type Enums
export enum ColumnDataType {
  VARCHAR = 0,
  INT = 1,
  DECIMAL = 2,
  DATETIME = 3,
}

// API Service Class
class ApiService {
  // Tables API
  async getTables(): Promise<ApiTable[]> {
    try {
      const response = await apiClient.get<ApiTable[]>('/Tables')
      return response.data
    } catch (error) {
      console.error('Error fetching tables:', error)
      throw error
    }
  }

  async getTable(id: number): Promise<ApiTable> {
    try {
      const response = await apiClient.get<ApiTable>(`/Tables/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching table:', error)
      throw error
    }
  }

  async createTable(data: CreateTableRequest): Promise<ApiTable> {
    try {
      console.log('Creating table with data:', data)
      const response = await apiClient.post<{ message: string; table: ApiTable }>('/Tables', data)
      return response.data.table
    } catch (error) {
      console.error('Error creating table:', error)
      throw error
    }
  }

  async updateTable(id: number, data: UpdateTableRequest): Promise<ApiTable> {
    try {
      const response = await apiClient.put<ApiTable>(`/Tables/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating table:', error)
      throw error
    }
  }

  async deleteTable(id: number): Promise<void> {
    try {
      await apiClient.delete(`/Tables/${id}`)
    } catch (error) {
      console.error('Error deleting table:', error)
      throw error
    }
  }

  // Table Data API
  async getTableData(tableId: number): Promise<TableData> {
    try {
      const response = await apiClient.get<TableData>(`/Tables/${tableId}/data`)
      return response.data
    } catch (error) {
      console.error('Error fetching table data:', error)
      throw error
    }
  }

  async addTableData(data: AddTableDataRequest): Promise<void> {
    try {
      await apiClient.post('/TableData', data)
    } catch (error) {
      console.error('Error adding table data:', error)
      throw error
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
      throw error
    }
  }

  async deleteTableData(tableId: number, rowId: number): Promise<void> {
    try {
      await apiClient.delete(`/TableData/${rowId}`, {
        params: { tableId },
      })
    } catch (error) {
      console.error('Error deleting table data:', error)
      throw error
    }
  }

  // Test endpoints
  async testPublic() {
    try {
      const response = await apiClient.get('/Test/public')
      return response.data
    } catch (error) {
      console.error('Error in test public:', error)
      throw error
    }
  }

  async testProtected() {
    try {
      const response = await apiClient.get('/Test/protected')
      return response.data
    } catch (error) {
      console.error('Error in test protected:', error)
      throw error
    }
  }

  async getTokenInfo() {
    try {
      const response = await apiClient.get('/Test/token-info')
      return response.data
    } catch (error) {
      console.error('Error getting token info:', error)
      throw error
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export for composables
export const useApi = () => {
  return {
    apiService,
    apiClient,
  }
}

// Helper functions
export const handleApiError = (error: any, customMessage?: string) => {
  const toast = useToast()

  if (error.response?.status === 401) {
    toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.')
    return
  } else if (error.response?.status === 403) {
    toast.error('Bu işlem için yetkiniz bulunmuyor.')
    return
  } else if (error.response?.status === 404) {
    toast.error('İstenen kaynak bulunamadı.')
    return
  } else if (error.response?.status === 400) {
    // Bad Request - Validation errors
    const errorMessage =
      error.response?.data?.message || error.response?.data?.errors || 'Geçersiz istek.'
    toast.error(customMessage || errorMessage)
    return
  } else if (error.response?.status === 429) {
    // Too Many Requests
    toast.error('Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.')
    return
  } else if (error.response?.status && error.response.status >= 500) {
    // Server Error
    toast.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.')
    return
  } else if (error.code === 'ECONNABORTED') {
    // Timeout Error
    toast.error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.')
    return
  } else if (!error.response) {
    // Network Error
    toast.error('Bağlantı hatası. İnternet bağlantınızı kontrol edin.')
    return
  }

  // Generic error
  const fallbackMessage = customMessage || 'Bilinmeyen bir hata oluştu.'
  toast.error(fallbackMessage)
}

// Data type conversion helpers
export const convertDataTypeToString = (dataType: number): string => {
  switch (dataType) {
    case ColumnDataType.VARCHAR:
      return 'varchar'
    case ColumnDataType.INT:
      return 'int'
    case ColumnDataType.DECIMAL:
      return 'decimal'
    case ColumnDataType.DATETIME:
      return 'datetime'
    default:
      return 'varchar'
  }
}

export const convertStringToDataType = (type: string): ColumnDataType => {
  switch (type.toLowerCase()) {
    case 'varchar':
      return ColumnDataType.VARCHAR
    case 'int':
      return ColumnDataType.INT
    case 'decimal':
      return ColumnDataType.DECIMAL
    case 'datetime':
      return ColumnDataType.DATETIME
    default:
      return ColumnDataType.VARCHAR
  }
}

// Convert API response to legacy Table format for backward compatibility
export const convertApiTableToLegacy = (apiTable: ApiTable): Table => {
  return {
    id: apiTable.id,
    name: apiTable.tableName,
    description: apiTable.description,
    isActive: true, // API doesn't return this, assume true
    createdAt: apiTable.createdAt,
    updatedAt: apiTable.createdAt, // API doesn't return updatedAt
    recordCount: 0, // API doesn't return this in list
    columns: apiTable.columns.map(convertApiColumnToLegacy),
  }
}

// Convert API column to legacy Column format
export const convertApiColumnToLegacy = (apiColumn: ApiColumn): Column => {
  return {
    id: apiColumn.id,
    name: apiColumn.columnName,
    type: convertDataTypeToString(apiColumn.dataType) as 'varchar' | 'int' | 'decimal' | 'datetime',
    isRequired: apiColumn.isRequired,
    isUnique: false, // API doesn't have this field
    maxLength: undefined,
    precision: undefined,
    scale: undefined,
  }
}

// API Endpoints constants
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
    CHECK_USERNAME: (username: string) => `/auth/check-username/${username}`,
    CHECK_EMAIL: (email: string) => `/auth/check-email/${email}`,
  },

  // User endpoints
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
  },

  // Table endpoints
  TABLES: {
    LIST: '/Tables',
    CREATE: '/Tables',
    GET: (id: string | number) => `/Tables/${id}`,
    UPDATE: (id: string | number) => `/Tables/${id}`,
    DELETE: (id: string | number) => `/Tables/${id}`,
    SCHEMA: (id: string | number) => `/Tables/${id}/schema`,
    INFO: (id: string | number) => `/Tables/${id}/info`,
  },

  // Table Data endpoints
  TABLE_DATA: {
    GET: (tableId: string | number) => `/Tables/${tableId}/data`,
    CREATE: '/TableData',
    UPDATE: (rowId: string | number) => `/TableData/${rowId}`,
    DELETE: (rowId: string | number) => `/TableData/${rowId}`,
  },

  // Test endpoints
  TEST: {
    PUBLIC: '/Test/public',
    PROTECTED: '/Test/protected',
    TOKEN_INFO: '/Test/token-info',
  },
}

// Export configured axios instance
export default apiClient
