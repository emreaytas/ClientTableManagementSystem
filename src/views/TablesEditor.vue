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
                @input="checkForChanges"
              ></v-text-field>

              <v-textarea
                v-model="tableData.description"
                label="Açıklama"
                variant="outlined"
                rows="3"
                class="mb-3"
                :disabled="loading"
                @input="checkForChanges"
              ></v-textarea>

              <v-alert type="info" variant="tonal" class="mb-3">
                {{
                  isEdit
                    ? 'Tablo yapısını değiştirmek mevcut verilerinizi etkileyebilir.'
                    : 'Tablo oluşturduktan sonra kolon yapısını değiştirmek verilerinizi etkileyebilir.'
                }}
              </v-alert>

              <!-- Change Detection Alert -->
              <v-alert v-if="isEdit && hasChanges" type="warning" variant="tonal" class="mb-3">
                <v-icon class="mr-2">mdi-pencil</v-icon>
                Değişiklikler tespit edildi. Güncellemek için "Güncelle" butonuna tıklayın.
              </v-alert>

              <!-- Table Statistics for Edit Mode -->
              <div v-if="isEdit" class="mb-3">
                <v-divider class="mb-3"></v-divider>
                <h3 class="text-h6 mb-2">Tablo İstatistikleri</h3>
                <v-row>
                  <v-col cols="6">
                    <v-card variant="tonal" color="primary">
                      <v-card-text class="text-center">
                        <div class="text-h6">{{ tableData.columns.length }}</div>
                        <div class="text-caption">Kolon Sayısı</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card variant="tonal" color="success">
                      <v-card-text class="text-center">
                        <div class="text-h6">{{ requiredColumnsCount }}</div>
                        <div class="text-caption">Zorunlu Kolon</div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Columns -->
        <v-col cols="12" lg="8">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <div>
                <v-icon class="mr-2">mdi-table-column</v-icon>
                Kolonlar ({{ tableData.columns.length }})
              </div>
              <v-btn color="success" prepend-icon="mdi-plus" @click="addColumn" :disabled="loading">
                Kolon Ekle
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div v-if="tableData.columns.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-table-column-plus-after</v-icon>
                <p class="text-h6 text--secondary mt-2">Henüz kolon eklenmedi</p>
                <p class="text-body-2 text--secondary">Tablonuz için gerekli kolonları ekleyin</p>
                <v-btn color="success" class="mt-4" prepend-icon="mdi-plus" @click="addColumn">
                  İlk Kolonu Ekle
                </v-btn>
              </div>

              <div v-else>
                <v-row>
                  <v-col
                    v-for="(column, index) in tableData.columns"
                    :key="index"
                    cols="12"
                    md="6"
                    lg="4"
                  >
                    <v-card class="column-card" elevation="1">
                      <v-card-title class="pb-2 d-flex justify-space-between align-center">
                        <span class="text-h6">Kolon {{ index + 1 }}</span>
                        <v-btn
                          icon="mdi-delete"
                          size="small"
                          color="error"
                          variant="text"
                          @click="removeColumn(index)"
                          :disabled="loading"
                        ></v-btn>
                      </v-card-title>
                      <v-card-text>
                        <v-text-field
                          v-model="column.columnName"
                          label="Kolon Adı *"
                          variant="outlined"
                          density="compact"
                          :rules="[rules.required, rules.columnName]"
                          class="mb-2"
                          :disabled="loading"
                          @input="checkForChanges"
                        ></v-text-field>

                        <v-select
                          v-model="column.dataType"
                          :items="columnTypes"
                          label="Veri Tipi *"
                          variant="outlined"
                          density="compact"
                          :rules="[rules.dataType]"
                          class="mb-2"
                          :disabled="loading"
                          @update:model-value="checkForChanges"
                        ></v-select>

                        <v-text-field
                          v-model="column.defaultValue"
                          label="Varsayılan Değer"
                          variant="outlined"
                          density="compact"
                          class="mb-2"
                          :disabled="loading"
                          @input="checkForChanges"
                        ></v-text-field>

                        <v-checkbox
                          v-model="column.isRequired"
                          label="Zorunlu"
                          density="compact"
                          class="mb-1"
                          :disabled="loading"
                          @change="checkForChanges"
                        ></v-checkbox>

                        <!-- Column Info Chip -->
                        <v-chip
                          :color="getColumnTypeColor(column.dataType)"
                          variant="tonal"
                          size="small"
                          class="mr-2"
                        >
                          {{ getColumnTypeLabel(column.dataType) }}
                        </v-chip>
                        <v-chip v-if="column.isRequired" color="red" variant="tonal" size="small">
                          Zorunlu
                        </v-chip>
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
          <div class="d-flex justify-space-between align-center">
            <!-- Left Side Buttons -->
            <div class="d-flex gap-3">
              <v-btn
                color="info"
                variant="outlined"
                @click="previewTable"
                :disabled="loading || tableData.columns.length === 0"
                prepend-icon="mdi-eye"
              >
                Önizleme
              </v-btn>
            </div>

            <!-- Right Side Buttons -->
            <div class="d-flex gap-3">
              <v-btn color="grey" variant="outlined" @click="goBack" :disabled="loading">
                İptal
              </v-btn>
              <v-btn
                v-if="isEdit"
                color="warning"
                variant="outlined"
                @click="resetChanges"
                :disabled="loading || !hasChanges"
                prepend-icon="mdi-restore"
              >
                Değişiklikleri Geri Al
              </v-btn>
              <v-btn
                :color="isEdit && hasChanges ? 'success' : 'primary'"
                type="submit"
                :loading="loading"
                :disabled="
                  loading ||
                  tableData.columns.length === 0 ||
                  !isFormValid ||
                  (isEdit && !hasChanges)
                "
                :prepend-icon="
                  isEdit ? (hasChanges ? 'mdi-content-save' : 'mdi-check') : 'mdi-plus'
                "
              >
                {{ isEdit ? (hasChanges ? 'Güncelle' : 'Güncel') : 'Oluştur' }}
              </v-btn>
            </div>
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
                      <v-icon v-bind="props" size="small" color="red" class="ml-1">
                        mdi-asterisk
                      </v-icon>
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
          <v-btn color="primary" @click="previewDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { apiService } from '@/services/api'

