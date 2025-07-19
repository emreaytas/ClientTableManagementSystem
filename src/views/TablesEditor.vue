<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-6">
          <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-3"></v-btn>
          <div>
            <h1 class="text-h4 font-weight-bold">
              {{ isEdit ? 'TABLO DÜZENLE' : 'YENİ TABLO OLUŞTUR' }}
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

    <!-- 🔥 YENİ: Akıllı Bilgilendirme Alert'leri -->
    <v-row v-if="isEdit">
      <v-col cols="12">
        <!-- Genel bilgilendirme -->
        <v-alert type="info" variant="tonal" class="mb-4" icon="mdi-information">
          <v-alert-title>💡 Akıllı Tablo Güncelleme Sistemi</v-alert-title>
          <div class="mt-2">
            <p>
              <strong
                >Sistem tablonuzun içeriğini analiz ederek güvenli güncellemeler yapar:</strong
              >
            </p>
            <ul class="mt-2 ml-4">
              <li>
                📊 <strong>Boş kolonlar:</strong> Herhangi bir veri tipi değişikliğine izin verilir
              </li>
              <li>🔢 <strong>INT → DECIMAL:</strong> Her zaman güvenli (veri kaybı olmaz)</li>
              <li>📝 <strong>Sayısal → TEXT:</strong> Her zaman güvenli (veri kaybı olmaz)</li>
              <li>⚠️ <strong>TEXT → Sayısal:</strong> Geçersiz veriler kontrol edilir</li>
              <li>🗑️ <strong>Kolon silme:</strong> Sadece veri içeren kolonlarda uyarı verir</li>
            </ul>
          </div>
        </v-alert>

        <!-- Değişiklik bilgisi -->
        <v-alert v-if="hasChanges" type="warning" variant="tonal" class="mb-4" icon="mdi-pencil">
          <v-alert-title>📝 Değişiklikler Tespit Edildi</v-alert-title>
          <div class="mt-2">
            <p>Güncelleme yapmadan önce sistem:</p>
            <ul class="mt-2 ml-4">
              <li>🔍 Tablonuzun veri içeriğini kontrol edecek</li>
              <li>⚡ Güvenli değişiklikleri otomatik onaylayacak</li>
              <li>⚠️ Risk olan durumları size soracak</li>
            </ul>
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Loading State for Edit Mode -->
    <div v-if="loading && isEdit" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="text-h6 mt-4">Tablo yükleniyor...</p>
    </div>

    <v-form v-else ref="tableForm" @submit.prevent="saveTable">
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
              <!-- 🔥 YENİ: Veri Tipi Dönüşüm Rehberi -->
              <v-expansion-panels v-if="isEdit" class="mb-4">
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <v-icon class="mr-2">mdi-help-circle</v-icon>
                    Veri Tipi Dönüşüm Rehberi
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="12" md="6">
                        <h4 class="text-green mb-2">✅ Güvenli Dönüşümler (Veri Kaybı Yok)</h4>
                        <ul class="ml-4">
                          <li><strong>INT → DECIMAL:</strong> 123 → 123.00</li>
                          <li><strong>INT → VARCHAR:</strong> 123 → "123"</li>
                          <li><strong>DECIMAL → VARCHAR:</strong> 123.45 → "123.45"</li>
                          <li><strong>DATETIME → VARCHAR:</strong> Tarih → "2024-01-01"</li>
                        </ul>
                      </v-col>
                      <v-col cols="12" md="6">
                        <h4 class="text-orange mb-2">⚠️ Dikkatli Dönüşümler (Kontrol Edilir)</h4>
                        <ul class="ml-4">
                          <li><strong>VARCHAR → INT:</strong> "abc" → 0 (geçersiz)</li>
                          <li><strong>VARCHAR → DECIMAL:</strong> "xyz" → 0.00 (geçersiz)</li>
                          <li><strong>DECIMAL → INT:</strong> 123.45 → 123 (ondalık kaybolur)</li>
                          <li><strong>VARCHAR → DATETIME:</strong> "geçersiz" → NULL</li>
                        </ul>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

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
                    :key="column.id || `new-${index}`"
                    cols="12"
                    md="6"
                    lg="4"
                  >
                    <!-- 🔥 YENİ: Geliştirilmiş Kolon Card'ı -->
                    <v-card
                      class="column-card h-100"
                      :class="{
                        'border-primary': column.isRequired,
                        'border-dashed': !column.id,
                      }"
                      variant="outlined"
                    >
                      <v-card-title class="d-flex align-center justify-space-between pa-3">
                        <div class="d-flex align-center">
                          <v-chip
                            :color="getColumnTypeColor(column.dataType)"
                            size="small"
                            class="mr-2"
                          >
                            {{ getColumnTypeLabel(column.dataType) }}
                          </v-chip>
                          <v-icon v-if="column.isRequired" color="warning" size="small">
                            mdi-asterisk
                          </v-icon>
                          <v-icon v-if="!column.id" color="success" size="small">
                            mdi-new-box
                          </v-icon>
                        </div>

                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          size="small"
                          color="error"
                          @click="removeColumn(index)"
                          :disabled="loading"
                        ></v-btn>
                      </v-card-title>

                      <v-card-text class="pt-0">
                        <!-- Kolon adı -->
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

                        <!-- Veri tipi -->
                        <v-select
                          v-model="column.dataType"
                          label="Veri Tipi *"
                          variant="outlined"
                          density="compact"
                          :items="columnTypes"
                          item-title="title"
                          item-value="value"
                          :rules="[rules.dataType]"
                          class="mb-2"
                          :disabled="loading"
                          @update:model-value="checkForChanges"
                        >
                          <template #item="{ props, item }">
                            <v-list-item
                              v-bind="props"
                              :prepend-icon="'mdi-circle'"
                              :prepend-icon-color="item.raw.color"
                            >
                              <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                              <v-list-item-subtitle>{{
                                item.raw.description
                              }}</v-list-item-subtitle>
                            </v-list-item>
                          </template>
                        </v-select>

                        <!-- Varsayılan değer -->
                        <v-text-field
                          v-model="column.defaultValue"
                          label="Varsayılan Değer"
                          variant="outlined"
                          density="compact"
                          class="mb-2"
                          :disabled="loading"
                          @input="checkForChanges"
                          :hint="getDefaultValueHint(column.dataType)"
                          persistent-hint
                        ></v-text-field>

                        <!-- Zorunlu checkbox -->
                        <v-checkbox
                          v-model="column.isRequired"
                          label="Zorunlu alan"
                          density="compact"
                          :disabled="loading"
                          @update:model-value="checkForChanges"
                        ></v-checkbox>

                        <!-- Örnek veri gösterimi -->
                        <v-alert type="info" variant="tonal" density="compact" class="mt-2">
                          <small><strong>Örnek:</strong> {{ getSampleData(column) }}</small>
                        </v-alert>
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

