<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-6">
          <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-3"></v-btn>
          <div class="flex-grow-1">
            <h1 class="text-h4 font-weight-bold">{{ tableInfo.name }}</h1>
            <p class="text-subtitle-1 text--secondary">
              {{ tableInfo.description }}
            </p>
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddDialog"> Veri Ekle </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Search and Actions -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Verilerde Ara..."
          variant="outlined"
          density="comfortable"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <div class="d-flex justify-end gap-2">
          <v-btn variant="outlined" prepend-icon="mdi-download" @click="exportData">
            Dışa Aktar
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-upload" @click="importData">
            İçe Aktar
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Data Table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-data-table
            v-model:search="search"
            :headers="dynamicHeaders"
            :items="tableData"
            :loading="loading"
            :items-per-page="itemsPerPage"
            no-data-text="Bu tabloda henüz veri bulunmuyor"
            loading-text="Veriler yükleniyor..."
          >
            <!-- Dynamic content for each column -->
            <template
              v-for="column in tableInfo.columns"
              :key="column.name"
              v-slot:[`item.${column.name}`]="{ item }"
            >
              <div v-if="column.type === 'datetime'">
                {{ formatDateTime(item[column.name]) }}
              </div>
              <div v-else-if="column.type === 'decimal'">
                {{ formatNumber(item[column.name]) }}
              </div>
              <div v-else>
                {{ item[column.name] }}
              </div>
            </template>

            <!-- Actions Column -->
            <template v-slot:item.actions="{ item }">
              <div class="d-flex gap-1">
                <v-tooltip text="Düzenle">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editItem(item)"
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

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dataDialog" max-width="600" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h6">
            {{ editingItem ? 'Veri Düzenle' : 'Yeni Veri Ekle' }}
          </span>
        </v-card-title>
        <v-card-text>
          <v-form ref="dataForm">
            <v-row>
              <v-col
                v-for="column in tableInfo.columns"
                :key="column.name"
                cols="12"
                :md="column.type === 'varchar' && column.maxLength > 100 ? 12 : 6"
              >
                <!-- Text Input -->
                <v-text-field
                  v-if="column.type === 'varchar'"
                  v-model="formData[column.name]"
                  :label="`${column.name}${column.isRequired ? ' *' : ''}`"
                  variant="outlined"
                  :rules="column.isRequired ? [rules.required] : []"
                  :maxlength="column.maxLength"
                ></v-text-field>

                <!-- Number Input -->
                <v-text-field
                  v-else-if="column.type === 'int'"
                  v-model.number="formData[column.name]"
                  :label="`${column.name}${column.isRequired ? ' *' : ''}`"
                  variant="outlined"
                  type="number"
                  :rules="column.isRequired ? [rules.required] : []"
                ></v-text-field>

                <!-- Decimal Input -->
                <v-text-field
                  v-else-if="column.type === 'decimal'"
                  v-model.number="formData[column.name]"
                  :label="`${column.name}${column.isRequired ? ' *' : ''}`"
                  variant="outlined"
                  type="number"
                  step="0.01"
                  :rules="column.isRequired ? [rules.required] : []"
                ></v-text-field>

                <!-- DateTime Input -->
                <v-text-field
                  v-else-if="column.type === 'datetime'"
                  v-model="formData[column.name]"
                  :label="`${column.name}${column.isRequired ? ' *' : ''}`"
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
          <v-btn color="primary" :loading="saveLoading" @click="saveData">
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
const search = ref('')
const itemsPerPage = ref(15)
const editingItem = ref<any>(null)
const selectedItem = ref<any>(null)
const dataForm = ref()

const tableInfo = ref({
  id: '',
  name: '',
  description: '',
  columns: [] as Array<{
    name: string
    type: string
    maxLength?: number
    isRequired: boolean
    isUnique: boolean
  }>,
})

const tableData = ref<any[]>([])
const formData = ref<Record<string, any>>({})

// Computed
const tableId = computed(() => route.params.id as string)

const dynamicHeaders = computed(() => {
  const headers = tableInfo.value.columns.map((column) => ({
    title: column.name,
    key: column.name,
    sortable: true,
  }))

  headers.push({
    title: 'İşlemler',
    key: 'actions',
    sortable: false,
  })

  return headers
})

// Validation Rules
const rules = {
  required: (value: any) => !!value || 'Bu alan zorunludur',
}

