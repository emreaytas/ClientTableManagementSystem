<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Tablolarım</h1>
            <p class="text-subtitle-1 text--secondary">Oluşturduğunuz tabloları yönetin</p>
          </div>
          <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="createTable">
            Yeni Tablo
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Search and Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Tablo Ara..."
          variant="outlined"
          density="comfortable"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          label="Sırala"
          variant="outlined"
          density="comfortable"
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filterBy"
          :items="filterOptions"
          label="Filtrele"
          variant="outlined"
          density="comfortable"
        ></v-select>
      </v-col>
    </v-row>

    <!-- Tables List -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-data-table
            v-model:search="search"
            :headers="headers"
            :items="filteredTables"
            :loading="loading"
            :items-per-page="itemsPerPage"
            :sort-by="[{ key: sortBy, order: 'desc' }]"
            no-data-text="Henüz tablo oluşturmadınız"
            loading-text="Tablolar yükleniyor..."
          >
            <!-- Table Name Column -->
            <template v-slot:item.name="{ item }">
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-table</v-icon>
                <div>
                  <div class="font-weight-medium">{{ item.name }}</div>
                  <div class="text-caption text--secondary">{{ item.description }}</div>
                </div>
              </div>
            </template>

            <!-- Record Count Column -->
            <template v-slot:item.recordCount="{ item }">
              <v-chip
                :color="getRecordCountColor(item.recordCount || 0)"
                variant="tonal"
                size="small"
              >
                {{ item.recordCount || 0 }} kayıt
              </v-chip>
            </template>

            <!-- Created Date Column -->
            <template v-slot:item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <!-- Status Column -->
            <template v-slot:item.isActive="{ item }">
              <v-chip :color="item.isActive ? 'success' : 'warning'" variant="tonal" size="small">
                {{ item.isActive ? 'Aktif' : 'Pasif' }}
              </v-chip>
            </template>

            <!-- Actions Column -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-1">
                <v-tooltip text="Verileri Görüntüle">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-eye"
                      size="small"
                      variant="text"
                      color="primary"
                      @click="viewTableData(item.id)"
                    ></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Veri Ekle">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-plus"
                      size="small"
                      variant="text"
                      color="success"
                      @click="addTableData(item.id)"
                    ></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Düzenle">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      color="info"
                      @click="editTable(item.id)"
                    ></v-btn>
                  </template>
                </v-tooltip>

                <v-tooltip text="Sil">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-delete"
                      size="small"
                      variant="text"
                      color="error"
                      @click="confirmDelete(item)"
                    ></v-btn>
                  </template>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-delete-alert</v-icon>
          Tablo Silme Onayı
        </v-card-title>
        <v-card-text>
          <p class="text-body-1 mb-3">
            <strong>{{ selectedTable?.name }}</strong> tablosunu silmek istediğinizden emin misiniz?
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
import { apiService, handleApiError, type Table } from '@/services/api'

// Composables
const router = useRouter()
const toast = useToast()

// Reactive Data
const loading = ref(false)
const deleteLoading = ref(false)
const deleteDialog = ref(false)
const search = ref('')
const sortBy = ref('createdAt')
const filterBy = ref('all')
const itemsPerPage = ref(10)
const selectedTable = ref<Table | null>(null)
const tables = ref<Table[]>([])

// Computed
const filteredTables = computed(() => {
  let filtered = tables.value

  if (filterBy.value !== 'all') {
    const isActive = filterBy.value === 'active'
    filtered = filtered.filter((table) => table.isActive === isActive)
  }

  return filtered
})

// Table Headers
const headers = [
  { title: 'Tablo Adı', key: 'name', sortable: true },
  { title: 'Kayıt Sayısı', key: 'recordCount', sortable: true },
  { title: 'Oluşturma Tarihi', key: 'createdAt', sortable: true },
  { title: 'Durum', key: 'isActive', sortable: true },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '200' },
]

// Options
const sortOptions = [
  { title: 'Oluşturma Tarihi', value: 'createdAt' },
  { title: 'Tablo Adı', value: 'name' },
  { title: 'Kayıt Sayısı', value: 'recordCount' },
]

const filterOptions = [
  { title: 'Tümü', value: 'all' },
  { title: 'Aktif', value: 'active' },
  { title: 'Pasif', value: 'inactive' },
]

// Methods
const loadTables = async () => {
  loading.value = true
  try {
    const data = await apiService.getTables()
    tables.value = data
  } catch (error) {
    handleApiError(error, 'Tablolar yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
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

const confirmDelete = (table: Table) => {
  selectedTable.value = table
  deleteDialog.value = true
}

const deleteTable = async () => {
  if (!selectedTable.value) return

  deleteLoading.value = true
  try {
    await apiService.deleteTable(selectedTable.value.id)

    // Remove from local array
    const index = tables.value.findIndex((t) => t.id === selectedTable.value!.id)
    if (index > -1) {
      tables.value.splice(index, 1)
    }

    toast.success('Tablo başarıyla silindi')
    deleteDialog.value = false
    selectedTable.value = null
  } catch (error) {
    handleApiError(error, 'Tablo silinirken hata oluştu')
  } finally {
    deleteLoading.value = false
  }
}

const getRecordCountColor = (count: number): string => {
  if (count === 0) return 'grey'
  if (count < 10) return 'warning'
  if (count < 50) return 'info'
  return 'success'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(() => {
  loadTables()
})
</script>

<style scoped>
.v-data-table {
  background: transparent;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 16px;
  }

  .d-flex.justify-space-between .v-btn {
    align-self: stretch;
  }
}
</style>