interface UpdateTableRequest {
  tableId?: number
  tableName: string
  description: string
  columns: {
    columnId?: number | null
    columnName: string
    dataType: number
    isRequired: boolean
    displayOrder: number
    defaultValue: string
    forceUpdate?: boolean
  }[]
}

// API Data Type Enum matching backend
enum ColumnDataType {
  VARCHAR = 1,
  INT = 2,
  DECIMAL = 3,
  DATETIME = 4,
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
    id?: number | null // ✅ Backend'den gelen ID
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
        [1, 2, 3, 4].includes(col.dataType),
    )
  )
})

// Column Types based on API enum
const columnTypes = [
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
  dataType: (value: number) => {
    if (![1, 2, 3, 4].includes(value)) {
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
    console.log('🔄 Loading table with ID:', tableId.value)
    const table: ApiTable = await apiService.getTableById(tableId.value)
    console.log('✅ Table loaded:', table)

    const loadedData = {
      tableName: table.tableName,
      description: table.description || '',
      columns: table.columns
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((col, index) => ({
          id: col.id, // ✅ ID'yi muhafaza et
          columnName: col.columnName,
          dataType: col.dataType as ColumnDataType,
          isRequired: col.isRequired,
          displayOrder: col.displayOrder || index + 1,
          defaultValue: col.defaultValue || '',
        })),
    }

    console.log('🔧 Processed table data:', loadedData)
    tableData.value = JSON.parse(JSON.stringify(loadedData))
    originalData.value = JSON.parse(JSON.stringify(loadedData))
    hasChanges.value = false
  } catch (error: any) {
    console.error('❌ Table loading error:', error)
    toast.error(
      'Tablo yüklenirken hata oluştu: ' + (error.response?.data?.message || error.message),
    )
    router.push('/tables')
  } finally {
    loading.value = false
  }
}

// 🔥 SAVE TABLE METODUNU DÜZELT
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
      await performTableUpdate()
    } else {
      // Yeni tablo oluşturma
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

      console.log('Creating table with data:', apiData)
      await apiService.createTable(apiData)
      toast.success('Tablo başarıyla oluşturuldu')
      router.push('/tables')
    }
  } catch (error: any) {
    console.error('❌ Table save error:', error)
    await handleTableUpdateError(error)
  } finally {
    loading.value = false
  }
}

