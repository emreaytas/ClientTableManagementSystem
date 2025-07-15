<template>
  <v-container fluid>
    <!-- Welcome Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="pa-6" color="primary" variant="flat">
          <v-card-title class="text-h4 text-white mb-2">
            Hoş Geldiniz, {{ authStore.user?.firstName }}!
          </v-card-title>
          <v-card-subtitle class="text-h6 text-white opacity-90">
            Tablo yönetim sisteminize başlamaya hazır mısınız?
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Stats -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="primary" class="mb-2"> mdi-table </v-icon>
          <v-card-title class="text-h5 mb-1">{{ stats.totalTables }}</v-card-title>
          <v-card-subtitle>Toplam Tablo</v-card-subtitle>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="success" class="mb-2"> mdi-database </v-icon>
          <v-card-title class="text-h5 mb-1">{{ stats.totalRecords }}</v-card-title>
          <v-card-subtitle>Toplam Kayıt</v-card-subtitle>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="warning" class="mb-2"> mdi-clock </v-icon>
          <v-card-title class="text-h5 mb-1">{{ stats.recentActivity }}</v-card-title>
          <v-card-subtitle>Son Aktivite</v-card-subtitle>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 text-center" elevation="2">
          <v-icon size="48" color="info" class="mb-2"> mdi-chart-line </v-icon>
          <v-card-title class="text-h5 mb-1">{{ stats.thisMonth }}</v-card-title>
          <v-card-subtitle>Bu Ay</v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="pa-6">
          <v-card-title class="text-h5 mb-4">
            <v-icon left class="mr-2">mdi-lightning-bolt</v-icon>
            Hızlı İşlemler
          </v-card-title>

          <v-row>
            <v-col cols="12" sm="6" md="4">
              <v-btn
                color="primary"
                size="large"
                block
                prepend-icon="mdi-plus"
                @click="$router.push('/tables/new')"
              >
                Yeni Tablo Oluştur
              </v-btn>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-btn
                color="secondary"
                size="large"
                block
                prepend-icon="mdi-table-search"
                @click="$router.push('/tables')"
              >
                Tablolarımı Görüntüle
              </v-btn>
            </v-col>

            <v-col cols="12" sm="6" md="4">
              <v-btn
                color="success"
                size="large"
                block
                prepend-icon="mdi-database-plus"
                @click="showDataDialog = true"
              >
                Veri Ekle
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Tables -->
    <v-row>
      <v-col cols="12" lg="8">
        <v-card class="pa-6">
          <v-card-title class="text-h5 mb-4">
            <v-icon left class="mr-2">mdi-history</v-icon>
            Son Kullanılan Tablolar
          </v-card-title>

          <v-data-table
            :headers="tableHeaders"
            :items="recentTables"
            :loading="loading"
            no-data-text="Henüz tablo oluşturulmamış"
            loading-text="Tablolar yükleniyor..."
            class="elevation-1"
          >
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-eye"
                size="small"
                color="primary"
                @click="viewTable(item.id)"
                class="mr-2"
              ></v-btn>
              <v-btn
                icon="mdi-pencil"
                size="small"
                color="secondary"
                @click="editTable(item.id)"
                class="mr-2"
              ></v-btn>
              <v-btn
                icon="mdi-database"
                size="small"
                color="success"
                @click="viewData(item.id)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" lg="4">
        <v-card class="pa-6">
          <v-card-title class="text-h5 mb-4">
            <v-icon left class="mr-2">mdi-information</v-icon>
            Sistem Bilgileri
          </v-card-title>

          <v-list>
            <v-list-item>
              <v-list-item-title>Hesap Türü</v-list-item-title>
              <v-list-item-subtitle>Standart Kullanıcı</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Üyelik Tarihi</v-list-item-title>
              <v-list-item-subtitle>{{
                formatDate(authStore.user?.createdAt)
              }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>Son Giriş</v-list-item-title>
              <v-list-item-subtitle>Şimdi</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>E-posta Durumu</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  :color="authStore.user?.emailConfirmed ? 'success' : 'warning'"
                  size="small"
                  variant="flat"
                >
                  {{ authStore.user?.emailConfirmed ? 'Doğrulandı' : 'Beklemede' }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add Data Dialog -->
    <v-dialog v-model="showDataDialog" max-width="500">
      <v-card>
        <v-card-title>Hangi Tabloya Veri Eklemek İstiyorsunuz?</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedTable"
            :items="userTables"
            item-title="name"
            item-value="id"
            label="Tablo Seçin"
            prepend-inner-icon="mdi-table"
            variant="outlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="showDataDialog = false"> İptal </v-btn>
          <v-btn color="primary" @click="navigateToData" :disabled="!selectedTable">
            Devam Et
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Reactive Data
const loading = ref(false)
const showDataDialog = ref(false)
const selectedTable = ref('')

const stats = ref({
  totalTables: 0,
  totalRecords: 0,
  recentActivity: '2 saat önce',
  thisMonth: '+3',
})

const recentTables = ref([
  {
    id: '1',
    name: 'Müşteri Listesi',
    description: 'Müşteri bilgileri tablosu',
    recordCount: 150,
    lastUpdated: '2024-01-15',
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    name: 'Ürün Envanteri',
    description: 'Ürün stok bilgileri',
    recordCount: 89,
    lastUpdated: '2024-01-14',
    createdAt: '2024-01-08',
  },
])

const userTables = ref([
  { id: '1', name: 'Müşteri Listesi' },
  { id: '2', name: 'Ürün Envanteri' },
  { id: '3', name: 'Satış Raporu' },
])

// Table Headers
const tableHeaders = [
  { title: 'Tablo Adı', key: 'name', sortable: true },
  { title: 'Açıklama', key: 'description', sortable: false },
  { title: 'Kayıt Sayısı', key: 'recordCount', sortable: true },
  { title: 'Son Güncelleme', key: 'lastUpdated', sortable: true },
  { title: 'İşlemler', key: 'actions', sortable: false, width: '150px' },
]

// Methods
const loadDashboardData = async () => {
  loading.value = true
  try {
    // API çağrıları burada yapılacak
    // const tablesResponse = await tablesApi.getUserTables()
    // const statsResponse = await dashboardApi.getStats()

    // Geçici veri
    stats.value = {
      totalTables: recentTables.value.length,
      totalRecords: recentTables.value.reduce((sum, table) => sum + table.recordCount, 0),
      recentActivity: '2 saat önce',
      thisMonth: '+3',
    }

    toast.success('Dashboard yüklendi')
  } catch (error: any) {
    console.error('Dashboard load error:', error)
    toast.error('Dashboard yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const viewTable = (tableId: string) => {
  router.push(`/tables/${tableId}`)
}

const editTable = (tableId: string) => {
  router.push(`/tables/${tableId}/edit`)
}

const viewData = (tableId: string) => {
  router.push(`/tables/${tableId}/data`)
}

const navigateToData = () => {
  if (selectedTable.value) {
    router.push(`/tables/${selectedTable.value}/data`)
    showDataDialog.value = false
    selectedTable.value = ''
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Bilinmiyor'

  try {
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString))
  } catch {
    return 'Bilinmiyor'
  }
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.v-card {
  transition: transform 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-2px);
}

.v-data-table :deep(th) {
  background-color: #f5f5f5 !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .v-container {
    padding: 8px;
  }
}
</style>
