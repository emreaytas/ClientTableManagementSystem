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
                  ? 'Mevcut tabloyu düzenleyin ve DDL değişikliklerini uygulayın'
                  : 'Yeni bir tablo oluşturun ve kolonlarını tanımlayın'
              }}
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Warning for Edit Mode -->
    <v-row v-if="isEdit">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal" class="mb-4">
          <v-icon>mdi-alert-circle</v-icon>
          <strong>Dikkat:</strong> Tablo yapısındaki değişiklikler mevcut verileri etkileyebilir.
          Değişikliklerinizi önizleyerek kontrol edin ve gerekirse yedekleme yapın.
        </v-alert>
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
                :disabled="loading || (isEdit && !allowTableRename)"
              ></v-text-field>

              <v-textarea
                v-model="tableData.description"
                label="Açıklama"
                variant="outlined"
                rows="3"
                class="mb-3"
                :disabled="loading"
              ></v-textarea>

              <!-- Edit Mode Options -->
              <div v-if="isEdit" class="mb-4">
                <v-divider class="mb-3"></v-divider>
                <h4 class="mb-3">Güvenlik Seçenekleri</h4>

                <v-checkbox
                  v-model="allowTableRename"
                  label="Tablo adını değiştirebilir"
                  class="mb-2"
                  :disabled="loading"
                ></v-checkbox>

                <v-checkbox
                  v-model="forceUpdate"
                  label="Veri uyumsuzluğunda zorla güncelle"
                  class="mb-2"
                  :disabled="loading"
                ></v-checkbox>

                <v-checkbox
                  v-model="showDDLPreview"
                  label="DDL komutlarını göster"
                  class="mb-3"
                  :disabled="loading"
                ></v-checkbox>
              </div>

              <v-alert type="info" variant="tonal" class="mb-3">
                {{
                  isEdit
                    ? 'Kolon ekleme, silme ve tip değişiklikleri DDL komutları ile uygulanacak.'
                    : 'Tablo oluşturduktan sonra kolon yapısını değiştirmek verilerinizi etkileyebilir.'
                }}
              </v-alert>

              <!-- Action Buttons -->
              <div class="d-flex flex-column ga-2">
                <v-btn
                  color="info"
                  variant="outlined"
                  prepend-icon="mdi-eye"
                  @click="showPreview"
                  :disabled="tableData.columns.length === 0"
                  block
                >
                  {{ isEdit ? 'Değişiklikleri Önizle' : 'Tablo Önizleme' }}
                </v-btn>

                <v-btn
                  v-if="isEdit"
                  color="warning"
                  variant="outlined"
                  prepend-icon="mdi-script-text"
                  @click="showDDLDialog = true"
                  :disabled="!hasChanges"
                  block
                >
                  DDL Komutları
                </v-btn>

                <v-btn
                  v-if="isEdit"
                  color="secondary"
                  variant="outlined"
                  prepend-icon="mdi-history"
                  @click="loadDDLHistory"
                  block
                >
                  Değişiklik Geçmişi
                </v-btn>
              </div>
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
                    <v-card
                      variant="outlined"
                      class="column-card"
                      :class="getColumnCardClass(column)"
                    >
                      <v-card-text>
                        <div class="d-flex justify-space-between align-center mb-3">
                          <div class="d-flex align-center ga-2">
                            <v-chip
                              :color="getColumnTypeColor(column.dataType)"
                              variant="tonal"
                              size="small"
                            >
                              {{ getColumnTypeLabel(column.dataType) }}
                            </v-chip>
                            <v-chip
                              v-if="getColumnStatus(column) !== 'unchanged'"
                              :color="getColumnStatusColor(column)"
                              variant="tonal"
                              size="x-small"
                            >
                              {{ getColumnStatusLabel(column) }}
                            </v-chip>
                          </div>
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
                          @input="markColumnAsModified(column)"
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
                          @update:model-value="markColumnAsModified(column)"
                        ></v-select>

                        <v-text-field
                          v-if="column.dataType === ColumnDataType.VARCHAR"
                          v-model.number="column.maxLength"
                          label="Maksimum Uzunluk"
                          variant="outlined"
                          density="compact"
                          type="number"
                          :rules="[rules.maxLength]"
                          class="mb-2"
                          :disabled="loading"
                          @input="markColumnAsModified(column)"
                        ></v-text-field>

                        <v-text-field
                          v-model="column.defaultValue"
                          label="Varsayılan Değer"
                          variant="outlined"
                          density="compact"
                          class="mb-2"
                          :disabled="loading"
                          @input="markColumnAsModified(column)"
                        ></v-text-field>

                        <v-checkbox
                          v-model="column.isRequired"
                          label="Zorunlu Alan"
                          density="compact"
                          :disabled="loading"
                          @change="markColumnAsModified(column)"
                        ></v-checkbox>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Save Actions -->
        <v-col cols="12">
          <div class="d-flex justify-end ga-3">
            <v-btn color="grey" variant="outlined" @click="goBack" :disabled="loading">
              İptal
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              type="submit"
              :loading="loading"
              :disabled="!isFormValid || (isEdit && !hasChanges)"
            >
              {{ isEdit ? 'Değişiklikleri Uygula' : 'Tablo Oluştur' }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-form>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="1000">
      <v-card>
        <v-card-title>
          <span class="text-h6">
            {{ isEdit ? 'Değişiklik Önizlemesi' : 'Tablo Önizleme' }}: {{ tableData.tableName }}
          </span>
        </v-card-title>
        <v-card-text>
          <!-- Changes Summary for Edit Mode -->
          <div v-if="isEdit && changesSummary" class="mb-4">
            <v-alert type="info" variant="tonal">
              <h4>Değişiklik Özeti:</h4>
              <ul class="mt-2">
                <li v-for="change in changesSummary" :key="change" v-html="change"></li>
              </ul>
            </v-alert>
          </div>

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
                  <v-chip
                    v-if="getColumnStatus(column) !== 'unchanged'"
                    :color="getColumnStatusColor(column)"
                    variant="tonal"
                    size="x-small"
                    class="ml-1"
                  >
                    {{ getColumnStatusLabel(column) }}
                  </v-chip>
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

    <!-- DDL Commands Dialog -->
    <v-dialog v-model="showDDLDialog" max-width="800" scrollable>
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-script-text</v-icon>
          DDL Komutları
        </v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            Bu SQL komutları tablonuzda çalıştırılacak. Lütfen dikkatli inceleyin.
          </v-alert>

          <v-code class="mb-4">
            <pre>{{ generatedDDL }}</pre>
          </v-code>

          <v-alert v-if="ddlWarnings.length > 0" type="error" variant="tonal">
            <h4>Uyarılar:</h4>
            <ul class="mt-2">
              <li v-for="warning in ddlWarnings" :key="warning">{{ warning }}</li>
            </ul>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showDDLDialog = false">İptal</v-btn>
          <v-btn
            color="warning"
            variant="elevated"
            @click="executeDDL"
            :loading="ddlExecuting"
            :disabled="ddlWarnings.length > 0 && !forceUpdate"
          >
            DDL'i Çalıştır
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DDL History Dialog -->
    <v-dialog v-model="showHistoryDialog" max-width="900" scrollable>
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-history</v-icon>
          Değişiklik Geçmişi
        </v-card-title>
        <v-card-text>
          <v-timeline density="compact">
            <v-timeline-item
              v-for="(history, index) in ddlHistory"
              :key="index"
              :dot-color="history.success ? 'success' : 'error'"
              size="small"
            >
              <template v-slot:icon>
                <v-icon>{{ history.success ? 'mdi-check' : 'mdi-close' }}</v-icon>
              </template>
              <v-card variant="outlined">
                <v-card-title class="text-subtitle-1">
                  {{ history.operation }}
                  <v-spacer></v-spacer>
                  <v-chip size="small" variant="tonal">
                    {{ formatDate(history.executedAt) }}
                  </v-chip>
                </v-card-title>
                <v-card-text>
                  <v-code>
                    <pre>{{ history.sqlCommand }}</pre>
                  </v-code>
                  <p v-if="history.message" class="mt-2">{{ history.message }}</p>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showHistoryDialog = false">Kapat</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  apiService,
  type ApiTable,
  type ApiColumn,
  type CreateTableRequest,
  type UpdateTableRequest,
  ColumnDataType,
} from '@/services/api'