// Interfaces
interface ApiTable {
  id: number
  tableName: string
  description: string
  createdAt: string
  columns: ApiColumn[]
}

interface ApiColumn {
  id: number
  columnName: string
  dataType: number
  isRequired: boolean
  displayOrder: number
  defaultValue: string
}

interface CreateTableRequest {
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

// API Data Type Enum matching backend
enum ColumnDataType {
  VARCHAR = 0,
  INT = 1,
  DECIMAL = 2,
  DATETIME = 3,
}

// Composables
const route = useRoute()
const router = useRouter()
const toast = useToast()

// Reactive Data
const loading = ref(false)
const previewDialog = ref(false)
const tableForm = ref()
const hasChanges = ref(false)

// Table data structure matching API expectations
const tableData = ref({
  tableName: '',
  description: '',
  columns: [] as Array<{
    columnName: string
    dataType: ColumnDataType
    isRequired: boolean
    displayOrder: number
    defaultValue?: string
  }>,
})

// Original data for comparison (only for edit mode)
const originalData = ref<typeof tableData.value | null>(null)

// Computed
const isEdit = computed(() => !!route.params.id)
const tableId = computed(() => parseInt(route.params.id as string))

const requiredColumnsCount = computed(
  () => tableData.value.columns.filter((col) => col.isRequired).length,
)

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
}

// Methods
const loadTable = async () => {
  if (!isEdit.value) return

  loading.value = true
  try {
    const table: ApiTable = await apiService.getTable(tableId.value)

    const loadedData = {
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

    tableData.value = JSON.parse(JSON.stringify(loadedData))
    originalData.value = JSON.parse(JSON.stringify(loadedData))
    hasChanges.value = false
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

const checkForChanges = () => {
  if (!isEdit.value || !originalData.value) {
    hasChanges.value = false
    return
  }

  const currentDataStr = JSON.stringify(tableData.value)
  const originalDataStr = JSON.stringify(originalData.value)
  hasChanges.value = currentDataStr !== originalDataStr
}

const resetChanges = () => {
  if (originalData.value) {
    tableData.value = JSON.parse(JSON.stringify(originalData.value))
    hasChanges.value = false
    toast.info('Değişiklikler geri alındı')
  }
}

const addColumn = () => {
  tableData.value.columns.push({
    columnName: '',
    dataType: ColumnDataType.VARCHAR,
    isRequired: false,
    displayOrder: tableData.value.columns.length + 1,
    defaultValue: '',
  })

  nextTick(() => {
    checkForChanges()
  })
}

const removeColumn = (index: number) => {
  tableData.value.columns.splice(index, 1)
  checkForChanges()
}

const previewTable = () => {
  previewDialog.value = true
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

    if (isEdit.value) {
      await apiService.updateTable(tableId.value, apiData as any)
      toast.success('Tablo başarıyla güncellendi')

      // Update original data and reset changes flag
      originalData.value = JSON.parse(JSON.stringify(tableData.value))
      hasChanges.value = false
    } else {
      await apiService.createTable(apiData as CreateTableRequest)
      toast.success('Tablo başarıyla oluşturuldu')
      router.push('/tables')
    }
  } catch (error: any) {
    console.error('Table save error:', error)

    if (error.response) {
      console.error('Error response data:', error.response.data)
      console.error('Error response status:', error.response.status)
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
  if (hasChanges.value) {
    if (confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinizden emin misiniz?')) {
      router.push('/tables')
    }
  } else {
    router.push('/tables')
  }
}

// Utility functions
const getColumnTypeLabel = (dataType: ColumnDataType): string => {
  switch (dataType) {
    case ColumnDataType.VARCHAR:
      return 'VARCHAR'
    case ColumnDataType.INT:
      return 'INT'
    case ColumnDataType.DECIMAL:
      return 'DECIMAL'
    case ColumnDataType.DATETIME:
      return 'DATETIME'
    default:
      return 'UNKNOWN'
  }
}

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

const getSampleData = (column: any): string => {
  switch (column.dataType) {
    case ColumnDataType.VARCHAR:
      return column.defaultValue || 'Örnek metin'
    case ColumnDataType.INT:
      return column.defaultValue || '123'
    case ColumnDataType.DECIMAL:
      return column.defaultValue || '123.45'
    case ColumnDataType.DATETIME:
      return column.defaultValue || new Date().toLocaleString('tr-TR')
    default:
      return 'Veri'
  }
}

// Initialize
onMounted(() => {
  loadTable()
})
</script>

<style scoped>
.column-card {
  transition: all 0.3s ease;
  height: 100%;
}

.column-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 16px;
  }

  .d-flex.gap-3 {
    width: 100%;
    justify-content: stretch;
  }

  .d-flex.gap-3 .v-btn {
    flex: 1;
  }
}
</style>
