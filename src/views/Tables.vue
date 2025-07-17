<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h4 font-weight-bold">Tablolarım</h1>
            <p class="text-subtitle-1 text--secondary">
              Oluşturduğunuz tabloları görüntüleyin ve yönetin
            </p>
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="createTable" class="elevation-2">
            Yeni Tablo
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filters and Search -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Tablo Ara..."
              variant="outlined"
              density="compact"
              hide-details
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              label="Sıralama"
              variant="outlined"
              density="compact"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="sortOrder"
              :items="sortOrderOptions"
              label="Sıra"
              variant="outlined"
              density="compact"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-btn
              color="primary"
              variant="outlined"
              @click="refreshTables"
              :loading="loading"
              block
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tables List -->
    <v-card>
      <v-card-title>
        <v-icon class="mr-2">mdi-table-multiple</v-icon>
        Tablo Listesi
        <v-spacer></v-spacer>
        <v-chip color="primary" variant="tonal"> {{ filteredTables.length }} tablo </v-chip>
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="text-h6 mt-4">Tablolar yükleniyor...</p>
        </div>

        <div v-else-if="filteredTables.length === 0" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-table-off</v-icon>
          <p class="text-h6 text--secondary mt-2">
            {{ search ? 'Arama kriterinize uygun tablo bulunamadı' : 'Henüz tablo oluşturmadınız' }}
          </p>
          <p class="text-body-2 text--secondary">
            {{
              search
                ? 'Farklı anahtar kelimeler deneyin'
                : 'İlk tablonuzu oluşturmak için butona tıklayın'
            }}
          </p>
          <v-btn
            v-if="!search"
            color="primary"
            class="mt-4"
            prepend-icon="mdi-plus"
            @click="createTable"
          >
            Yeni Tablo Oluştur
          </v-btn>
        </div>

        <v-row v-else>
          <v-col v-for="table in paginatedTables" :key="table.id" cols="12" md="6" lg="4">
            <v-card class="table-card" elevation="2">
              <v-card-title class="pb-2">
                <div class="d-flex align-center">
                  <v-avatar color="primary" size="40" class="mr-3">
                    <v-icon color="white">mdi-table</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-h6 font-weight-bold">{{ table.tableName }}</div>
                    <div class="text-caption text-grey">
                      {{ formatDate(table.createdAt) }}
                    </div>
                  </div>
                </div>
              </v-card-title>

              <v-card-text>
                <p class="text-body-2 mb-3" style="min-height: 40px">
                  {{ table.description || 'Açıklama bulunmuyor' }}
                </p>

                <div class="mb-3">
                  <v-chip
                    :color="getColumnCountColor(table.columns.length)"
                    variant="tonal"
                    size="small"
                    class="mr-2"
                  >
                    <v-icon start>mdi-table-column</v-icon>
                    {{ table.columns.length }} kolon
                  </v-chip>
                </div>

                <!-- Column Details -->
                <div class="mb-3">
                  <v-expansion-panels variant="accordion" class="mb-2">
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        <div class="d-flex align-center">
                          <v-icon class="mr-2">mdi-table-headers-eye</v-icon>
                          Kolon Detayları
                        </div>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-list density="compact">
                          <v-list-item
                            v-for="column in table.columns"
                            :key="column.id"
                            class="px-0"
                          >
                            <template v-slot:prepend>
                              <v-chip
                                :color="getDataTypeColor(column.dataType)"
                                variant="tonal"
                                size="x-small"
                                class="mr-2"
                              >
                                {{ getDataTypeLabel(column.dataType) }}
                              </v-chip>
                            </template>
                            <v-list-item-title class="text-body-2">
                              {{ column.columnName }}
                              <v-icon
                                v-if="column.isRequired"
                                size="small"
                                color="red"
                                class="ml-1"
                              >
                                mdi-asterisk
                              </v-icon>
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-caption">
                              {{ column.defaultValue ? `Varsayılan: ${column.defaultValue}` : '' }}
                            </v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </div>
              </v-card-text>

              <v-card-actions>
                <!-- Action buttons with tooltips -->
                <div class="d-flex ga-1">
                  <!-- View Data Button -->
                  <v-tooltip text="Verileri Görüntüle">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-database-eye"
                        size="small"
                        color="info"
                        variant="text"
                        @click="viewTableData(table.id)"
                      ></v-btn>
                    </template>
                  </v-tooltip>

                  <!-- Edit Button -->
                  <v-tooltip text="Düzenle">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-pencil"
                        size="small"
                        color="primary"
                        variant="text"
                        @click="editTable(table.id)"
                      ></v-btn>
                    </template>
                  </v-tooltip>

                  <!-- Delete Button -->
                  <v-tooltip text="Sil">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-delete"
                        size="small"
                        color="error"
                        variant="text"
                        @click="confirmDelete(table)"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </div>

                <v-spacer></v-spacer>

                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                      v-bind="props"
                    ></v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="addTableData(table.id)">
                      <template v-slot:prepend>
                        <v-icon>mdi-plus</v-icon>
                      </template>
                      <v-list-item-title>Veri Ekle</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="duplicateTable(table.id)">
                      <template v-slot:prepend>
                        <v-icon>mdi-content-copy</v-icon>
                      </template>
                      <v-list-item-title>Kopyala</v-list-item-title>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-item @click="confirmDelete(table)" class="text-error">
                      <template v-slot:prepend>
                        <v-icon color="error">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title>Sil</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Pagination -->
        <div v-if="filteredTables.length > itemsPerPage" class="mt-6">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            @update:model-value="scrollToTop"
          ></v-pagination>
        </div>
      </v-card-text>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title>
          <span class="text-h6">Tablo Sil</span>
        </v-card-title>
        <v-card-text>
          <p>
            <strong>{{ selectedTable?.tableName }}</strong> tablosunu silmek istediğinizden emin
            misiniz?
          </p>
          <v-alert type="warning" variant="tonal" class="mt-3">
            Bu işlem geri alınamaz ve tablodaki tüm veriler silinecektir.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="deleteDialog = false"> İptal </v-btn>
          <v-btn color="error" variant="elevated" :loading="deleteLoading" @click="deleteTable">
            Sil
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { apiService } from '@/services/api'

