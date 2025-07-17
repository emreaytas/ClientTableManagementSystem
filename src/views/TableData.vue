<template>
  <v-container fluid>
    <!-- Header Section -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ tableInfo.tableName || 'Tablo Verileri' }}</h1>
            <p class="text-subtitle-1 text-grey-600 mt-1">
              {{ tableInfo.description || 'Tablo verilerini yönetin' }}
            </p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-arrow-left"
            variant="outlined"
            @click="router.push('/tables')"
          >
            Tablolara Dön
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Action Bar -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Kayıtlarda ara..."
          variant="outlined"
          hide-details
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6" class="d-flex justify-end">
        <v-btn
          color="success"
          prepend-icon="mdi-plus"
          variant="elevated"
          @click="openAddDialog"
          :disabled="loading"
        >
          Yeni Kayıt
        </v-btn>
        <v-btn
          color="info"
          prepend-icon="mdi-refresh"
          variant="outlined"
          class="ml-2"
          @click="loadTableData"
          :loading="loading"
        >
          Yenile
        </v-btn>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-card>
      <v-card-text class="pa-0">
        <v-data-table
          :headers="dynamicHeaders"
          :items="filteredTableData"
          :loading="loading"
          :items-per-page="itemsPerPage"
          :search="search"
          item-key="rowIdentifier"
          class="elevation-0"
          no-data-text="Henüz veri eklenmemiş"
          loading-text="Veriler yükleniyor..."
        >
          <!-- Custom column rendering -->
          <template
            v-for="column in tableData.columns"
            :key="column.id"
            #[`item.col_${column.id}`]="{ item }"
          >
            <div class="text-truncate" style="max-width: 200px">
              {{ formatCellValue(item.values[column.id], column.dataType) }}
            </div>
          </template>

          <!-- Actions column -->
          <template #item.actions="{ item }">
            <v-tooltip text="Düzenle">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil"
                  size="small"
                  color="primary"
                  variant="text"
                  @click="openEditDialog(item)"
                ></v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Sil">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-delete"
                  size="small"
                  color="error"
                  variant="text"
                  @click="openDeleteDialog(item)"
                ></v-btn>
              </template>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Add/Edit Data Dialog -->
    <v-dialog v-model="dataDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">{{ editingItem ? 'Veriyi Düzenle' : 'Yeni Veri Ekle' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="dataForm" v-model="formValid">
            <v-row>
              <v-col
                v-for="column in tableData.columns"
                :key="column.id"
                cols="12"
                :md="getColumnMdSize(column.dataType)"
              >
                <!-- VARCHAR Input -->
                <v-text-field
                  v-if="column.dataType === 0"
                  v-model="formData[column.id]"
                  :label="`${column.columnName}${column.isRequired ? ' *' : ''}`"
                  variant="outlined"
                  :rules="column.isRequired ? [rules.required] : []"
                  :counter="column.maxLength"
                  :maxlength="column.maxLength"
                ></v-text-field>

                <!-- INT Input -->
                <v-text-field
                  v-else-if="column.dataType === 1"
                  v-model.number="formData[column.id]"
                  :label="`${column.columnName}${column.isRequired ? ' *' : ''}`"
                  variant="outlined"
                  type="number"
                  :rules="column.isRequired ? [rules.required] : []"
                ></v-text-field>

                <!-- DECIMAL Input -->
                <v-text-field
                  v-else-if="column.dataType === 2"
                  v-model.number="formData[column.id]"
                  :label="`${column.columnName}${column.isRequired ? ' *' : ''}`"
                  variant="outlined"
                  type="number"
                  step="0.01"
                  :rules="column.isRequired ? [rules.required] : []"
                ></v-text-field>

                <!-- DATETIME Input -->
                <v-text-field
                  v-else-if="column.dataType === 3"
                  v-model="formData[column.id]"
                  :label="`${column.columnName}${column.isRequired ? ' *' : ''}`"
                  variant="outlined"
                  type="datetime-local"
                  :rules="column.isRequired ? [rules.required] : []"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDataDialog"> İptal </v-btn>
          <v-btn color="primary" :loading="saveLoading" @click="saveData" :disabled="!formValid">
            {{ editingItem ? 'Güncelle' : 'Ekle' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6"> Veriyi Sil </v-card-title>
        <v-card-text>
          Bu veriyi silmek istediğinizden emin misiniz?
          <v-alert type="warning" variant="tonal" class="mt-3"> Bu işlem geri alınamaz. </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false"> İptal </v-btn>
          <v-btn color="error" :loading="deleteLoading" @click="deleteData"> Sil </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { apiService, type TableData, type AddTableDataRequest, type ApiTable } from '@/services/api'

// Composables
const route = useRoute()
const router = useRouter()
const toast = useToast()

// Reactive Data
const loading = ref(false)
const saveLoading = ref(false)
const deleteLoading = ref(false)
const dataDialog = ref(false)
const deleteDialog = ref(false)
const formValid = ref(false)
const search = ref('')
const itemsPerPage = ref(15)
const editingItem = ref<any>(null)
const selectedItem = ref<any>(null)
const dataForm = ref()

// Table data from API
const tableInfo = ref<ApiTable>({
  id: 0,
  tableName: '',
  description: '',
  createdAt: '',
  columns: [],
})

const tableData = ref<TableData>({
  tableId: 0,
  tableName: '',
  columns: [],
  rows: [],
})

const formData = ref<Record<number, any>>({})

// Computed
const tableId = computed(() => parseInt(route.params.id as string))

const dynamicHeaders = computed(() => {
  const headers = tableData.value.columns.map((column) => ({
    title: column.columnName,
    key: `col_${column.id}`,
    sortable: true,
    width: getColumnWidth(column.dataType),
  }))

  headers.push({
    title: 'İşlemler',
    key: 'actions',
    sortable: false,
    width: 120,
  })

  return headers
})

const filteredTableData = computed(() => {
  if (!search.value) return tableData.value.rows

  const searchLower = search.value.toLowerCase()
  return tableData.value.rows.filter((row) => {
    return Object.values(row.values).some(
      (value) => value && value.toString().toLowerCase().includes(searchLower),
    )
  })
})

// Validation Rules
const rules = {
  required: (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'Bu alan zorunludur'
    }
    return true
  },
}

// Utility Methods
const getColumnWidth = (dataType: number) => {
  switch (dataType) {
    case 0:
      return 200 // VARCHAR
    case 1:
      return 120 // INT
    case 2:
      return 150 // DECIMAL
    case 3:
      return 180 // DATETIME
    default:
      return 150
  }
}

const getColumnMdSize = (dataType: number) => {
  switch (dataType) {
    case 0:
      return 12 // VARCHAR - full width
    case 1:
      return 6 // INT - half width
    case 2:
      return 6 // DECIMAL - half width
    case 3:
      return 6 // DATETIME - half width
    default:
      return 12
  }
}

const formatCellValue = (value: any, dataType: number) => {
  if (!value) return '-'

  switch (dataType) {
    case 3: // DATETIME
      try {
        return new Date(value).toLocaleString('tr-TR')
      } catch {
        return value
      }
    case 2: // DECIMAL
      return parseFloat(value).toFixed(2)
    default:
      return value
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleDateString('tr-TR')
  } catch {
    return dateString
  }
}

// Data Loading Methods
const loadTableInfo = async () => {
  try {
    tableInfo.value = await apiService.getTable(tableId.value)
  } catch (error) {
    console.error('Table info loading error:', error)
    toast.error('Tablo bilgileri yüklenirken hata oluştu')
    router.push('/tables')
  }
}

const loadTableData = async () => {
  loading.value = true
  try {
    tableData.value = await apiService.getTableData(tableId.value)
  } catch (error) {
    console.error('Table data loading error:', error)
    toast.error('Tablo verileri yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

// Dialog Methods
const openAddDialog = () => {
  editingItem.value = null
  formData.value = {}

  // Initialize form data with default values
  tableData.value.columns.forEach((column) => {
    formData.value[column.id] = column.dataType === 3 ? '' : ''
  })

  dataDialog.value = true
}

const openEditDialog = (item: any) => {
  editingItem.value = item
  formData.value = { ...item.values }
  dataDialog.value = true
}

const openDeleteDialog = (item: any) => {
  selectedItem.value = item
  deleteDialog.value = true
}

const closeDataDialog = () => {
  dataDialog.value = false
  editingItem.value = null
  formData.value = {}
  if (dataForm.value) {
    dataForm.value.resetValidation()
  }
}

// CRUD Operations
const saveData = async () => {
  if (!dataForm.value) return

  const { valid } = await dataForm.value.validate()
  if (!valid) {
    toast.error('Lütfen form hatalarını düzeltin')
    return
  }

  saveLoading.value = true
  try {
    // Prepare column values - convert keys to numbers and handle data types
    const columnValues: Record<number, string> = {}
    Object.entries(formData.value).forEach(([key, value]) => {
      const columnId = parseInt(key)
      if (value !== null && value !== undefined && value !== '') {
        // Handle datetime format conversion
        const column = tableData.value.columns.find((c) => c.id === columnId)
        if (column?.dataType === 3 && value) {
          // Convert datetime-local to ISO string
          columnValues[columnId] = new Date(value as string).toISOString()
        } else {
          columnValues[columnId] = value.toString()
        }
      }
    })

    if (editingItem.value) {
      // Update existing data
      await apiService.updateTableData({
        tableId: tableId.value,
        rowId: editingItem.value.rowIdentifier,
        columnValues,
      })
      toast.success('Veri başarıyla güncellendi')
    } else {
      // Add new data
      const request: AddTableDataRequest = {
        tableId: tableId.value,
        columnValues,
      }
      await apiService.addTableData(request)
      toast.success('Veri başarıyla eklendi')
    }

    closeDataDialog()
    await loadTableData()
  } catch (error: any) {
    console.error('Save data error:', error)
    const errorMessage = error.response?.data?.message || 'Veri kaydedilirken hata oluştu'
    toast.error(errorMessage)
  } finally {
    saveLoading.value = false
  }
}

const deleteData = async () => {
  if (!selectedItem.value) return

  deleteLoading.value = true
  try {
    await apiService.deleteTableData(tableId.value, selectedItem.value.rowIdentifier)
    toast.success('Veri başarıyla silindi')
    deleteDialog.value = false
    selectedItem.value = null
    await loadTableData()
  } catch (error: any) {
    console.error('Delete data error:', error)
    const errorMessage = error.response?.data?.message || 'Veri silinirken hata oluştu'
    toast.error(errorMessage)
  } finally {
    deleteLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loadTableInfo()
  await loadTableData()
})
</script>

<style scoped>
.v-data-table {
  background: transparent;
}

.v-data-table >>> .v-data-table__wrapper {
  border-radius: 8px;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