// 🔥 Tablo güncelleme işlemini ayrı fonksiyon yaptık
const performTableUpdate = async () => {
  const updateData = buildUpdateData()

  console.log('🚀 Sending table update:', updateData)

  const response = await apiService.updateTable(tableId.value, updateData)

  // ✅ Başarılı güncelleme
  toast.success('Tablo başarıyla güncellendi!')

  // Güvenli değişiklikleri kullanıcıya göster
  handleSuccessfulUpdate(response)

  await loadTable()
  hasChanges.value = false
}

// 🔥 Update data builder
const buildUpdateData = (forceUpdate = false) => {
  return {
    tableId: tableId.value,
    tableName: tableData.value.tableName.trim(),
    description: tableData.value.description.trim(),
    columns: tableData.value.columns.map((col, index) => {
      const columnData = {
        columnName: col.columnName.trim(),
        dataType: col.dataType,
        isRequired: col.isRequired,
        displayOrder: index + 1,
        defaultValue: col.defaultValue || '',
        forceUpdate: forceUpdate,
      }

      // ✅ Eğer kolon ID'si varsa ekle (mevcut kolon)
      if (col.id && col.id > 0) {
        ;(columnData as any).columnId = col.id
      } else {
        // ✅ Yeni kolon - columnId null
        ;(columnData as any).columnId = null
      }

      return columnData
    }),
  }
}

// 🔥 Başarılı güncelleme sonrası işlemler
const handleSuccessfulUpdate = (response: any) => {
  if (response && typeof response === 'object' && 'validationResult' in response) {
    const validationResult = response.validationResult
    if (validationResult?.columnIssues) {
      const safeChanges: string[] = []

      Object.entries(validationResult.columnIssues).forEach(([columnName, issues]) => {
        if (Array.isArray(issues)) {
          issues.forEach((issue: string) => {
            if (issue.startsWith('✅')) {
              safeChanges.push(`${columnName}: ${issue.replace('✅ ', '')}`)
            } else if (issue.startsWith('ℹ️')) {
              safeChanges.push(`${columnName}: ${issue.replace('ℹ️ ', '')}`)
            }
          })
        }
      })

      if (safeChanges.length > 0) {
        toast.info('Güvenli değişiklikler: ' + safeChanges.join(', '), { timeout: 5000 })
      }
    }
  }
}

