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
                v-model="tableData.name"
                label="Tablo Adı *"
                variant="outlined"
                :rules="[rules.required]"
                class="mb-3"
              ></v-text-field>

              <v-textarea
                v-model="tableData.description"
                label="Açıklama"
                variant="outlined"
                rows="3"
                class="mb-3"
              ></v-textarea>

              <v-alert type="info" variant="tonal" class="mb-3">
                Tablo oluşturduktan sonra kolon yapısını değiştirmek verilerinizi etkileyebilir.
              </v-alert>
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
                            :color="getColumnTypeColor(column.type)"
                            variant="tonal"
                            size="small"
                          >
                            {{ getColumnTypeLabel(column.type) }}
                          </v-chip>
                          <v-btn
                            icon="mdi-delete"
                            size="small"
                            variant="text"
                            color="error"
                            @click="removeColumn(index)"
                          ></v-btn>
                        </div>

                        <v-text-field
                          v-model="column.name"
                          label="Kolon Adı *"
                          variant="outlined"
                          density="compact"
                          :rules="[rules.required]"
                          class="mb-2"
                        ></v-text-field>

                        <v-select
                          v-model="column.type"
                          :items="columnTypes"
                          label="Veri Tipi *"
                          variant="outlined"
                          density="compact"
                          :rules="[rules.required]"
                          class="mb-2"
                        ></v-select>

                        <v-text-field
                          v-if="column.type === 'varchar'"
                          v-model.number="column.maxLength"
                          label="Maksimum Uzunluk"
                          variant="outlined"
                          density="compact"
                          type="number"
                          class="mb-2"
                        ></v-text-field>

                        <v-checkbox
                          v-model="column.isRequired"
                          label="Zorunlu"
                          density="compact"
                          class="mb-1"
                        ></v-checkbox>

                        <v-checkbox
                          v-model="column.isUnique"
                          label="Benzersiz"
                          density="compact"
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
            <v-btn color="grey" variant="outlined" @click="goBack"> İptal </v-btn>
            <v-btn
              color="primary"
              type="submit"
              :loading="loading"
              :disabled="loading || tableData.columns.length === 0"
            >
              {{ isEdit ? 'Güncelle' : 'Oluştur' }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-form>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewDialog" max-width="800">
      <v-card>
        <v-card-title>
          <span class="text-h6">Tablo Önizleme</span>
        </v-card-title>
        <v-card-text>
          <v-table>
            <thead>
              <tr>
                <th v-for="column in tableData.columns" :key="column.name" class="text-left">
                  {{ column.name }}
                  <v-chip
                    :color="getColumnTypeColor(column.type)"
                    variant="tonal"
                    size="x-small"
                    class="ml-2"
                  >
                    {{ getColumnTypeLabel(column.type) }}
                  </v-chip>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td v-for="column in tableData.columns" :key="column.name" class="text--secondary">
                  {{ getSampleData(column.type) }}
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

// Composables
const route = useRoute()
const router = useRouter()
const toast = useToast()

// Reactive Data
const loading = ref(false)
const previewDialog = ref(false)
const tableForm = ref()

const tableData = ref({
  name: '',
  description: '',
  isActive: true,
  columns: [] as Array<{
    name: string
    type: string
    maxLength?: number
    isRequired: boolean
    isUnique: boolean
  }>,
})

// Computed
const isEdit = computed(() => !!route.params.id)
const tableId = computed(() => route.params.id as string)

// Column Types
const columnTypes = [
  { title: 'Metin (VARCHAR)', value: 'varchar' },
  { title: 'Sayı (INT)', value: 'int' },
  { title: 'Ondalık (DECIMAL)', value: 'decimal' },
  { title: 'Tarih/Saat (DATETIME)', value: 'datetime' },
]

// Validation Rules
const rules = {
  required: (value: string) => !!value || 'Bu alan zorunludur',
}

// Methods
const loadTable = async () => {
  if (!isEdit.value) return

  loading.value = true
  try {
    // API call to fetch table data
    // const response = await api.get(`/tables/${tableId.value}`)
    // tableData.value = response.data

    // Mock data for now
    tableData.value = {
      name: 'Müşteri Listesi',
      description: 'Müşteri bilgileri ve iletişim detayları',
      isActive: true,
      columns: [
        {
          name: 'Ad',
          type: 'varchar',
          maxLength: 50,
          isRequired: true,
          isUnique: false,
        },
        {
          name: 'Soyad',
          type: 'varchar',
          maxLength: 50,
          isRequired: true,
          isUnique: false,
        },
        {
          name: 'Email',
          type: 'varchar',
          maxLength: 100,
          isRequired: true,
          isUnique: true,
        },
        {
          name: 'Yaş',
          type: 'int',
          isRequired: false,
          isUnique: false,
        },
      ],
    }
  } catch (error) {
    console.error('Table loading error:', error)
    toast.error('Tablo yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const addColumn = () => {
  tableData.value.columns.push({
    name: '',
    type: 'varchar',
    maxLength: 255,
    isRequired: false,
    isUnique: false,
  })
}

const removeColumn = (index: number) => {
  tableData.value.columns.splice(index, 1)
}

const saveTable = async () => {
  const { valid } = await tableForm.value.validate()
  if (!valid) return

  // Validate columns
  const hasEmptyColumns = tableData.value.columns.some((col) => !col.name || !col.type)
  if (hasEmptyColumns) {
    toast.error('Tüm kolonların adı ve tipi belirtilmelidir')
    return
  }

  loading.value = true
  try {
    if (isEdit.value) {
      // Update existing table
      // await api.put(`/tables/${tableId.value}`, tableData.value)
      toast.success('Tablo başarıyla güncellendi')
    } else {
      // Create new table
      // await api.post('/tables', tableData.value)
      toast.success('Tablo başarıyla oluşturuldu')
    }

    router.push('/tables')
  } catch (error) {
    console.error('Table save error:', error)
    toast.error(`Tablo ${isEdit.value ? 'güncellenirken' : 'oluşturulurken'} hata oluştu`)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/tables')
}

const getColumnTypeColor = (type: string): string => {
  switch (type) {
    case 'varchar':
      return 'blue'
    case 'int':
      return 'green'
    case 'decimal':
      return 'orange'
    case 'datetime':
      return 'purple'
    default:
      return 'grey'
  }
}

const getColumnTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    varchar: 'Metin',
    int: 'Sayı',
    decimal: 'Ondalık',
    datetime: 'Tarih',
  }
  return typeMap[type] || type
}

const getSampleData = (type: string): string => {
  switch (type) {
    case 'varchar':
      return 'Örnek metin'
    case 'int':
      return '123'
    case 'decimal':
      return '123.45'
    case 'datetime':
      return '2024-01-15 10:30'
    default:
      return 'Örnek veri'
  }
}

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
