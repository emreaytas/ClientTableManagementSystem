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

              <!-- 🔥 YENİ: Force Update Checkbox -->
              <v-checkbox
                v-if="isEdit && hasChanges"
                v-model="forceUpdateEnabled"
                color="warning"
                class="mb-3"
                @update:model-value="checkForChanges"
              >
                <template v-slot:label>
                  <div class="d-flex align-center">
                    <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
                    <span class="text-body-2">
                      <strong>Zorla Güncelleme</strong>
                    </span>
                  </div>
                </template>
              </v-checkbox>

              <!-- Force Update Warning -->
              <v-alert
                v-if="isEdit && hasChanges && forceUpdateEnabled"
                type="warning"
                variant="tonal"
                class="mb-3"
                icon="mdi-alert-triangle"
              >
                <v-alert-title>⚠️ Veri Kaybı Riski!</v-alert-title>
                <div class="mt-2">
                  <p class="text-body-2">
                    <strong>Bu seçenek etkinleştirildiğinde:</strong>
                  </p>
                  <ul class="mt-2 ml-4 text-body-2">
                    <li>Veri doğrulama kontrolleri atlanacak</li>
                    <li>Kolon silme işlemleri doğrudan yapılacak</li>
                    <li>Veri tipi değişiklikleri zorla uygulanacak</li>
                    <li><strong>VERİ KAYBI OLABİLİR!</strong></li>
                  </ul>
                  <p class="mt-2 text-body-2">
                    <strong>🛡️ Öneri:</strong> Devam etmeden önce tablonuzun yedeğini alın.
                  </p>
                </div>
              </v-alert>

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
                :color="getUpdateButtonColor()"
                type="submit"
                :loading="loading"
                :disabled="
                  loading ||
                  tableData.columns.length === 0 ||
                  !isFormValid ||
                  (isEdit && !hasChanges)
                "
                :prepend-icon="getUpdateButtonIcon()"
              >
                {{ getUpdateButtonText() }}
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

// 🔥 YENİ: Force Update Checkbox
const forceUpdateEnabled = ref(false)

