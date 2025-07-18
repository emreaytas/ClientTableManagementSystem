// src/services/api.ts - TablesController Uyumlu API Service

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
  dataType: number // 0=VARCHAR, 1=INT, 2=DECIMAL, 3=DATETIME
  isRequired: boolean
  displayOrder: number
  defaultValue: string
  createdAt: string
  updatedAt: string | null
}

// Tablo verisi - Backend'deki TableDataResponse yapısına uygun
export interface TableData {
  tableId: number
  tableName: string
  columns: TableColumn[]
  data: Array<Dictionary<string, any>> // Backend'deki yapı
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

// Dictionary type for backend compatibility
export interface Dictionary<TKey extends string | number, TValue> {
  [key: string]: TValue
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

// Veri ekleme isteği - Column name bazlı
export interface AddTableDataRequest {
  tableId: number
  columnValues: Record<string, string> // Column name → value
}

// Veri güncelleme isteği - Column name bazlı
export interface UpdateTableDataRequest {
  tableId: number
  rowId: number
  columnValues: Record<string, string> // Column name → value
}

// Dashboard istatistikleri
export interface DashboardStats {
  totalTables: number
  totalRecords: number
  tablesThisMonth: number
  activeTables: number
}

// Data type enum - Backend uyumlu (1'den başlıyor)
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

// Response interceptor - Hata yönetimi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
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