// Interfaces matching API response
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
  dataType: number // 0=VARCHAR, 1=INT, 2=DECIMAL, 3=DATETIME
  isRequired: boolean
  displayOrder: number
  defaultValue: string
}

// Composables
const router = useRouter()
const toast = useToast()

// Reactive Data
const loading = ref(false)
const deleteLoading = ref(false)
const deleteDialog = ref(false)
const search = ref('')
const sortBy = ref('createdAt')
const sortOrder = ref('desc')
const itemsPerPage = ref(9)
const currentPage = ref(1)
const selectedTable = ref<ApiTable | null>(null)
const tables = ref<ApiTable[]>([])

// Computed
const activeTables = computed(() => tables.value.filter((table) => table.columns.length > 0))

const totalColumns = computed(() =>
  tables.value.reduce((total, table) => total + table.columns.length, 0),
)

const recentTablesCount = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return tables.value.filter((table) => {
    const createdDate = new Date(table.createdAt)
    return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
  }).length
})

const filteredTables = computed(() => {
  let filtered = [...tables.value]

  // Search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(
      (table) =>
        table.tableName.toLowerCase().includes(searchLower) ||
        table.description?.toLowerCase().includes(searchLower) ||
        table.columns.some((col) => col.columnName.toLowerCase().includes(searchLower)),
    )
  }

  // Sort
  filtered.sort((a, b) => {
    let valueA: any, valueB: any

    switch (sortBy.value) {
      case 'tableName':
        valueA = a.tableName.toLowerCase()
        valueB = b.tableName.toLowerCase()
        break
      case 'columnCount':
        valueA = a.columns.length
        valueB = b.columns.length
        break
      case 'createdAt':
      default:
        valueA = new Date(a.createdAt)
        valueB = new Date(b.createdAt)
        break
    }

    if (sortOrder.value === 'desc') {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
    } else {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
    }
  })

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredTables.value.length / itemsPerPage.value))

const paginatedTables = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTables.value.slice(start, end)
})

// Options
const sortOptions = [
  { title: 'Oluşturma Tarihi', value: 'createdAt' },
  { title: 'Tablo Adı', value: 'tableName' },
  { title: 'Kolon Sayısı', value: 'columnCount' },
]

const sortOrderOptions = [
  { title: 'Azalan', value: 'desc' },
  { title: 'Artan', value: 'asc' },
]

// Methods
const loadTables = async () => {
  loading.value = true
  try {
    const response = await apiService.getTables()
    tables.value = response as unknown as ApiTable[]
  } catch (error: any) {
    console.error('Tables loading error:', error)
    toast.error(
      'Tablolar yüklenirken hata oluştu: ' + (error.response?.data?.message || error.message),
    )
  } finally {
    loading.value = false
  }
}

const refreshTables = async () => {
  await loadTables()
  toast.success('Tablolar güncellendi')
}

const createTable = () => {
  router.push('/tables/new')
}

const editTable = (id: number) => {
  router.push(`/tables/${id}/edit`)
}

const viewTableData = (id: number) => {
  router.push(`/tables/${id}/data`)
}

const addTableData = (id: number) => {
  router.push(`/tables/${id}/data?action=add`)
}

const duplicateTable = (id: number) => {
  // TODO: Implement table duplication
  toast.info('Tablo kopyalama özelliği yakında eklenecek')
}

const confirmDelete = (table: ApiTable) => {
  selectedTable.value = table
  deleteDialog.value = true
}

const deleteTable = async () => {
  if (!selectedTable.value) return

  deleteLoading.value = true
  try {
    await apiService.deleteTable(selectedTable.value.id)
    tables.value = tables.value.filter((t) => t.id !== selectedTable.value!.id)
    toast.success('Tablo başarıyla silindi')
    deleteDialog.value = false
  } catch (error: any) {
    console.error('Table deletion error:', error)
    toast.error('Tablo silinirken hata oluştu: ' + (error.response?.data?.message || error.message))
  } finally {
    deleteLoading.value = false
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getDataTypeLabel = (dataType: number): string => {
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
      return 'blue' // VARCHAR
    case 1:
      return 'green' // INT
    case 2:
      return 'orange' // DECIMAL
    case 3:
      return 'purple' // DATETIME
    default:
      return 'grey'
  }
}

const getColumnCountColor = (count: number): string => {
  if (count <= 3) return 'orange'
  if (count <= 6) return 'green'
  return 'blue'
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Initialize
onMounted(() => {
  loadTables()
})
</script>

<style scoped>
.table-card {
  transition: all 0.3s ease;
  height: 100%;
}

.table-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.v-expansion-panel {
  box-shadow: none !important;
}

.v-expansion-panel-text :deep(.v-expansion-panel-text__wrapper) {
  padding: 8px 0;
}

/* Action buttons styling */
.d-flex.ga-1 {
  gap: 4px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 16px;
  }

  .d-flex.justify-space-between .v-btn {
    width: 100%;
  }
}
</style>
