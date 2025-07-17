// src/composables/useTableData.ts
// Updated composable with real API integration

import { ref, computed } from 'vue'
import {
  apiService,
  type ApiTable,
  type TableData,
  type AddTableDataRequest,
  type UpdateTableDataRequest,
} from '@/services/api'
import { useToast } from 'vue-toastification'

export const useTableData = () => {
  const toast = useToast()

  // State
  const loading = ref(false)
  const tables = ref<ApiTable[]>([])
  const currentTable = ref<ApiTable | null>(null)
  const tableData = ref<TableData | null>(null)

  // Computed
  const activeTables = computed(() => tables.value.filter((table) => table.columns.length > 0))

  // Actions
  const loadTables = async () => {
    loading.value = true
    try {
      tables.value = await apiService.getTables()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Tablolar yüklenirken hata oluştu'
      toast.error(errorMessage)
      console.error('Load tables error:', error)
    } finally {
      loading.value = false
    }
  }

  const loadTable = async (id: number) => {
    loading.value = true
    try {
      currentTable.value = await apiService.getTable(id)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Tablo bilgileri yüklenirken hata oluştu'
      toast.error(errorMessage)
      console.error('Load table error:', error)
    } finally {
      loading.value = false
    }
  }

  const loadTableData = async (tableId: number) => {
    loading.value = true
    try {
      tableData.value = await apiService.getTableData(tableId)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Tablo verileri yüklenirken hata oluştu'
      toast.error(errorMessage)
      console.error('Load table data error:', error)
    } finally {
      loading.value = false
    }
  }

  const addTableData = async (data: AddTableDataRequest) => {
    try {
      await apiService.addTableData(data)
      toast.success('Veri başarıyla eklendi')
      // Refresh table data
      await loadTableData(data.tableId)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Veri eklenirken hata oluştu'
      toast.error(errorMessage)
      console.error('Add table data error:', error)
      throw error
    }
  }

  const updateTableData = async (data: UpdateTableDataRequest) => {
    try {
      await apiService.updateTableData(data)
      toast.success('Veri başarıyla güncellendi')
      // Refresh table data
      await loadTableData(data.tableId)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Veri güncellenirken hata oluştu'
      toast.error(errorMessage)
      console.error('Update table data error:', error)
      throw error
    }
  }

  const deleteTableData = async (tableId: number, rowId: number) => {
    try {
      await apiService.deleteTableData(tableId, rowId)
      toast.success('Veri başarıyla silindi')
      // Refresh table data
      await loadTableData(tableId)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Veri silinirken hata oluştu'
      toast.error(errorMessage)
      console.error('Delete table data error:', error)
      throw error
    }
  }

  const deleteTable = async (id: number) => {
    try {
      await apiService.deleteTable(id)
      toast.success('Tablo başarıyla silindi')
      // Remove from local state
      tables.value = tables.value.filter((table) => table.id !== id)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Tablo silinirken hata oluştu'
      toast.error(errorMessage)
      console.error('Delete table error:', error)
      throw error
    }
  }

  // Utility methods
  const getDataTypeName = (dataType: number): string => {
    switch (dataType) {
      case 0:
        return 'VARCHAR'
      case 1:
        return 'INT'
      case 2:
        return 'DECIMAL'
      case 3:
        return 'DATETIME'
      default:
        return 'UNKNOWN'
    }
  }

  const getDataTypeColor = (dataType: number): string => {
    switch (dataType) {
      case 0:
        return 'blue'
      case 1:
        return 'green'
      case 2:
        return 'orange'
      case 3:
        return 'purple'
      default:
        return 'grey'
    }
  }

  const formatCellValue = (value: any, dataType: number): string => {
    if (!value) return '-'

    switch (dataType) {
      case 3: // DATETIME
        try {
          return new Date(value).toLocaleString('tr-TR')
        } catch {
          return value
        }
      case 2: // DECIMAL
        try {
          return parseFloat(value).toFixed(2)
        } catch {
          return value
        }
      case 1: // INT
        return value.toString()
      default: // VARCHAR
        return value.toString()
    }
  }

  const validateColumnValue = (value: any, column: any): string | null => {
    // Required field validation
    if (column.isRequired && (!value || value === '')) {
      return `${column.columnName} alanı zorunludur`
    }

    // Data type validation
    switch (column.dataType) {
      case 1: // INT
        if (value && isNaN(parseInt(value))) {
          return `${column.columnName} sayısal bir değer olmalıdır`
        }
        break
      case 2: // DECIMAL
        if (value && isNaN(parseFloat(value))) {
          return `${column.columnName} ondalıklı bir sayı olmalıdır`
        }
        break
      case 3: // DATETIME
        if (value && isNaN(Date.parse(value))) {
          return `${column.columnName} geçerli bir tarih olmalıdır`
        }
        break
    }

    return null
  }

  return {
    // State
    loading,
    tables,
    activeTables,
    currentTable,
    tableData,

    // Actions
    loadTables,
    loadTable,
    loadTableData,
    addTableData,
    updateTableData,
    deleteTableData,
    deleteTable,

    // Utilities
    getDataTypeName,
    getDataTypeColor,
    formatCellValue,
    validateColumnValue,
  }
}
