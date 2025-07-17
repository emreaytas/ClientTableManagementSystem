// src/types/api.ts - API Types and Interfaces

// ========== DATA TYPE ENUMS ==========
export enum ColumnDataType {
  VARCHAR = 0,
  INT = 1,
  DECIMAL = 2,
  DATETIME = 3,
}

// ========== API RESPONSE INTERFACES ==========

export interface ApiTable {
  id: number
  tableName: string
  description: string
  createdAt: string
  updatedAt?: string
  columns: ApiColumn[]
}

export interface ApiColumn {
  id: number
  columnName: string
  dataType: number // 0=VARCHAR, 1=INT, 2=DECIMAL, 3=DATETIME
  isRequired: boolean
  displayOrder: number
  defaultValue: string
}

// ========== REQUEST INTERFACES ==========

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

export interface UpdateTableRequest {
  tableId: number
  tableName: string
  description: string
  columns: UpdateColumnRequest[]
}

export interface UpdateColumnRequest {
  columnId?: number // Null for new columns
  columnName: string
  dataType: number
  isRequired: boolean
  displayOrder: number
  defaultValue?: string
  forceUpdate?: boolean
}

export interface ValidateTableUpdateRequest {
  tableId: number
  tableName: string
  description: string
  columns: UpdateColumnRequest[]
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

// ========== RESULT INTERFACES ==========

export interface TableValidationResult {
  success: boolean
  isValid: boolean
  hasStructuralChanges: boolean
  hasDataCompatibilityIssues: boolean
  requiresForceUpdate: boolean
  issues: string[]
  dataIssues: string[]
  columnIssues: Record<string, string[]>
  affectedRowCount: number
  estimatedBackupSize: number
}

export interface TableUpdateResult {
  message: string
  table: ApiTable
  executedQueries: string[]
  affectedRows: number
  backupCreated: boolean
}

export interface ColumnValidationResult {
  isValid: boolean
  hasDataCompatibilityIssues: boolean
  requiresForceUpdate: boolean
  issues: string[]
  dataIssues: string[]
  affectedRowCount: number
}

export interface ColumnUpdateResult {
  success: boolean
  message: string
  executedQueries: string[]
  affectedRows: number
  validationResult?: ColumnValidationResult
}

// ========== TABLE DATA INTERFACES ==========

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

// ========== AUTHENTICATION INTERFACES ==========

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    firstName: string
    lastName: string
    username: string
    email: string
    isEmailConfirmed: boolean
  }
  message: string
}

export interface RegisterResponse {
  message: string
  requiresEmailConfirmation: boolean
}

// ========== UTILITY INTERFACES ==========

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
  issues?: string[]
}

export interface PaginationRequest {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginationResponse<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ========== EXPORT AND IMPORT INTERFACES ==========

export interface ExportRequest {
  tableId: number
  format: 'csv' | 'xlsx' | 'json'
  includeHeaders?: boolean
}

export interface ImportRequest {
  tableId: number
  file: File
  hasHeaders?: boolean
  delimiter?: string
}

export interface ImportResult {
  success: boolean
  message: string
  importedRows: number
  skippedRows: number
  errors: string[]
}

// ========== BULK OPERATION INTERFACES ==========

export interface BulkDeleteRequest {
  tableId: number
  rowIds: number[]
}

export interface BulkUpdateRequest {
  tableId: number
  updates: Array<{
    rowId: number
    columnValues: Record<number, string>
  }>
}

export interface BulkOperationResult {
  success: boolean
  message: string
  processedCount: number
  failedCount: number
  errors: string[]
}

// ========== DASHBOARD INTERFACES ==========

export interface DashboardStats {
  totalTables: number
  totalRows: number
  recentActivity: ActivityItem[]
  storageUsed: number
  storageLimit: number
}

export interface ActivityItem {
  id: number
  type: 'create' | 'update' | 'delete' | 'import' | 'export'
  description: string
  timestamp: string
  tableName?: string
}

// ========== VALIDATION INTERFACES ==========

export interface ValidationRule {
  field: string
  message: string
  type: 'required' | 'pattern' | 'custom'
  value?: any
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
}

// ========== TYPE GUARDS ==========

export function isApiTable(obj: any): obj is ApiTable {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.tableName === 'string' &&
    Array.isArray(obj.columns)
  )
}