// 🔥 Hata yönetimi
const handleTableUpdateError = async (error: any) => {
  if (error.response?.status === 400) {
    const errorData = error.response.data

    if (errorData.message?.includes('Zorla güncelleme gerekli') || errorData.requiresForceUpdate) {
      // 🔥 Force update gerekiyor
      await handleForceUpdateRequired(errorData)
    } else if (errorData.columnIssues || errorData.dataIssues) {
      // Validasyon hataları
      handleValidationErrors(errorData)
    } else {
      // Genel hata
      toast.error(errorData.message || 'Tablo güncellenirken hata oluştu')
    }
  } else {
    // Diğer hatalar
    const errorMessage = extractErrorMessage(error)
    toast.error(`Tablo güncellenirken hata oluştu: ${errorMessage}`)
  }
}

// 🔥 FORCE UPDATE HANDLER - Ana fonksiyon
const handleForceUpdateRequired = async (errorData: any) => {
  const issues = extractIssues(errorData)

  const confirmMessage = [
    '⚠️ Aşağıdaki değişiklikler veri kaybına neden olabilir:',
    '',
    ...issues,
    '',
    '🔍 Sistem tablonuzun içeriğini kontrol etti.',
    'Gerçekten veri kaybı olacaksa bu uyarıyı gösteriyoruz.',
    '',
    '❓ Bu değişiklikleri yapmak istediğinizden emin misiniz?',
  ].join('\n')

  if (confirm(confirmMessage)) {
    await executeForceUpdate()
  }
}

// 🔥 Force update'i gerçekleştir
const executeForceUpdate = async () => {
  try {
    loading.value = true

    const forceUpdateData = buildUpdateData(true) // forceUpdate: true

    console.log('🚀 Sending force update:', forceUpdateData)

    const response = await apiService.updateTable(tableId.value, forceUpdateData)

    if (response) {
      toast.success('Tablo zorla güncellendi!')
      await loadTable()
      hasChanges.value = false
    }
  } catch (forceError: any) {
    console.error('❌ Force update failed:', forceError)
    toast.error(
      'Zorla güncelleme başarısız: ' + (forceError.response?.data?.message || forceError.message),
    )
  } finally {
    loading.value = false
  }
}

// 🔥 Issue'ları çıkar
const extractIssues = (errorData: any): string[] => {
  const issues: string[] = []

  // Column issues'ları topla
  if (errorData.columnIssues) {
    Object.entries(errorData.columnIssues).forEach(([columnName, columnIssues]) => {
      if (Array.isArray(columnIssues)) {
        columnIssues.forEach((issue: string) => {
          if (!issue.startsWith('✅') && !issue.startsWith('ℹ️')) {
            issues.push(`${columnName}: ${issue.replace('⚠️ ', '')}`)
          }
        })
      }
    })
  }

  if (errorData.forceUpdateReasons && Array.isArray(errorData.forceUpdateReasons)) {
    issues.push(...errorData.forceUpdateReasons)
  }

  if (errorData.dataIssues && Array.isArray(errorData.dataIssues)) {
    issues.push(...errorData.dataIssues)
  }

  return issues
}

// 🔥 VALİDASYON HATALARINI KULLANICIYA GÖSTER
const handleValidationErrors = (errorData: any) => {
  const safeChanges: string[] = []
  const warnings: string[] = []
  const errors: string[] = []

  // Column issues'ları kategorize et
  if (errorData.columnIssues) {
    Object.entries(errorData.columnIssues).forEach(([columnName, issues]) => {
      if (Array.isArray(issues)) {
        issues.forEach((issue: string) => {
          if (issue.startsWith('✅')) {
            safeChanges.push(`${columnName}: ${issue.replace('✅ ', '')}`)
          } else if (issue.startsWith('ℹ️')) {
            safeChanges.push(`${columnName}: ${issue.replace('ℹ️ ', '')}`)
          } else if (issue.startsWith('⚠️')) {
            warnings.push(`${columnName}: ${issue.replace('⚠️ ', '')}`)
          } else {
            errors.push(`${columnName}: ${issue}`)
          }
        })
      }
    })
  }

  if (errorData.issues && Array.isArray(errorData.issues)) {
    errors.push(...errorData.issues)
  }

  // Mesajları göster
  if (errors.length > 0) {
    toast.error('Hata: ' + errors.join(', '), { timeout: 7000 })
  }

  if (warnings.length > 0) {
    toast.warning('Uyarı: ' + warnings.join(', '), { timeout: 5000 })
  }

  if (safeChanges.length > 0) {
    toast.info('Güvenli değişiklikler mevcut: ' + safeChanges.join(', '), { timeout: 5000 })
  }
}

