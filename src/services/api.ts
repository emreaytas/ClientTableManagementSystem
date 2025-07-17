// src/services/api.ts - Updated API Service with Type Imports

import axios from 'axios'
import type {
  ApiTable,
  ApiColumn,
  CreateTableRequest,
  UpdateTableRequest,
  UpdateColumnRequest,
  ValidateTableUpdateRequest,
  TableValidationResult,
  TableUpdateResult,
  ColumnValidationResult,
  ColumnUpdateResult,
  TableData,
  TableColumn,
  TableRowData,
  AddTableDataRequest,
  UpdateTableDataRequest,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  ColumnDataType,
  ExportRequest,
  ImportRequest,
  ImportResult,
  BulkDeleteRequest,
  BulkUpdateRequest,
  BulkOperationResult,
  DashboardStats,
  PaginationRequest,
  PaginationResponse,
  ApiError,
  ApiValidationError,
  ApiAuthenticationError,
  ApiNotFoundError,
  ApiServerError,
} from '@/types/api'

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7138/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  },
)

// ========== API SERVICE CLASS ==========

class ApiService {
  // ========== AUTHENTICATION API ==========

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/Auth/login', credentials)

      // Save token to localStorage
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token)
      }

      return response.data
    } catch (error) {
      console.error('Error during login:', error)
      throw this.handleApiError(error, 'login')
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>('/Auth/register', userData)
      return response.data
    } catch (error) {
      console.error('Error during registration:', error)
      throw this.handleApiError(error, 'registration')
    }
  }

  async confirmEmail(token: string, email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post('/Auth/confirm-email', { token, email })
      return response.data
    } catch (error) {
      console.error('Error confirming email:', error)
      throw this.handleApiError(error, 'email confirmation')
    }
  }

  async refreshToken(): Promise<{ token: string }> {
    try {
      const response = await apiClient.post('/Auth/refresh-token')

      // Update token in localStorage
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token)
      }

      return response.data
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw this.handleApiError(error, 'token refresh')
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/Auth/logout')
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      // Always remove token
      localStorage.removeItem('authToken')
    }
  }

  // ========== TABLES API ==========

  async getTables(): Promise<ApiTable[]> {
    try {
      const response = await apiClient.get<ApiTable[]>('/Tables')
      return response.data
    } catch (error) {
      console.error('Error fetching tables:', error)
      throw this.handleApiError(error, 'fetching tables')
    }
  }

  async getTable(id: number): Promise<ApiTable> {
    try {
      const response = await apiClient.get<ApiTable>(`/Tables/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching table:', error)
      throw this.handleApiError(error, 'fetching table')
    }
  }

  async createTable(data: CreateTableRequest): Promise<ApiTable> {
    try {
      console.log('Creating table with data:', data)
      const response = await apiClient.post<{ message: string; table: ApiTable }>('/Tables', data)
      return response.data.table
    } catch (error) {
      console.error('Error creating table:', error)
      throw this.handleApiError(error, 'creating table')
    }
  }

  async validateTableUpdate(
    id: number,
    data: ValidateTableUpdateRequest,
  ): Promise<TableValidationResult> {
    try {
      console.log('Validating table update:', data)
      const response = await apiClient.post<TableValidationResult>(
        `/Tables/${id}/validate-update`,
        data,
      )
      return response.data
    } catch (error) {
      console.error('Error validating table update:', error)
      throw this.handleApiError(error, 'validating table update')
    }
  }

  async updateTable(id: number, data: UpdateTableRequest): Promise<TableUpdateResult> {
    try {
      console.log('Updating table with data:', data)
      const response = await apiClient.put<TableUpdateResult>(`/Tables/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating table:', error)

      // Handle validation errors that require force update
      if (error.response?.status === 400 && error.response?.data?.requiresForceUpdate) {
        throw {
          ...error,
          requiresForceUpdate: true,
          validationResult: error.response.data.validationResult,
        }
      }

      throw this.handleApiError(error, 'updating table')
    }
  }

  async forceUpdateTable(id: number, data: UpdateTableRequest): Promise<TableUpdateResult> {
    try {
      // Mark all columns for force update
      const forceData: UpdateTableRequest = {
        ...data,
        columns: data.columns.map((col) => ({
          ...col,
          forceUpdate: true,
        })),
      }

      console.log('Force updating table with data:', forceData)
      const response = await apiClient.put<TableUpdateResult>(`/Tables/${id}`, forceData)
      return response.data
    } catch (error) {
      console.error('Error force updating table:', error)
      throw this.handleApiError(error, 'force updating table')
    }
  }

  async deleteTable(id: number): Promise<void> {
    try {
      await apiClient.delete(`/Tables/${id}`)
    } catch (error) {
      console.error('Error deleting table:', error)
      throw this.handleApiError(error, 'deleting table')
    }
  }

  // ========== COLUMN MANAGEMENT API ==========

  async validateColumnUpdate(
    tableId: number,
    columnData: UpdateColumnRequest,
  ): Promise<ColumnValidationResult> {
    try {
      const response = await apiClient.post<ColumnValidationResult>(
        `/ColumnManagement/validate/${tableId}`,
        columnData,
      )
      return response.data
    } catch (error) {
      console.error('Error validating column update:', error)
      throw this.handleApiError(error, 'validating column update')
    }
  }

  async updateColumn(
    tableId: number,
    columnData: UpdateColumnRequest,
  ): Promise<ColumnUpdateResult> {
    try {
      const response = await apiClient.put<ColumnUpdateResult>(
        `/ColumnManagement/${tableId}/columns`,
        columnData,
      )
      return response.data
    } catch (error) {
      console.error('Error updating column:', error)
      throw this.handleApiError(error, 'updating column')
    }
  }

  async deleteColumn(tableId: number, columnId: number): Promise<void> {
    try {
      await apiClient.delete(`/Tables/${tableId}/columns/${columnId}`)
    } catch (error) {
      console.error('Error deleting column:', error)
      throw this.handleApiError(error, 'deleting column')
    }
  }

  async addColumn(
    tableId: number,
    columnData: Omit<UpdateColumnRequest, 'columnId'>,
  ): Promise<ColumnUpdateResult> {
    try {
      const response = await apiClient.post<ColumnUpdateResult>(
        `/Tables/${tableId}/columns`,
        columnData,
      )
      return response.data
    } catch (error) {
      console.error('Error adding column:', error)
      throw this.handleApiError(error, 'adding column')
    }
  }

  // ========== TABLE DATA API ==========

  async getTableData(tableId: number): Promise<TableData> {
    try {
      const response = await apiClient.get<TableData>(`/Tables/${tableId}/data`)
      return response.data
    } catch (error) {
      console.error('Error fetching table data:', error)
      throw this.handleApiError(error, 'fetching table data')
    }
  }

  async addTableData(data: AddTableDataRequest): Promise<void> {
    try {
      await apiClient.post('/TableData', data)
    } catch (error) {
      console.error('Error adding table data:', error)
      throw this.handleApiError(error, 'adding table data')
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
      throw this.handleApiError(error, 'updating table data')
    }
  }

  async deleteTableData(tableId: number, rowId: number): Promise<void> {
    try {
      await apiClient.delete(`/TableData/${rowId}?tableId=${tableId}`)
    } catch (error) {
      console.error('Error deleting table data:', error)
      throw this.handleApiError(error, 'deleting table data')
    }
  }

  // ========== BULK OPERATIONS ==========

  async bulkAddTableData(
    tableId: number,
    rows: Array<Record<number, string>>,
  ): Promise<BulkOperationResult> {
    try {
      const requests = rows.map((row) => ({ tableId, columnValues: row }))
      const response = await apiClient.post<BulkOperationResult>(`/TableData/bulk`, { requests })
      return response.data
    } catch (error) {
      console.error('Error bulk adding table data:', error)
      throw this.handleApiError(error, 'bulk adding table data')
    }
  }

  async bulkDeleteTableData(data: BulkDeleteRequest): Promise<BulkOperationResult> {
    try {
      const response = await apiClient.post<BulkOperationResult>(`/TableData/bulk-delete`, data)
      return response.data
    } catch (error) {
      console.error('Error bulk deleting table data:', error)
      throw this.handleApiError(error, 'bulk deleting table data')
    }
  }

  async bulkUpdateTableData(data: BulkUpdateRequest): Promise<BulkOperationResult> {
    try {
      const response = await apiClient.post<BulkOperationResult>(`/TableData/bulk-update`, data)
      return response.data
    } catch (error) {
      console.error('Error bulk updating table data:', error)
      throw this.handleApiError(error, 'bulk updating table data')
    }
  }

  // ========== IMPORT/EXPORT ==========

  async exportTableData(tableId: number, format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await apiClient.get(`/Tables/${tableId}/export?format=${format}`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      console.error('Error exporting table data:', error)
      throw this.handleApiError(error, 'exporting table data')
    }
  }

  async importTableData(
    tableId: number,
    file: File,
    hasHeaders: boolean = true,
  ): Promise<ImportResult> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('hasHeaders', hasHeaders.toString())

      const response = await apiClient.post<ImportResult>(`/Tables/${tableId}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      console.error('Error importing table data:', error)
      throw this.handleApiError(error, 'importing table data')
    }
  }

  // ========== DASHBOARD ==========

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/Dashboard/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw this.handleApiError(error, 'fetching dashboard stats')
    }
  }

  // ========== UTILITY METHODS ==========

  // Data type helpers
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

  // Sample data generators for preview
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

  // Check if data type conversion is safe
  isDataTypeConversionSafe(fromType: number, toType: number): boolean {
    // Safe conversions (no data loss)
    const safeConversions = [
      [1, 2], // INT to DECIMAL
      [1, 0], // INT to VARCHAR
      [2, 0], // DECIMAL to VARCHAR
      [3, 0], // DATETIME to VARCHAR
    ]

    return (
      safeConversions.some(([from, to]) => from === fromType && to === toType) ||
      fromType === toType
    )
  }

  // Check if data type conversion is possible but risky
  isDataTypeConversionRisky(fromType: number, toType: number): boolean {
    // Risky conversions (potential data loss)
    const riskyConversions = [
      [0, 1], // VARCHAR to INT
      [0, 2], // VARCHAR to DECIMAL
      [0, 3], // VARCHAR to DATETIME
      [2, 1], // DECIMAL to INT
    ]

    return riskyConversions.some(([from, to]) => from === fromType && to === toType)
  }

  // Format default value for database
  formatDefaultValueForDatabase(value: string, dataType: number): string {
    if (!value) return ''

    switch (dataType) {
      case 3: // ColumnDataType.DATETIME
        if (value.toUpperCase() === 'GETDATE()') {
          return 'GETDATE()'
        }
        return value
      case 0: // ColumnDataType.VARCHAR
        return value
      case 1: // ColumnDataType.INT
        return parseInt(value).toString()
      case 2: // ColumnDataType.DECIMAL
        return parseFloat(value).toString()
      default:
        return value
    }
  }

  // ========== ERROR HANDLING ==========

  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message
    }

    if (error.response?.data?.errors) {
      if (Array.isArray(error.response.data.errors)) {
        return error.response.data.errors
          .map((e: any) => (typeof e === 'string' ? e : Object.values(e).join(', ')))
          .join(', ')
      }
      return Object.values(error.response.data.errors).flat().join(', ')
    }

    if (error.response?.data?.issues) {
      return error.response.data.issues.join(', ')
    }

    if (error.message) {
      return error.message
    }

    return 'Bilinmeyen hata oluştu'
  }

  private handleApiError(error: any, operation: string): never {
    const message = this.extractErrorMessage(error)
    console.error(`Error during ${operation}:`, error)

    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      throw new ApiAuthenticationError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.')
    }

    if (error.response?.status === 403) {
      throw new ApiAuthenticationError('Bu işlem için yetkiniz bulunmuyor.')
    }

    if (error.response?.status === 404) {
      throw new ApiNotFoundError('İstenen kaynak bulunamadı.')
    }

    if (error.response?.status === 400 && error.response?.data?.errors) {
      throw new ApiValidationError(message, error.response.data.errors)
    }

    if (error.response?.status >= 500) {
      throw new ApiServerError('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.')
    }

    // Generic error
    throw new Error(message)
  }

  // ========== PAGINATION HELPERS ==========

  async getTablesPaginated(params: PaginationRequest): Promise<PaginationResponse<ApiTable>> {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortOrder && { sortOrder: params.sortOrder }),
        ...(params.search && { search: params.search }),
      })

      const response = await apiClient.get<PaginationResponse<ApiTable>>(
        `/Tables/paginated?${queryParams}`,
      )
      return response.data
    } catch (error) {
      console.error('Error fetching paginated tables:', error)
      throw this.handleApiError(error, 'fetching paginated tables')
    }
  }

  async getTableDataPaginated(
    tableId: number,
    params: PaginationRequest,
  ): Promise<PaginationResponse<TableRowData>> {
    try {
      const queryParams = new URLSearchParams({
        page: params.page.toString(),
        pageSize: params.pageSize.toString(),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortOrder && { sortOrder: params.sortOrder }),
        ...(params.search && { search: params.search }),
      })

      const response = await apiClient.get<PaginationResponse<TableRowData>>(
        `/Tables/${tableId}/data/paginated?${queryParams}`,
      )
      return response.data
    } catch (error) {
      console.error('Error fetching paginated table data:', error)
      throw this.handleApiError(error, 'fetching paginated table data')
    }
  }

  // ========== HEALTH CHECK ==========

  async healthCheck(): Promise<{ status: string; timestamp: string; version?: string }> {
    try {
      const response = await apiClient.get('/health')
      return response.data
    } catch (error) {
      console.error('Health check failed:', error)
      throw this.handleApiError(error, 'health check')
    }
  }

  // ========== FILE UTILITIES ==========

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  async downloadTableExport(
    tableId: number,
    tableName: string,
    format: 'csv' | 'xlsx' | 'json' = 'csv',
  ): Promise<void> {
    try {
      const blob = await this.exportTableData(tableId, format)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const filename = `${tableName}_${timestamp}.${format}`
      this.downloadFile(blob, filename)
    } catch (error) {
      console.error('Error downloading table export:', error)
      throw this.handleApiError(error, 'downloading table export')
    }
  }

  // ========== LOCAL STORAGE HELPERS ==========

  getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }

  clearAuthData(): void {
    localStorage.removeItem('authToken')
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

  validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: 'E-posta adresi boş olamaz' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Geçerli bir e-posta adresi giriniz' }
    }

    return { isValid: true }
  }

  validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length === 0) {
      return { isValid: false, error: 'Şifre boş olamaz' }
    }

    if (password.length < 6) {
      return { isValid: false, error: 'Şifre en az 6 karakter olmalıdır' }
    }

    if (password.length > 100) {
      return { isValid: false, error: 'Şifre en fazla 100 karakter olabilir' }
    }

    return { isValid: true }
  }

  // ========== FORMATTING HELPERS ==========

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
}

// ========== EXPORT ==========

// Export singleton instance
export const apiService = new ApiService()

// Export the service class for advanced usage
export { ApiService }

// Default export
export default apiService

// Re-export types for convenience
export type {
  ApiTable,
  ApiColumn,
  CreateTableRequest,
  UpdateTableRequest,
  UpdateColumnRequest,
  ValidateTableUpdateRequest,
  TableValidationResult,
  TableUpdateResult,
  ColumnValidationResult,
  ColumnUpdateResult,
  TableData,
  TableColumn,
  TableRowData,
  AddTableDataRequest,
  UpdateTableDataRequest,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
}