export function isApiColumn(obj: any): obj is ApiColumn {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.columnName === 'string' &&
    typeof obj.dataType === 'number'
  )
}

export function isTableValidationResult(obj: any): obj is TableValidationResult {
  return (
    obj &&
    typeof obj.success === 'boolean' &&
    typeof obj.isValid === 'boolean' &&
    Array.isArray(obj.issues)
  )
}

// ========== UTILITY TYPES ==========

export type DataTypeOption = {
  title: string
  value: ColumnDataType
  color: string
  description?: string
}

export type SortOption = {
  title: string
  value: string
}

export type FilterOption = {
  title: string
  value: string | number
  count?: number
}

// ========== CONSTANTS ==========

export const DATA_TYPE_OPTIONS: DataTypeOption[] = [
  {
    title: 'Metin (VARCHAR)',
    value: ColumnDataType.VARCHAR,
    color: 'blue',
    description: 'Metin veriler için (maksimum 255 karakter)',
  },
  {
    title: 'Sayı (INT)',
    value: ColumnDataType.INT,
    color: 'green',
    description: 'Tam sayılar için (-2,147,483,648 ile 2,147,483,647 arası)',
  },
  {
    title: 'Ondalık (DECIMAL)',
    value: ColumnDataType.DECIMAL,
    color: 'orange',
    description: 'Ondalıklı sayılar için (18 basamak, 2 ondalık basamak)',
  },
  {
    title: 'Tarih/Saat (DATETIME)',
    value: ColumnDataType.DATETIME,
    color: 'purple',
    description: 'Tarih ve saat bilgileri için',
  },
]

export const SORT_OPTIONS: SortOption[] = [
  { title: 'Oluşturma Tarihi', value: 'createdAt' },
  { title: 'Tablo Adı', value: 'tableName' },
  { title: 'Kolon Sayısı', value: 'columnCount' },
  { title: 'Son Güncelleme', value: 'updatedAt' },
]

export const SORT_ORDER_OPTIONS: SortOption[] = [
  { title: 'Azalan', value: 'desc' },
  { title: 'Artan', value: 'asc' },
]

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100
export const MAX_TABLE_NAME_LENGTH = 50
export const MAX_COLUMN_NAME_LENGTH = 50
export const MAX_DESCRIPTION_LENGTH = 500
export const MAX_DEFAULT_VALUE_LENGTH = 255

// ========== HELPER FUNCTIONS ==========

export function getDataTypeLabel(dataType: number): string {
  const option = DATA_TYPE_OPTIONS.find((opt) => opt.value === dataType)
  return option ? option.title : 'UNKNOWN'
}

export function getDataTypeColor(dataType: number): string {
  const option = DATA_TYPE_OPTIONS.find((opt) => opt.value === dataType)
  return option ? option.color : 'grey'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatRowCount(count: number): string {
  if (count < 1000) return count.toString()
  if (count < 1000000) return (count / 1000).toFixed(1) + 'K'
  return (count / 1000000).toFixed(1) + 'M'
}

export function isValidTableName(name: string): boolean {
  return (
    /^[a-zA-ZçÇğĞıİöÖşŞüÜ][a-zA-ZçÇğĞıİöÖşŞüÜ0-9\s_-]*$/.test(name) &&
    name.length >= 2 &&
    name.length <= MAX_TABLE_NAME_LENGTH
  )
}

export function isValidColumnName(name: string): boolean {
  return (
    /^[a-zA-ZçÇğĞıİöÖşŞüÜ][a-zA-ZçÇğĞıİöÖşŞüÜ0-9\s_-]*$/.test(name) &&
    name.length >= 1 &&
    name.length <= MAX_COLUMN_NAME_LENGTH
  )
}

// ========== ERROR TYPES ==========

export class ApiValidationError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiValidationError'
  }
}

export class ApiAuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'ApiAuthenticationError'
  }
}

export class ApiNotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'ApiNotFoundError'
  }
}

export class ApiServerError extends Error {
  constructor(message: string = 'Server error occurred') {
    super(message)
    this.name = 'ApiServerError'
  }
}
