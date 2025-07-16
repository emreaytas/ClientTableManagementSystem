<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-6">
          <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-3"></v-btn>
          <div>
            <h1 class="text-h4 font-weight-bold">
              {{ isEdit ? 'Tablo Düzenle' : 'YENİ TABLO OLUŞTUR' }}
            </h1>
            <p class="text-subtitle-1 text--secondary">
              {{
                isEdit
                  ? 'Mevcut tabloyu düzenleyin'
                  : 'Yeni bir tablo oluşturun ve kolonlarını tanımlayın'
              }}
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-form ref="tableForm" @submit.prevent="saveTable">
      <v-row>
        <!-- Table Info -->
        <v-col cols="12" lg="4">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-information</v-icon>
              Tablo Bilgileri
            </v-card-title>
            <v-card-text>
              <v-text-field
                v-model="tableData.tableName"
                label="Tablo Adı *"
                variant="outlined"
                :rules="[rules.required, rules.tableName]"
                class="mb-3"
                :disabled="loading"
              ></v-text-field>

              <v-textarea
                v-model="tableData.description"
                label="Açıklama"
                variant="outlined"
                rows="3"
                class="mb-3"
                :disabled="loading"
              ></v-textarea>

              <v-checkbox
                v-model="tableData.isActive"
                label="Aktif"
                class="mb-3"
                :disabled="loading"
                style="display: none"
              ></v-checkbox>

              <v-alert type="info" variant="tonal" class="mb-3">
                Tablo oluşturduktan sonra kolon yapısını değiştirmek verilerinizi etkileyebilir.
              </v-alert>

              <!-- Preview Button -->
              <v-btn
                color="info"
                variant="outlined"
                block
                prepend-icon="mdi-eye"
                @click="showPreview"
                :disabled="tableData.columns.length === 0"
              >
                Önizleme
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Columns Definition -->
        <v-col cols="12" lg="8">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-table-column</v-icon>
              Kolonlar
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                prepend-icon="mdi-plus"
                @click="addColumn"
                :disabled="loading"
              >
                Kolon Ekle
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="tableData.columns.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-table-column-plus-before</v-icon>
                <p class="text-h6 text--secondary mt-2">Henüz kolon eklenmedi</p>
                <p class="text-body-2 text--secondary">Tablonuza kolon ekleyerek başlayın</p>
              </div>

              <div v-else>
                <v-row>
                  <v-col
                    v-for="(column, index) in tableData.columns"
                    :key="index"
                    cols="12"
                    md="6"
                    xl="4"
                  >
                    <v-card variant="outlined" class="column-card">
                      <v-card-text>
                        <div class="d-flex justify-space-between align-center mb-3">
                          <v-chip
                            :color="getColumnTypeColor(column.dataType)"
                            variant="tonal"
                            size="small"
                          >
                            {{ getColumnTypeLabel(column.dataType) }}
                          </v-chip>
                          <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            @click="removeColumn(index)"
                            :disabled="loading"
                          ></v-btn>
                        </div>

                        <v-text-field
                          v-model="column.columnName"
                          label="Kolon Adı *"
                          variant="outlined"
                          density="compact"
                          :rules="[rules.required, rules.columnName]"
                          class="mb-2"
                          :disabled="loading"
                        ></v-text-field>

                        <v-select
                          v-model="column.dataType"
                          :items="columnTypes"
                          item-title="title"
                          item-value="value"
                          label="Veri Tipi *"
                          variant="outlined"
                          density="compact"
                          :rules="[rules.dataType]"
                          class="mb-2"
                          :disabled="loading"
                        ></v-select>

                        <!-- Optional: Default Value field (removed complex type-specific fields for now) -->
                        <v-text-field
                          v-model="column.defaultValue"
                          label="Varsayılan Değer"
                          variant="outlined"
                          density="compact"
                          class="mb-2"
                          :disabled="loading"
                        ></v-text-field>

                        <v-checkbox
                          v-model="column.isRequired"
                          label="Zorunlu"
                          density="compact"
                          class="mb-1"
                          :disabled="loading"
                        ></v-checkbox>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Action Buttons -->
      <v-row class="mt-6">
        <v-col cols="12">
          <div class="d-flex justify-end gap-3">
            <v-btn color="grey" variant="outlined" @click="goBack" :disabled="loading">
              İptal
            </v-btn>
            <v-btn
              color="primary"
              type="submit"
              :loading="loading"
              :disabled="loading || tableData.columns.length === 0 || !isFormValid"
            >
              {{ isEdit ? 'Güncelle' : 'Oluştur' }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-form>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="1000">
      <v-card>
        <v-card-title>
          <span class="text-h6">Tablo Önizleme: {{ tableData.tableName }}</span>
        </v-card-title>
        <v-card-text>
          <v-table>
            <thead>
              <tr>
                <th v-for="column in tableData.columns" :key="column.columnName" class="text-left">
                  {{ column.columnName }}
                  <v-chip
                    :color="getColumnTypeColor(column.dataType)"
                    variant="tonal"
                    size="x-small"
                    class="ml-2"
                  >
                    {{ getColumnTypeLabel(column.dataType) }}
                  </v-chip>
                  <v-tooltip v-if="column.isRequired" text="Zorunlu Alan">
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" size="small" color="red" class="ml-1"
                        >mdi-asterisk</v-icon
                      >
                    </template>
                  </v-tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  v-for="column in tableData.columns"
                  :key="column.columnName"
                  class="text--secondary"
                >
                  {{ getSampleData(column) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="previewDialog = false"> Kapat </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  apiService,
  type ApiTable,
  type ApiColumn,
  type CreateTableRequest,
  type ColumnDataType,
} from '@/services/api'

// Composables
const route = useRoute()
const router = useRouter()
const toast = useToast()

// Reactive Data
const loading = ref(false)
const previewDialog = ref(false)
const tableForm = ref()

// API Data Type Enum matching backend
enum ColumnDataType {
  VARCHAR = 0,
  INT = 1,
  DECIMAL = 2,
  DATETIME = 3,
}

// Table data structure matching API expectations
const tableData = ref({
  tableName: '', // API expects 'tableName' not 'name'
  description: '',
  columns: [] as Array<{
    columnName: string // API expects 'columnName' not 'name'
    dataType: ColumnDataType
    isRequired: boolean
    displayOrder: number
    defaultValue?: string
  }>,
})

// Computed
const isEdit = computed(() => !!route.params.id)
const tableId = computed(() => parseInt(route.params.id as string))

const isFormValid = computed(() => {
  return (
    tableData.value.tableName.trim() !== '' &&
    tableData.value.columns.length > 0 &&
    tableData.value.columns.every(
      (col) =>
        col.columnName.trim() !== '' &&
        col.dataType !== null &&
        col.dataType !== undefined &&
        [
          ColumnDataType.VARCHAR,
          ColumnDataType.INT,
          ColumnDataType.DECIMAL,
          ColumnDataType.DATETIME,
        ].includes(col.dataType),
    )
  )
})

// Column Types based on API enum
const columnTypes = [
  { title: 'Metin (VARCHAR)', value: ColumnDataType.VARCHAR },
  { title: 'Sayı (INT)', value: ColumnDataType.INT },
  { title: 'Ondalık (DECIMAL)', value: ColumnDataType.DECIMAL },
  { title: 'Tarih/Saat (DATETIME)', value: ColumnDataType.DATETIME },
]

// Validation Rules
const rules = {
  required: (value: string) => !!value || 'Bu alan zorunludur',
  requiredSelect: (value: any) =>
    (value !== null && value !== undefined && value !== '') || 'Bu alan zorunludur',
  tableName: (value: string) => {
    if (!value) return 'Tablo adı zorunludur'
    if (value.length < 2) return 'Tablo adı en az 2 karakter olmalıdır'
    if (value.length > 100) return 'Tablo adı en fazla 100 karakter olabilir'
    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9\s_-]+$/.test(value))
      return 'Tablo adı geçersiz karakterler içeriyor'
    return true
  },
  columnName: (value: string) => {
    if (!value) return 'Kolon adı zorunludur'
    if (value.length < 1) return 'Kolon adı en az 1 karakter olmalıdır'
    if (value.length > 50) return 'Kolon adı en fazla 50 karakter olabilir'
    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9\s_-]+$/.test(value))
      return 'Kolon adı geçersiz karakterler içeriyor'
    return true
  },
  dataType: (value: any) => {
    if (value === null || value === undefined) return 'Veri tipi seçmelisiniz'
    if (
      ![
        ColumnDataType.VARCHAR,
        ColumnDataType.INT,
        ColumnDataType.DECIMAL,
        ColumnDataType.DATETIME,
      ].includes(value)
    ) {
      return 'Geçerli bir veri tipi seçin'
    }
    return true
  },
  maxLength: (value: number) => {
    if (!value || value < 1) return 'Maksimum uzunluk en az 1 olmalıdır'
    if (value > 8000) return 'Maksimum uzunluk en fazla 8000 olabilir'
    return true
  },
}

