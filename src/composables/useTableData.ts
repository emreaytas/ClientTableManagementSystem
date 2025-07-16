import { ref, computed } from 'vue'
import {
  apiService,
  handleApiError,
  type Table,
  type TableData,
  type AddTableDataRequest,
  type UpdateTableDataRequest,
} from '@/services/api'
import { useToast } from 'vue-toastification'

export const useTableData = () => {
  const toast = useToast()

  // State
  const loading = ref(false)
  const tables = ref<Table[]>([])
  const currentTable = ref<Table | null>(null)
  const tableData = ref<TableData | null>(null)

  // Computed
  const activeTables = computed(() => tables.value.filter((table) => table.isActive))
  const inactiveTables = computed(() => tables.value.filter((table) => !table.isActive))

  // Actions
  const loadTables = async () => {
    loading.value = true
    try {
      tables.value = await apiService.getTables()
    } catch (error) {
      handleApiError(error, 'Tablolar yüklenirken hata oluştu')
    } finally {
      loading.value = false
    }
  }

  const loadTable = async (id: number) => {
    loading.value = true
    try {
      currentTable.value = await apiService.getTable(id)
    } catch (error) {
      handleApiError(error, 'Tablo bilgileri yüklenirken hata oluştu')
    } finally {
      loading.value = false
    }
  }

  const loadTableData = async (tableId: number) => {
    loading.value = true
    try {
      tableData.value = await apiService.getTableData(tableId)
    } catch (error) {
      handleApiError(error, 'Tablo verileri yüklenirken hata oluştu')
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
    } catch (error) {
      handleApiError(error, 'Veri eklenirken hata oluştu')
      throw error
    }
  }

  const updateTableData = async (data: UpdateTableDataRequest) => {
    try {
      await apiService.updateTableData(data)
      toast.success('Veri başarıyla güncellendi')
      // Refresh table data
      await loadTableData(data.tableId)
    } catch (error) {
      handleApiError(error, 'Veri güncellenirken hata oluştu')
      throw error
    }
  }

  const deleteTableData = async (tableId: number, rowId: number) => {
    try {
      await apiService.deleteTableData(tableId, rowId)
      toast.success('Veri başarıyla silindi')
      // Refresh table data
      await loadTableData(tableId)
    } catch (error) {
      handleApiError(error, 'Veri silinirken hata oluştu')
      throw error
    }
  }

  const deleteTable = async (id: number) => {
    try {
      await apiService.deleteTable(id)
      toast.success('Tablo başarıyla silindi')
      // Remove from local tables array
      const index = tables.value.findIndex((t) => t.id === id)
      if (index > -1) {
        tables.value.splice(index, 1)
      }
    } catch (error) {
      handleApiError(error, 'Tablo silinirken hata oluştu')
      throw error
    }
  }

  // Helper functions
  const getTableById = (id: number) => {
    return tables.value.find((table) => table.id === id)
  }

  const getTableStats = () => {
    const totalTables = tables.value.length
    const totalRecords = tables.value.reduce((sum, table) => sum + (table.recordCount || 0), 0)
    const activeTables = tables.value.filter((table) => table.isActive).length
    const tablesThisMonth = tables.value.filter((table) => {
      const createdDate = new Date(table.createdAt)
      const now = new Date()
      return (
        createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
      )
    }).length

    return {
      totalTables,
      totalRecords,
      activeTables,
      tablesThisMonth,
    }
  }

  return {
    // State
    loading,
    tables,
    currentTable,
    tableData,

    // Computed
    activeTables,
    inactiveTables,

    // Actions
    loadTables,
    loadTable,
    loadTableData,
    addTableData,
    updateTableData,
    deleteTableData,
    deleteTable,

    // Helpers
    getTableById,
    getTableStats,
  }
}