// Table data structure matching API expectations
const tableData = ref({
  tableName: '',
  description: '',
  columns: [] as Array<{
    id?: number | null
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

// 🔥 YENİ: Button Appearance Helper Functions
const getUpdateButtonColor = () => {
  if (!isEdit.value) return 'primary'
  if (!hasChanges.value) return 'primary'
  return forceUpdateEnabled.value ? 'error' : 'success'
}

const getUpdateButtonIcon = () => {
  if (!isEdit.value) return 'mdi-plus'
  if (!hasChanges.value) return 'mdi-check'
  return forceUpdateEnabled.value ? 'mdi-alert' : 'mdi-content-save'
}

const getUpdateButtonText = () => {
  if (!isEdit.value) return 'Oluştur'
  if (!hasChanges.value) return 'Güncel'
  return forceUpdateEnabled.value ? 'Zorla Güncelle' : 'Güncelle'
}

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
          id: col.id,
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
    forceUpdateEnabled.value = false // Reset force update
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

  // 🔥 Force Update Confirmation
  if (isEdit.value && forceUpdateEnabled.value) {
    const confirmed = confirm(
      '⚠️ ZORLA GÜNCELLEME UYARISI\n\n' +
        'Bu seçenek etkinleştirildiğinde:\n' +
        '• Veri doğrulama kontrolleri atlanacak\n' +
        '• Kolon silme işlemleri doğrudan yapılacak\n' +
        '• Veri tipi değişiklikleri zorla uygulanacak\n' +
        '• VERİ KAYBI OLABİLİR!\n\n' +
        'Devam etmek istediğinizden emin misiniz?',
    )

    if (!confirmed) {
      toast.info('İşlem iptal edildi')
      return
    }
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
    // 🔥 Normal hata yönetimi - Force Update aktifken hata göstermek
    if (forceUpdateEnabled.value) {
      toast.error(
        'Zorla güncelleme bile başarısız oldu: ' + (error.response?.data?.message || error.message),
      )
    } else {
      toast.error('Güncelleme başarısız: ' + (error.response?.data?.message || error.message))
    }
  } finally {
    loading.value = false
  }
}

// 🔥 Tablo güncelleme işlemini ayrı fonksiyon
const performTableUpdate = async () => {
  const updateData = buildUpdateData(forceUpdateEnabled.value) // Force update checkbox'ına göre

  console.log('🚀 Sending table update:', updateData)
  console.log('🔥 Force update enabled:', forceUpdateEnabled.value)

  const response = await apiService.updateTable(tableId.value, updateData)

  // ✅ Başarılı güncelleme
  if (forceUpdateEnabled.value) {
    toast.success('Tablo zorla güncellendi! Bazı veriler kaybolmuş olabilir.')
  } else {
    toast.success('Tablo başarıyla güncellendi!')
  }

  // Güvenli değişiklikleri kullanıcıya göster
  handleSuccessfulUpdate(response)

  await loadTable()
  hasChanges.value = false
  forceUpdateEnabled.value = false // Reset after successful update
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
        forceUpdate: forceUpdate, // 🔥 Checkbox değerine göre
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
    forceUpdateEnabled.value = false // Reset force update
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

// 🔥 GELİŞTİRİLMİŞ KOLON SİLME İŞLEMİ
const removeColumn = (index: number) => {
  const column = tableData.value.columns[index]
  const isExistingColumn = !!column.id && column.id > 0

  let confirmMessage = ''

  if (isExistingColumn) {
    // Mevcut kolon - veri kaybı uyarısı
    confirmMessage = [
      `⚠️ "${column.columnName}" kolonunu silmek istediğinizden emin misiniz?`,
      '',
      '🚨 DİKKAT: Bu işlem GERİ ALINAMAZ!',
      '',
      '📊 Bu kolon silindiğinde:',
      '• Kolondaki TÜM veriler kaybolacak',
      '• Bu işlem geri alınamayacak',
      '• Tablo yapısı değişecek',
      '',
      '💡 Öneriler:',
      '• Devam etmeden önce veri yedeği alın',
      '• Kolonun gerçekten gereksiz olduğundan emin olun',
      '• Force Update checkboxını işaretlemeyi unutmayın',
      '',
      '❓ Yine de silmek istiyorsanız "Tamam" butonuna basın.',
    ].join('\n')
  } else {
    // Yeni kolon - güvenli silme
    confirmMessage = `"${column.columnName}" adlı yeni kolonu silmek istediğinizden emin misiniz?\n\n(Bu kolon henüz kaydedilmediği için veri kaybı olmayacak)`
  }

  if (confirm(confirmMessage)) {
    console.log(`🗑️ Removing column at index ${index}:`, {
      columnName: column.columnName,
      columnId: column.id,
      isExisting: isExistingColumn,
    })

    tableData.value.columns.splice(index, 1)

    // Display order'ları güncelle
    tableData.value.columns.forEach((col, idx) => {
      col.displayOrder = idx + 1
    })

    console.log(
      `✅ Column removed. Remaining columns:`,
      tableData.value.columns.map((c) => ({ name: c.columnName, id: c.id })),
    )

    if (isExistingColumn) {
      toast.warning(
        `"${column.columnName}" kolonu işaretlendi. Güncelleme yapmak için "Force Update" checkbox'ını işaretlemeyi unutmayın!`,
      )
    } else {
      toast.info(`"${column.columnName}" kolonu silindi.`)
    }

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
      return 'VARCHAR'
    case 2:
      return 'INT'
    case 3:
      return 'DECIMAL'
    case 4:
      return 'DATETIME'
    default:
      return 'UNKNOWN'
  }
}

const getColumnTypeColor = (dataType: ColumnDataType): string => {
  switch (dataType) {
    case 1:
      return 'blue'
    case 2:
      return 'green'
    case 3:
      return 'orange'
    case 4:
      return 'purple'
    default:
      return 'grey'
  }
}

const getSampleData = (column: any): string => {
  switch (column.dataType) {
    case 1:
      return column.defaultValue || 'Örnek metin'
    case 2:
      return column.defaultValue || '123'
    case 3:
      return column.defaultValue || '123.45'
    case 4:
      return column.defaultValue || new Date().toLocaleString('tr-TR')
    default:
      return 'Veri'
  }
}

const getDefaultValueHint = (dataType: number): string => {
  switch (dataType) {
    case 1:
      return 'Örnek: "Varsayılan metin"'
    case 2:
      return 'Örnek: 0, 100, -50'
    case 3:
      return 'Örnek: 0.00, 99.99, -10.5'
    case 4:
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

.v-dialog .v-card {
  border-radius: 12px;
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
