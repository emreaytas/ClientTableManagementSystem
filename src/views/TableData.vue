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
            @click="router.push('/dashboard')"
          >
            Dashboard'a Dön
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
            <v-btn
              icon="mdi-pencil"
              size="x-small"
              color="primary"
              variant="text"
              @click="openEditDialog(item)"
            >
              <v-icon>mdi-pencil</v-icon>
              <v-tooltip activator="parent" location="top"> Düzenle </v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-delete"
              size="x-small"
              color="error"
              variant="text"
              @click="confirmDelete(item)"
            >
              <v-icon>mdi-delete</v-icon>
              <v-tooltip activator="parent" location="top"> Sil </v-tooltip>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white">
          {{ editingItem ? 'Kayıt Düzenle' : 'Yeni Kayıt Ekle' }}
        </v-card-title>

        <v-form ref="formRef" v-model="formValid" @submit.prevent="saveData">
          <v-card-text class="pt-6">
            <v-row>
              <v-col
                v-for="column in tableData.columns"
                :key="column.id"
                :cols="getColumnMdSize(column.dataType)"
              >
                <!-- VARCHAR Input - Backend enum: 1 -->
                <v-text-field
                  v-if="column.dataType === 1"
                  v-model="formData[column.id]"
                  :label="column.columnName"
                  :required="column.isRequired"
                  :rules="column.isRequired ? [rules.required] : []"
                  variant="outlined"
                  hide-details="auto"
                  placeholder="Metin giriniz..."
                ></v-text-field>

                <!-- INT Input - Backend enum: 2 -->
                <v-text-field
                  v-else-if="column.dataType === 2"
                  v-model="formData[column.id]"
                  :label="column.columnName"
                  :required="column.isRequired"
                  :rules="column.isRequired ? [rules.required, rules.integer] : [rules.integer]"
                  type="number"
                  variant="outlined"
                  hide-details="auto"
                  placeholder="Tam sayı giriniz..."
                ></v-text-field>
                <!-- DECIMAL Input - Backend enum: 3 -->
                <v-text-field
                  v-else-if="column.dataType === 3"
                  v-model="formData[column.id]"
                  :label="column.columnName"
                  :required="column.isRequired"
                  :rules="column.isRequired ? [rules.required, rules.decimal] : [rules.decimal]"
                  type="number"
                  step="0.01"
                  variant="outlined"
                  hide-details="auto"
                  placeholder="Ondalık sayı giriniz..."
                ></v-text-field>

                <!-- DATETIME Input - Backend enum: 4 -->
                <v-text-field
                  v-else-if="column.dataType === 4"
                  v-model="formData[column.id]"
                  :label="column.columnName"
                  :required="column.isRequired"
                  :rules="column.isRequired ? [rules.required, rules.datetime] : [rules.datetime]"
                  type="datetime-local"
                  variant="outlined"
                  hide-details="auto"
                ></v-text-field>

                <!-- Default/Unknown type -->
                <v-text-field
                  v-else
                  v-model="formData[column.id]"
                  :label="column.columnName"
                  :required="column.isRequired"
                  :rules="column.isRequired ? [rules.required] : []"
                  variant="outlined"
                  hide-details="auto"
                  placeholder="Değer giriniz..."
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Form bilgilendirme metni -->
            <v-alert
              v-if="tableData.columns.length > 0"
              type="info"
              variant="tonal"
              class="mt-4"
              density="compact"
            >
              <v-icon start>mdi-information</v-icon>
              <span class="text-caption">
                Zorunlu alanlar (*) ile işaretlenmiştir. Veri tipine uygun değerler giriniz.
              </span>
            </v-alert>
          </v-card-text>

          <v-card-actions class="px-6 pb-6">
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="outlined" @click="closeDialog" :disabled="saving">
              İptal
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              type="submit"
              :loading="saving"
              :disabled="!formValid"
            >
              {{ editingItem ? 'Güncelle' : 'Kaydet' }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5 text-error"> Kayıt Sil </v-card-title>
        <v-card-text>
          Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="outlined"
            @click="deleteDialog = false"
            :disabled="deleting"
          >
            İptal
          </v-btn>
          <v-btn color="error" variant="elevated" @click="deleteData" :loading="deleting">
            Sil
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { apiService } from '@/services/api'
import type {
  ApiTable,
  TableData,
  TableRowData,
  AddTableDataRequest,
  UpdateTableDataRequest,
} from '@/services/api'

// Route and Router
const route = useRoute()
const router = useRouter()
const toast = useToast()

// Table ID from route
const tableId = computed(() => parseInt(route.params.id as string))

// Reactive Data
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const showDialog = ref(false)
const deleteDialog = ref(false)
const formValid = ref(false)
const itemsPerPage = ref(25)

// Table Info and Data
const tableInfo = ref<ApiTable>({} as ApiTable)
const tableData = ref<TableData>({
  tableId: 0,
  tableName: '',
  columns: [],
  data: [],
})

// Form Data - Column ID bazlı (UI için)
const formData = ref<Record<number, any>>({})
const editingItem = ref<TableRowData | null>(null)
const deleteItem = ref<TableRowData | null>(null)
const formRef = ref<any>(null)

// Computed Properties
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
  if (!search.value) return tableData.value.data

  const searchLower = search.value.toLowerCase()
  return tableData.value.data.filter((row) => {
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
  integer: (value: any) => {
    if (value === null || value === undefined || value === '') return true
    const num = parseInt(value)
    if (isNaN(num)) {
      return 'Geçerli bir sayı giriniz'
    }
    return true
  },
  decimal: (value: any) => {
    if (value === null || value === undefined || value === '') return true
    const num = parseFloat(value)
    if (isNaN(num)) {
      return 'Geçerli bir ondalık sayı giriniz'
    }
    return true
  },
  datetime: (value: any) => {
    if (value === null || value === undefined || value === '') return true
    try {
      new Date(value)
      return true
    } catch {
      return 'Geçerli bir tarih giriniz'
    }
  },
}

// Utility Methods
const getColumnWidth = (dataType: number) => {
  switch (dataType) {
    case 1:
      return 200 // VARCHAR
    case 2:
      return 120 // INT
    case 3:
      return 150 // DECIMAL
    case 4:
      return 180 // DATETIME
    default:
      return 150
  }
}

const getColumnMdSize = (dataType: number) => {
  switch (dataType) {
    case 1:
      return 12 // VARCHAR - full width
    case 2:
      return 6 // INT - half width
    case 3:
      return 6 // DECIMAL - half width
    case 4:
      return 6 // DATETIME - half width
    default:
      return 12
  }
}

const formatCellValue = (value: any, dataType: number) => {
  if (!value) return '-'

  switch (dataType) {
    case 4: // DATETIME
      try {
        return new Date(value).toLocaleString('tr-TR')
      } catch {
        return value
      }
    case 3: // DECIMAL
      return parseFloat(value).toFixed(2)
    default:
      return value
  }
}

// Data Loading Methods
const loadTableInfo = async () => {
  try {
    tableInfo.value = await apiService.getTable(tableId.value)
    console.log('🔵 Loaded table info:', tableInfo.value)
  } catch (error) {
    console.error('Table info loading error:', error)
    toast.error('Tablo bilgileri yüklenirken hata oluştu')
    router.push('/dashboard')
  }
}

const loadTableData = async () => {
  loading.value = true
  try {
    console.log('🔵 === LOAD TABLE DATA ===')
    console.log('🔵 1. Loading data for table ID:', tableId.value)

    const response = await apiService.getTableData(tableId.value)

    console.log('🔵 2. Received response:', response)
    console.log('🔵 3. Number of rows:', response.data.length)
    console.log('🔵 4. Row details:')
    response.data.forEach((row, index) => {
      console.log(`🔵   Row ${index}:`, {
        rowIdentifier: row.rowIdentifier,
        values: row.values,
      })
    })

    tableData.value = response
    console.log('🔵 5. Table data updated in state')
    console.log('🔵 === LOAD TABLE DATA COMPLETE ===')
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
    formData.value[column.id] = column.defaultValue || ''
  })

  showDialog.value = true
}

const openEditDialog = (item: TableRowData) => {
  editingItem.value = item
  formData.value = { ...item.values }

  console.log('🟡 === OPEN EDIT DIALOG (FIXED) ===')
  console.log('🟡 1. Edit item:', item)
  console.log('🟡 2. Row ID (for backend update):', item.rowId) // rowId kullan
  console.log('🟡 3. RowIdentifier (for display):', item.rowIdentifier)
  console.log('🟡 4. Form data:', formData.value)

  // Convert datetime values for form input
  tableData.value.columns.forEach((column) => {
    if (column.dataType === 4 && formData.value[column.id]) {
      try {
        const date = new Date(formData.value[column.id])
        formData.value[column.id] = date.toISOString().slice(0, 16)
        console.log(
          '🟡 5. Converted datetime for column',
          column.columnName,
          ':',
          formData.value[column.id],
        )
      } catch {
        // Keep original value if conversion fails
      }
    }
  })

  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  editingItem.value = null
  formData.value = {}
  formRef.value?.resetValidation()
}

const confirmDelete = (item: TableRowData) => {
  deleteItem.value = item
  deleteDialog.value = true
}

// CRUD Operations - Column Name Bazlı
const saveData = async () => {
  if (!formRef.value?.validate()) return

  saving.value = true
  try {
    console.log('🟡 === SAVE DATA DEBUG ===')
    console.log('🟡 Form data:', formData.value)
    console.log('🟡 Editing item:', editingItem.value)

    // Column values conversion
    const columnValues: Record<string, string> = {}

    tableData.value.columns.forEach((column) => {
      const value = formData.value[column.id]

      if (value !== null && value !== undefined && value !== '') {
        let processedValue = value.toString()

        // DateTime format fix
        if (column.dataType === 4 && processedValue.length === 16) {
          processedValue = processedValue + ':00'
        }

        columnValues[column.columnName] = processedValue
        console.log(`🟡 Added: ${column.columnName} = "${processedValue}"`)
      }
    })

    console.log('🟡 Final columnValues:', columnValues)

    if (editingItem.value) {
      // UPDATE
      const rowId = editingItem.value.rowId || editingItem.value.rowIdentifier

      if (!rowId) {
        throw new Error('Row ID bulunamadı')
      }

      console.log('🟡 Updating with rowId:', rowId)

      const updateRequest: UpdateTableDataRequest = {
        tableId: tableId.value,
        rowId: rowId,
        columnValues,
      }

      console.log('🟡 Update request:', updateRequest)
      await apiService.updateTableData(updateRequest)
      toast.success('Kayıt başarıyla güncellendi')
    } else {
      // ADD
      const addRequest: AddTableDataRequest = {
        tableId: tableId.value,
        columnValues,
      }

      await apiService.addTableData(addRequest)
      toast.success('Kayıt başarıyla eklendi')
    }

    closeDialog()
    await loadTableData()
  } catch (error: any) {
    console.error('🔴 Save error:', error)
    toast.error(error.message || 'Kayıt kaydedilirken hata oluştu')
  } finally {
    saving.value = false
  }
}

const deleteData = async () => {
  if (!deleteItem.value) {
    console.log('🔴 DELETE: No item selected for deletion')
    return
  }

  deleting.value = true
  try {
    console.log('🔴 === DELETE DATA DEBUG (FIXED) ===')
    console.log('🔴 1. Delete item full object:', deleteItem.value)
    console.log('🔴 2. Table ID:', tableId.value)
    console.log('🔴 3. Row ID for delete (rowId):', deleteItem.value.rowId) // rowId kullan
    console.log('🔴 4. RowIdentifier (display only):', deleteItem.value.rowIdentifier)

    // Delete işlemi için de rowId kullan
    const rowId = deleteItem.value.rowId || deleteItem.value.rowIdentifier
    if (!rowId) {
      console.error('🔴 ERROR: Row ID is missing or invalid:', rowId)
      toast.error("Kayıt ID'si bulunamadı")
      return
    }

    console.log('🔴 5. Making DELETE request to: /Tables/' + tableId.value + '/data/' + rowId)
    await apiService.deleteTableData(tableId.value, rowId)

    console.log('🟢 6. Delete successful - refreshing table data...')
    toast.success('Kayıt başarıyla silindi')

    deleteDialog.value = false
    deleteItem.value = null
    await loadTableData()
  } catch (error: any) {
    console.error('🔴 Delete data error:', error)
    toast.error(error.message || 'Kayıt silinirken hata oluştu')
  } finally {
    deleting.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([loadTableInfo(), loadTableData()])
})
</script>
<style scoped>
.v-data-table {
  border-radius: 8px;
}

.v-data-table :deep(.v-data-table__wrapper) {
  border-radius: 8px;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Form styling */
.v-dialog .v-card {
  border-radius: 12px;
}

.v-card-title.bg-primary {
  border-top-left-radius: 12px !important;
  border-top-right-radius: 12px !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 16px;
  }

  .d-flex.justify-end {
    justify-content: flex-start !important;
  }

  .d-flex.justify-end .v-btn {
    width: 100%;
    margin: 0 0 8px 0 !important;
  }
}
</style>
