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

// API Interface Types
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

export interface CreateTableRequest {
  name: string
  description: string
  isActive: boolean
  columns: Omit<Column, 'id'>[]
}

export interface UpdateTableRequest extends CreateTableRequest {
  id: number
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

// API Service Class
class ApiService {
  // Tables API
  async getTables(): Promise<Table[]> {
    try {
      const response = await apiClient.get<Table[]>('/Tables')
      return response.data
    } catch (error) {
      console.error('Error fetching tables:', error)
      throw error
    }
  }

  async getTable(id: number): Promise<Table> {
    try {
      const response = await apiClient.get<Table>(`/Tables/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching table:', error)
      throw error
    }
  }

  async createTable(data: CreateTableRequest): Promise<Table> {
    try {
      const response = await apiClient.post<Table>('/Tables', data)
      return response.data
    } catch (error) {
      console.error('Error creating table:', error)
      throw error
    }
  }

  async updateTable(id: number, data: UpdateTableRequest): Promise<Table> {
    try {
      const response = await apiClient.put<Table>(`/Tables/${id}`, data)
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
  } else if (error.response?.status >= 500) {
    toast.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.')
  } else if (error.response?.data?.message) {
    toast.error(error.response.data.message)
  } else if (customMessage) {
    toast.error(customMessage)
  } else {
    toast.error('Beklenmeyen bir hata oluştu')
  }

  console.error('API Error:', error)
}

export default apiService