// Methods
const loadTableInfo = async () => {
  try {
    // API call to fetch table structure
    // const response = await api.get(`/tables/${tableId.value}`)
    // tableInfo.value = response.data

    // Mock data
    tableInfo.value = {
      id: tableId.value,
      name: 'Müşteri Listesi',
      description: 'Müşteri bilgileri ve iletişim detayları',
      columns: [
        { name: 'Ad', type: 'varchar', maxLength: 50, isRequired: true, isUnique: false },
        { name: 'Soyad', type: 'varchar', maxLength: 50, isRequired: true, isUnique: false },
        { name: 'Email', type: 'varchar', maxLength: 100, isRequired: true, isUnique: true },
        { name: 'Yaş', type: 'int', isRequired: false, isUnique: false },
        { name: 'Kayıt Tarihi', type: 'datetime', isRequired: true, isUnique: false },
      ],
    }
  } catch (error) {
    console.error('Table info loading error:', error)
    toast.error('Tablo bilgileri yüklenirken hata oluştu')
  }
}

const loadTableData = async () => {
  loading.value = true
  try {
    // API call to fetch table data
    // const response = await api.get(`/tables/${tableId.value}/data`)
    // tableData.value = response.data

    // Mock data
    tableData.value = [
      {
        id: 1,
        Ad: 'Ahmet',
        Soyad: 'Yılmaz',
        Email: 'ahmet@example.com',
        Yaş: 35,
        'Kayıt Tarihi': '2024-01-15T10:30:00Z',
      },
      {
        id: 2,
        Ad: 'Fatma',
        Soyad: 'Kaya',
        Email: 'fatma@example.com',
        Yaş: 28,
        'Kayıt Tarihi': '2024-01-14T14:20:00Z',
      },
    ]
  } catch (error) {
    console.error('Table data loading error:', error)
    toast.error('Tablo verileri yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  editingItem.value = null
  formData.value = {}

  // Initialize form data with default values
  tableInfo.value.columns.forEach((column) => {
    formData.value[column.name] =
      column.type === 'datetime' ? new Date().toISOString().slice(0, 16) : ''
  })

  dataDialog.value = true
}

const editItem = (item: any) => {
  editingItem.value = item
  formData.value = { ...item }

  // Format datetime for input
  tableInfo.value.columns.forEach((column) => {
    if (column.type === 'datetime' && formData.value[column.name]) {
      formData.value[column.name] = new Date(formData.value[column.name]).toISOString().slice(0, 16)
    }
  })

  dataDialog.value = true
}

const closeDataDialog = () => {
  dataDialog.value = false
  editingItem.value = null
  formData.value = {}
  dataForm.value?.reset()
}

const saveData = async () => {
  const { valid } = await dataForm.value.validate()
  if (!valid) return

  saveLoading.value = true
  try {
    if (editingItem.value) {
      // Update existing data
      // await api.put(`/tables/${tableId.value}/data/${editingItem.value.id}`, formData.value)

      const index = tableData.value.findIndex((item) => item.id === editingItem.value.id)
      if (index > -1) {
        tableData.value[index] = { ...editingItem.value, ...formData.value }
      }

      toast.success('Veri başarıyla güncellendi')
    } else {
      // Add new data
      // const response = await api.post(`/tables/${tableId.value}/data`, formData.value)

      const newItem = {
        id: tableData.value.length + 1,
        ...formData.value,
      }
      tableData.value.push(newItem)

      toast.success('Veri başarıyla eklendi')
    }

    closeDataDialog()
  } catch (error) {
    console.error('Data save error:', error)
    toast.error(`Veri ${editingItem.value ? 'güncellenirken' : 'eklenirken'} hata oluştu`)
  } finally {
    saveLoading.value = false
  }
}

const confirmDelete = (item: any) => {
  selectedItem.value = item
  deleteDialog.value = true
}

const deleteData = async () => {
  if (!selectedItem.value) return

  deleteLoading.value = true
  try {
    // API call to delete data
    // await api.delete(`/tables/${tableId.value}/data/${selectedItem.value.id}`)

    const index = tableData.value.findIndex((item) => item.id === selectedItem.value.id)
    if (index > -1) {
      tableData.value.splice(index, 1)
    }

    toast.success('Veri başarıyla silindi')
    deleteDialog.value = false
    selectedItem.value = null
  } catch (error) {
    console.error('Data deletion error:', error)
    toast.error('Veri silinirken hata oluştu')
  } finally {
    deleteLoading.value = false
  }
}

const exportData = () => {
  // Export functionality
  toast.info('Dışa aktarma özelliği yakında eklenecek')
}

const importData = () => {
  // Import functionality
  toast.info('İçe aktarma özelliği yakında eklenecek')
}

const goBack = () => {
  router.push('/tables')
}

const formatDateTime = (value: string) => {
  if (!value) return ''
  return new Date(value).toLocaleString('tr-TR')
}

const formatNumber = (value: number) => {
  if (value === null || value === undefined) return ''
  return new Intl.NumberFormat('tr-TR').format(value)
}

onMounted(async () => {
  await loadTableInfo()
  await loadTableData()
})
</script>

<style scoped>
/* Responsive adjustments */
@media (max-width: 600px) {
  .d-flex.justify-end {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