// Composables
const route = useRoute()
const router = useRouter()
const toast = useToast()

// Reactive Data
const loading = ref(false)
const ddlExecuting = ref(false)
const previewDialog = ref(false)
const showDDLDialog = ref(false)
const showHistoryDialog = ref(false)
const tableForm = ref()

// Edit mode specific data
const originalTableData = ref<any>(null)
const allowTableRename = ref(false)
const forceUpdate = ref(false)
const showDDLPreview = ref(true)
const generatedDDL = ref('')
const ddlWarnings = ref<string[]>([])
const ddlHistory = ref<any[]>([])
const changesSummary = ref<string[]>([])

// Table data structure
interface TableColumn {
  id?: number
  columnName: string
  dataType: ColumnDataType
  isRequired: boolean
  displayOrder: number
  defaultValue?: string
  maxLength?: number
  isNew?: boolean
  isModified?: boolean
  isDeleted?: boolean
  originalColumn?: any
}

const tableData = ref({
  tableName: '',
  description: '',
  columns: [] as TableColumn[],
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

const hasChanges = computed(() => {
  if (!isEdit.value || !originalTableData.value) return false

  // Check table name change
  if (allowTableRename.value && tableData.value.tableName !== originalTableData.value.tableName) {
    return true
  }

  // Check description change
  if (tableData.value.description !== originalTableData.value.description) {
    return true
  }

  // Check column changes
  return (
    tableData.value.columns.some((col) => col.isNew || col.isModified || col.isDeleted) ||
    originalTableData.value.columns.some(
      (originalCol: any) => !tableData.value.columns.find((col) => col.id === originalCol.id),
    )
  )
})

// Column Types
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

    const loadedData = {
      tableName: table.tableName,
      description: table.description || '',
      columns: table.columns.map((col: ApiColumn, index: number) => ({
        id: col.id,
        columnName: col.columnName,
        dataType: col.dataType as ColumnDataType,
        isRequired: col.isRequired,
        displayOrder: col.displayOrder || index + 1,
        defaultValue: col.defaultValue || '',
        maxLength: col.maxLength,
        isNew: false,
        isModified: false,
        isDeleted: false,
        originalColumn: { ...col },
      })),
    }

    tableData.value = loadedData
    originalTableData.value = JSON.parse(JSON.stringify(loadedData))
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
  const newColumn: TableColumn = {
    columnName: '',
    dataType: ColumnDataType.VARCHAR,
    isRequired: false,
    displayOrder: tableData.value.columns.length + 1,
    defaultValue: '',
    maxLength: 255,
    isNew: true,
    isModified: false,
    isDeleted: false,
  }

  tableData.value.columns.push(newColumn)
}

const removeColumn = (index: number) => {
  const column = tableData.value.columns[index]

  if (column.isNew) {
    // Yeni eklenen kolonu direkt sil
    tableData.value.columns.splice(index, 1)
  } else {
    // Mevcut kolonu silinmiş olarak işaretle
    column.isDeleted = true
    tableData.value.columns.splice(index, 1)
  }
}

const markColumnAsModified = (column: TableColumn) => {
  if (!isEdit.value || column.isNew) return
  column.isModified = true
}

const getColumnStatus = (column: TableColumn) => {
  if (column.isNew) return 'new'
  if (column.isModified) return 'modified'
  if (column.isDeleted) return 'deleted'
  return 'unchanged'
}

const getColumnStatusLabel = (column: TableColumn) => {
  const status = getColumnStatus(column)
  switch (status) {
    case 'new':
      return 'YENİ'
    case 'modified':
      return 'DEĞİŞTİ'
    case 'deleted':
      return 'SİLİNDİ'
    default:
      return ''
  }
}

const getColumnStatusColor = (column: TableColumn) => {
  const status = getColumnStatus(column)
  switch (status) {
    case 'new':
      return 'success'
    case 'modified':
      return 'warning'
    case 'deleted':
      return 'error'
    default:
      return 'grey'
  }
}

const getColumnCardClass = (column: TableColumn) => {
  const status = getColumnStatus(column)
  switch (status) {
    case 'new':
      return 'border-success'
    case 'modified':
      return 'border-warning'
    case 'deleted':
      return 'border-error'
    default:
      return ''
  }
}

const generateChangesSummary = () => {
  if (!isEdit.value || !originalTableData.value) return []

  const summary: string[] = []

  // Table name change
  if (allowTableRename.value && tableData.value.tableName !== originalTableData.value.tableName) {
    summary.push(
      `<strong>Tablo adı:</strong> "${originalTableData.value.tableName}" → "${tableData.value.tableName}"`,
    )
  }

  // Description change
  if (tableData.value.description !== originalTableData.value.description) {
    summary.push(`<strong>Açıklama değiştirildi</strong>`)
  }

  // New columns
  const newColumns = tableData.value.columns.filter((col) => col.isNew)
  newColumns.forEach((col) => {
    summary.push(
      `<strong>Yeni kolon:</strong> ${col.columnName} (${getColumnTypeLabel(col.dataType)})`,
    )
  })

  // Modified columns
  const modifiedColumns = tableData.value.columns.filter((col) => col.isModified)
  modifiedColumns.forEach((col) => {
    summary.push(`<strong>Değiştirilen kolon:</strong> ${col.columnName}`)
  })

  // Deleted columns
  const deletedColumns = originalTableData.value.columns.filter(
    (originalCol: any) => !tableData.value.columns.find((col) => col.id === originalCol.id),
  )
  deletedColumns.forEach((col: any) => {
    summary.push(`<strong>Silinen kolon:</strong> ${col.columnName}`)
  })

  return summary
}

const generateDDL = async () => {
  if (!isEdit.value) return

  try {
    // Prepare update request
    const updateRequest: UpdateTableRequest = {
      tableId: tableId.value,
      tableName: allowTableRename.value ? tableData.value.tableName : undefined,
      description: tableData.value.description,
      columns: tableData.value.columns.map((col, index) => ({
        columnId: col.id || 0,
        columnName: col.columnName,
        dataType: col.dataType,
        isRequired: col.isRequired,
        displayOrder: index + 1,
        defaultValue: col.defaultValue || '',
        forceUpdate: forceUpdate.value,
      })),
    }

    // Get DDL preview from API
    const response = await apiService.validateTableChanges(tableId.value, updateRequest)
    generatedDDL.value = response.ddlCommands?.join('\n\n') || 'DDL komutları oluşturulamadı'
    ddlWarnings.value = response.warnings || []
  } catch (error: any) {
    console.error('DDL generation error:', error)
    toast.error('DDL komutları oluşturulurken hata oluştu')
  }
}

const loadDDLHistory = async () => {
  try {
    ddlHistory.value = await apiService.getTableDDLHistory(tableId.value)
    showHistoryDialog.value = true
  } catch (error: any) {
    console.error('DDL history loading error:', error)
    toast.error('Değişiklik geçmişi yüklenirken hata oluştu')
  }
}

const executeDDL = async () => {
  ddlExecuting.value = true
  try {
    await saveTable()
    showDDLDialog.value = false
    toast.success('DDL komutları başarıyla uygulandı')
  } catch (error) {
    toast.error('DDL komutları uygulanırken hata oluştu')
  } finally {
    ddlExecuting.value = false
  }
}

const showPreview = () => {
  if (isEdit.value) {
    changesSummary.value = generateChangesSummary()
  }
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

  loading.value = true
  try {
    if (isEdit.value) {
      // Update existing table
      const updateRequest: UpdateTableRequest = {
        tableId: tableId.value,
        tableName: allowTableRename.value ? tableData.value.tableName : undefined,
        description: tableData.value.description,
        columns: tableData.value.columns.map((col, index) => ({
          columnId: col.id || 0,
          columnName: col.columnName.trim(),
          dataType: col.dataType,
          isRequired: col.isRequired,
          displayOrder: index + 1,
          defaultValue: col.defaultValue || '',
          forceUpdate: forceUpdate.value,
        })),
      }

      await apiService.updateTable(tableId.value, updateRequest)
      toast.success('Tablo başarıyla güncellendi')
    } else {
      // Create new table
      const createRequest: CreateTableRequest = {
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

      await apiService.createTable(createRequest)
      toast.success('Tablo başarıyla oluşturuldu')
    }

    router.push('/tables')
  } catch (error: any) {
    console.error('Table save error:', error)

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.errors?.join(', ') ||
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

// Utility methods from original file
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

const getSampleData = (column: TableColumn): string => {
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
      return '-'
  }
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('tr-TR')
}

// Watch for changes to generate DDL preview
import { watch } from 'vue'

watch(
  () => tableData.value,
  () => {
    if (isEdit.value && showDDLPreview.value) {
      nextTick(() => {
        generateDDL()
      })
    }
  },
  { deep: true },
)

// Lifecycle
onMounted(async () => {
  await loadTable()
})
</script>

<style scoped>
.column-card {
  transition: all 0.3s ease;
  border-width: 2px;
}

.column-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.border-success {
  border-color: rgb(var(--v-theme-success)) !important;
}

.border-warning {
  border-color: rgb(var(--v-theme-warning)) !important;
}

.border-error {
  border-color: rgb(var(--v-theme-error)) !important;
}

.v-code {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  overflow-x: auto;
}

.v-code pre {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.v-timeline {
  padding-left: 0;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .d-flex.justify-end {
    flex-direction: column;
    gap: 8px;
  }

  .d-flex.justify-end .v-btn {
    width: 100%;
  }
}
</style>