  // Alias for backward compatibility
  async getTable(id: number): Promise<ApiTable> {
    return this.getTableById(id)
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

  // ========== TABLE DATA - TablesController Endpoints ==========

  // TablesController: GET /Tables/{id}/data
  async getTableData(tableId: number): Promise<TableData> {
    try {
      console.log('Getting table data from TablesController:', tableId)
      const response = await apiClient.get<ApiResponse<any>>(`/Tables/${tableId}/data`)

      // Backend'den gelen veriyi frontend formatına çevir
      const backendData = response.data.data

      // TableData formatına dönüştür
      const transformedData: TableData = {
        tableId: backendData.tableId,
        tableName: backendData.tableName,
        columns: backendData.columns || [],
        data: this.transformBackendDataToRows(backendData.data || [], backendData.columns || []),
      }

      return transformedData
    } catch (error) {
      console.error('Error fetching table data:', error)
      throw this.extractError(error)
    }
  }

  // Backend'den gelen Dictionary<string, object>[] formatını frontend'in beklediği TableRowData[] formatına çevir
  private transformBackendDataToRows(
    backendData: Array<Dictionary<string, any>>,
    columns: any[],
  ): TableRowData[] {
    if (!backendData || backendData.length === 0) return []

    return backendData.map((row, index) => {
      const values: Record<string, any> = {}

      // Backend'den gelen veriyi column name ile map et
      columns.forEach((column) => {
        // Column name ile değeri bul
        const columnName = column.columnName
        const columnValue = row[columnName]

        // Hem column ID hem de column name ile erişilebilir yap
        values[column.id] = columnValue || null
        values[`col_${column.id}`] = columnValue || null
      })

      return {
        rowIdentifier: row['Id'] || row['id'] || row['RowId'] || index + 1, // Backend'den gelen ID varsa kullan
        values: values,
      }
    })
  }

  // ========== TABLE DATA OPERATIONS - Doğru Backend DTO Format ==========

  // ========== TABLE DATA OPERATIONS - Detaylı Debug ile ==========

  async addTableData(data: AddTableDataRequest): Promise<void> {
    try {
      console.log('=== ADD TABLE DATA DEBUG (Swagger Format Test) ===')
      console.log('1. Input data:', data)
      console.log('2. TableId:', data.tableId)
      console.log('3. ColumnValues:', data.columnValues)
      console.log('4. Column Names:', Object.keys(data.columnValues))
      console.log('5. Column Values:', Object.values(data.columnValues))

      // İlk önce backend'in örneğindeki formatla deneyelim
      const fullFormatBody = {
        tableId: data.tableId,
        columnValues: data.columnValues,
      }

      console.log('6. Trying full format first:', JSON.stringify(fullFormatBody, null, 2))
      console.log('7. Request URL:', `/Tables/${data.tableId}/data`)

      try {
        // Backend'in verdiği örnek format ile dene
        const response = await apiClient.post(`/Tables/${data.tableId}/data`, fullFormatBody)
        console.log('8. Success with full format:', response.data)
        console.log('=== ADD TABLE DATA SUCCESS (Full Format) ===')
        return
      } catch (fullFormatError: any) {
        console.log(
          '9. Full format failed, trying Dictionary only:',
          fullFormatError.response?.status,
        )
        console.log('10. Full format error:', fullFormatError.response?.data)

        // Eğer full format çalışmazsa, sadece columnValues dene (PUT gibi)
        const dictOnlyBody = data.columnValues
        console.log('11. Trying Dictionary only format:', JSON.stringify(dictOnlyBody, null, 2))

        try {
          const response = await apiClient.post(`/Tables/${data.tableId}/data`, dictOnlyBody)
          console.log('12. Success with Dictionary only:', response.data)
          console.log('=== ADD TABLE DATA SUCCESS (Dictionary Only) ===')
          return
        } catch (dictError: any) {
          console.log('13. Dictionary only also failed:', dictError.response?.data)
          throw dictError // En son hatayı fırlat
        }
      }
    } catch (error: any) {
      console.log('=== ADD TABLE DATA ERROR (Both Formats Failed) ===')
      console.log('14. Final error object:', error)
      console.log('15. Error response data:', error.response?.data)
      console.log('16. Error response status:', error.response?.status)
      console.log('17. Error config URL:', error.config?.url)
      console.log('18. Error config data:', error.config?.data)

      // Backend'den gelen gerçek hata mesajını kontrol et
      if (error.response?.data) {
        console.log('19. Backend error details:', JSON.stringify(error.response.data, null, 2))
      }

      console.log('=== ADD TABLE DATA ERROR END ===')

      console.error('Error adding table data (swagger format test):', error)
      throw this.extractError(error)
    }
  }

  // TableDataController güncelleme endpoint'i henüz tam implementasyon yok
  // TablesController'ı kullanıyoruz: PUT /Tables/{id}/data/{rowIdentifier}
  async updateTableData(data: UpdateTableDataRequest): Promise<void> {
    try {
      console.log('=== UPDATE TABLE DATA DEBUG ===')
      console.log('1. Input data:', data)
      console.log('2. TableId:', data.tableId)
      console.log('3. RowId:', data.rowId)
      console.log('4. ColumnValues:', data.columnValues)

      // Backend sadece Dictionary<string, string> bekliyor (columnValues)
      // Request body'de tableId veya rowId göndermiyoruz, URL'de var
      const requestBody = data.columnValues // Sadece column values

      console.log('5. Request body (only columnValues):', requestBody)
      console.log('6. Request URL:', `/Tables/${data.tableId}/data/${data.rowId}`)

      // TablesController endpoint: PUT /Tables/{tableId}/data/{rowId}
      const response = await apiClient.put(
        `/Tables/${data.tableId}/data/${data.rowId}`,
        requestBody,
      )

      console.log('7. Success response:', response.data)
      console.log('=== UPDATE TABLE DATA SUCCESS ===')
    } catch (error: any) {
      console.log('=== UPDATE TABLE DATA ERROR ===')
      console.log('8. Error object:', error)
      console.log('9. Error response data:', error.response?.data)
      console.log('10. Error response status:', error.response?.status)
      console.log('=== UPDATE TABLE DATA ERROR END ===')

      console.error('Error updating table data:', error)
      throw this.extractError(error)
    }
  }

  // TablesController silme endpoint'i
  async deleteTableData(tableId: number, rowId: number): Promise<void> {
    try {
      console.log('Deleting table data via TablesController:', { tableId, rowId })
      // TablesController endpoint: DELETE /Tables/{tableId}/data/{rowId}
      await apiClient.delete(`/Tables/${tableId}/data/${rowId}`)
    } catch (error) {
      console.error('Error deleting table data:', error)
      throw this.extractError(error)
    }
  }

  // ========== UTILITY METHODS ==========

  // Hata çıkarma yardımcı metodu - 500 hataları için özel handling
  private extractError(error: any): Error {
    console.log('=== EXTRACT ERROR DEBUG ===')
    console.log('Raw error:', error)

    if (error.response) {
      console.log('Response error detected')
      console.log('Status:', error.response.status)
      console.log('Status text:', error.response.statusText)
      console.log('Response data:', error.response.data)
      console.log('Response headers:', error.response.headers)

      // 500 Internal Server Error için özel handling
      if (error.response.status === 500) {
        console.log('500 Internal Server Error detected')

        if (error.response.data?.message) {
          console.log('Backend 500 message:', error.response.data.message)
          return new Error(`Server Error: ${error.response.data.message}`)
        }

        if (error.response.data?.title) {
          console.log('Backend 500 title:', error.response.data.title)
          return new Error(`Server Error: ${error.response.data.title}`)
        }

        // Backend'den detaylı hata bilgisi varsa
        if (error.response.data) {
          const errorData =
            typeof error.response.data === 'string'
              ? error.response.data
              : JSON.stringify(error.response.data)
          console.log('Raw 500 error data:', errorData)
          return new Error(`Sunucu hatası (500): ${errorData}`)
        }

        return new Error(
          "Sunucu hatası (500): Backend'de bir sorun oluştu. Lütfen backend loglarını kontrol edin.",
        )
      }

      // Backend'den gelen hata mesajı (diğer status kodları için)
      if (error.response.data?.message) {
        console.log('Backend message found:', error.response.data.message)
        return new Error(error.response.data.message)
      }

      // Validation errors
      if (error.response.data?.errors) {
        console.log('Validation errors found:', error.response.data.errors)
        const errorMessages = []
        for (const [field, messages] of Object.entries(error.response.data.errors)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(', ')}`)
          }
        }
        return new Error(`Validation errors: ${errorMessages.join('; ')}`)
      }

      // Generic HTTP error
      if (error.response.status) {
        const message = `HTTP ${error.response.status}: ${error.response.statusText}`
        console.log('HTTP error message:', message)
        return new Error(message)
      }

      // Raw response data
      if (error.response.data) {
        const message =
          typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data)
        console.log('Raw response data message:', message)
        return new Error(message)
      }
    } else if (error.request) {
      console.log('Request error - no response received')
      console.log('Request:', error.request)
      return new Error('Sunucuya ulaşılamıyor. Bağlantıyı kontrol edin.')
    } else if (error.message) {
      console.log('General error message:', error.message)
      return new Error(error.message)
    } else {
      console.log('Unknown error')
      return new Error('Bilinmeyen bir hata oluştu')
    }

    console.log('=== EXTRACT ERROR DEBUG END ===')
  }

  // Data type labels for UI - Backend enum uyumlu
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

  // Data type colors for UI - Backend enum uyumlu
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

  // Backward compatibility methods
  async getTables(): Promise<ApiTable[]> {
    const response = await this.getAllTables()
    return response.data
  }
}

// Singleton instance
export const apiService = new ApiService()

export default apiService