// Methods
const loadTable = async () => {
  if (!isEdit.value) return

  loading.value = true
  try {
    const table: ApiTable = await apiService.getTable(tableId.value)

    tableData.value = {
      tableName: table.tableName,
      description: table.description || '',
      columns: table.columns.map((col, index) => ({
        columnName: col.columnName,
        dataType: col.dataType as ColumnDataType,
        isRequired: col.isRequired,
        displayOrder: col.displayOrder || index + 1,
        defaultValue: col.defaultValue || '',
      })),
    }
  } catch (error: any) {
    console.error('Table loading error:', error)
    toast.error(
      'Tablo yüklenirken hata oluştu: ' + (error.response?.data?.message || error.message),
    )
    router.push('/tables')
  } finally {
    loading.value = false
  }
}

const addColumn = () => {
  tableData.value.columns.push({
    columnName: '',
    dataType: ColumnDataType.VARCHAR, // Varsayılan olarak VARCHAR seçili gelsin
    isRequired: false,
    displayOrder: tableData.value.columns.length + 1,
    defaultValue: '',
  })
}

const removeColumn = (index: number) => {
  tableData.value.columns.splice(index, 1)
}

const saveTable = async () => {
  const { valid } = await tableForm.value.validate()
  if (!valid) {
    toast.error('Lütfen form hatalarını düzeltin')
    return
  }

  // Additional validation
  if (tableData.value.columns.length === 0) {
    toast.error('En az bir kolon eklemelisiniz')
    return
  }

  // Check for duplicate column names
  const columnNames = tableData.value.columns.map((col) => col.columnName.toLowerCase().trim())
  const duplicates = columnNames.filter((name, index) => columnNames.indexOf(name) !== index)
  if (duplicates.length > 0) {
    toast.error('Kolon adları benzersiz olmalıdır')
    return
  }

  // Validate column data types
  const invalidColumns = tableData.value.columns.filter(
    (col) =>
      col.dataType === null ||
      col.dataType === undefined ||
      ![
        ColumnDataType.VARCHAR,
        ColumnDataType.INT,
        ColumnDataType.DECIMAL,
        ColumnDataType.DATETIME,
      ].includes(col.dataType),
  )
  if (invalidColumns.length > 0) {
    toast.error('Tüm kolonlar için geçerli veri tipi seçmelisiniz')
    return
  }

  loading.value = true
  try {
    // Prepare data exactly as API expects (CreateTableRequest format)
    const apiData = {
      tableName: tableData.value.tableName.trim(),
      description: tableData.value.description.trim(),
      columns: tableData.value.columns.map((col, index) => ({
        columnName: col.columnName.trim(),
        dataType: col.dataType,
        isRequired: col.isRequired,
        displayOrder: index + 1,
        defaultValue: col.defaultValue || '',
      })),
    }

    console.log('Sending data to API:', apiData) // Debug log

    if (isEdit.value) {
      // For updates, we might need different endpoint or format
      const updateData: CreateTableRequest = {
        ...apiData,
        // Add id for update if needed by API
      }
      await apiService.updateTable(tableId.value, updateData as any)
      toast.success('Tablo başarıyla güncellendi')
    } else {
      const createData: CreateTableRequest = apiData
      await apiService.createTable(createData)
      toast.success('Tablo başarıyla oluşturuldu')
    }

    router.push('/tables')
  } catch (error: any) {
    console.error('Table save error:', error)

    // Enhanced error logging
    if (error.response) {
      console.error('Error response data:', error.response.data)
      console.error('Error response status:', error.response.status)
      console.error('Error response headers:', error.response.headers)
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.errors
        ?.map((e: any) => Object.values(e))
        .flat()
        .join(', ') ||
      error.message ||
      'Bilinmeyen hata'
    toast.error(
      `Tablo ${isEdit.value ? 'güncellenirken' : 'oluşturulurken'} hata oluştu: ${errorMessage}`,
    )
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/tables')
}

const showPreview = () => {
  if (tableData.value.columns.length === 0) {
    toast.warning('Önizleme için en az bir kolon eklemelisiniz')
    return
  }
  previewDialog.value = true
}

// Helper functions
const getColumnTypeColor = (dataType: ColumnDataType): string => {
  switch (dataType) {
    case ColumnDataType.VARCHAR:
      return 'blue'
    case ColumnDataType.INT:
      return 'green'
    case ColumnDataType.DECIMAL:
      return 'orange'
    case ColumnDataType.DATETIME:
      return 'purple'
    default:
      return 'grey'
  }
}

const getColumnTypeLabel = (dataType: ColumnDataType): string => {
  switch (dataType) {
    case ColumnDataType.VARCHAR:
      return 'Metin'
    case ColumnDataType.INT:
      return 'Sayı'
    case ColumnDataType.DECIMAL:
      return 'Ondalık'
    case ColumnDataType.DATETIME:
      return 'Tarih'
    default:
      return 'Bilinmeyen'
  }
}

const getSampleData = (column: any): string => {
  switch (column.dataType) {
    case ColumnDataType.VARCHAR:
      return 'Örnek metin'
    case ColumnDataType.INT:
      return '123'
    case ColumnDataType.DECIMAL:
      return '123.45'
    case ColumnDataType.DATETIME:
      return '2024-01-15 10:30'
    default:
      return 'Örnek veri'
  }
}

// Initialize
onMounted(() => {
  if (isEdit.value) {
    loadTable()
  }
})
</script>

<style scoped>
.column-card {
  transition: all 0.2s ease;
}

.column-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .d-flex.justify-end {
    flex-direction: column;
    gap: 12px;
  }

  .d-flex.justify-end .v-btn {
    width: 100%;
  }
}
</style>