// 🔥 Error message çıkarıcı
const extractErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  } else if (error.response?.data?.errors) {
    const errors = error.response.data.errors
    if (Array.isArray(errors)) {
      return errors
        .map((e: any) => Object.values(e))
        .flat()
        .join(', ')
    } else {
      return Object.values(errors).flat().join(', ')
    }
  } else if (error.message) {
    return error.message
  }
  return 'Bilinmeyen hata'
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
  const newColumn = {
    id: null, // ✅ Yeni kolon - ID yok
    columnName: '',
    dataType: ColumnDataType.VARCHAR,
    isRequired: false,
    displayOrder: tableData.value.columns.length + 1,
    defaultValue: '',
  }

  console.log('➕ Adding new column:', newColumn)
  tableData.value.columns.push(newColumn)

  nextTick(() => {
    checkForChanges()
  })
}

const removeColumn = (index: number) => {
  const column = tableData.value.columns[index]
  const columnInfo = column.id
    ? `mevcut kolon "${column.columnName}"`
    : `yeni kolon "${column.columnName}"`

  if (confirm(`${columnInfo} kolonunu silmek istediğinizden emin misiniz?`)) {
    console.log(`🗑️ Removing column at index ${index}:`, {
      columnName: column.columnName,
      columnId: column.id,
      isExisting: !!column.id,
    })

    tableData.value.columns.splice(index, 1)

    // Update display orders
    tableData.value.columns.forEach((col, idx) => {
      col.displayOrder = idx + 1
    })

    console.log(
      `✅ Column removed. Remaining columns:`,
      tableData.value.columns.map((c) => ({ name: c.columnName, id: c.id })),
    )

    checkForChanges()
  }
}

const previewTable = () => {
  previewDialog.value = true
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
    case 1:
      return 'VARCHAR' // case ColumnDataType.VARCHAR
    case 2:
      return 'INT' // case ColumnDataType.INT
    case 3:
      return 'DECIMAL' // case ColumnDataType.DECIMAL
    case 4:
      return 'DATETIME' // case ColumnDataType.DATETIME
    default:
      return 'UNKNOWN'
  }
}

const getColumnTypeColor = (dataType: ColumnDataType): string => {
  switch (dataType) {
    case 1:
      return 'blue' // VARCHAR
    case 2:
      return 'green' // INT
    case 3:
      return 'orange' // DECIMAL
    case 4:
      return 'purple' // DATETIME
    default:
      return 'grey'
  }
}

const getSampleData = (column: any): string => {
  switch (column.dataType) {
    case 1:
      return column.defaultValue || 'Örnek metin' // VARCHAR
    case 2:
      return column.defaultValue || '123' // INT
    case 3:
      return column.defaultValue || '123.45' // DECIMAL
    case 4:
      return column.defaultValue || new Date().toLocaleString('tr-TR') // DATETIME
    default:
      return 'Veri'
  }
}

const getDefaultValueHint = (dataType: number): string => {
  switch (dataType) {
    case 1: // VARCHAR
      return 'Örnek: "Varsayılan metin"'
    case 2: // INT
      return 'Örnek: 0, 100, -50'
    case 3: // DECIMAL
      return 'Örnek: 0.00, 99.99, -10.5'
    case 4: // DATETIME
      return 'Örnek: "2024-01-01" veya GETDATE()'
    default:
      return ''
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
}

.column-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.border-dashed {
  border-style: dashed !important;
}

.text-green {
  color: rgb(76, 175, 80);
}

.text-orange {
  color: rgb(255, 152, 0);
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
