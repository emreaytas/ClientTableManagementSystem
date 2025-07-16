<template>
  <v-container fluid>
    <!-- Main Content -->
    <v-row>
      <!-- My Tables Section -->
      <v-col cols="12" lg="8">
        <v-card elevation="4">
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-table</v-icon>
              <span>Tablolarım</span>
            </div>
            <div>
              <v-btn
                color="primary"
                size="small"
                prepend-icon="mdi-plus"
                @click="createTable"
                class="mr-2"
              >
                Yeni Tablo
              </v-btn>
              <v-btn color="secondary" size="small" prepend-icon="mdi-eye" @click="viewAllTables">
                Tümünü Gör
              </v-btn>
            </div>
          </v-card-title>
          <v-divider></v-divider>

          <v-card-text v-if="loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <div class="mt-3">Tablolar yükleniyor...</div>
          </v-card-text>

          <v-card-text v-else-if="recentTables.length === 0" class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
            <h3 class="text-h6 text-grey mb-3">Henüz tablo oluşturmadınız</h3>
            <p class="text-body-2 text-grey mb-4">
              İlk tablonuzu oluşturarak veri yönetimine başlayın
            </p>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="createTable">
              İlk Tablonuzu Oluşturun
            </v-btn>
          </v-card-text>

          <div v-else>
            <v-list lines="two">
              <template v-for="(table, index) in recentTables" :key="table.id">
                <v-list-item @click="viewTableData(table.id)">
                  <template v-slot:prepend>
                    <v-avatar color="primary" class="mr-3">
                      <v-icon color="white">mdi-table</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-medium">
                    {{ table.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ table.description }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="text-right">
                      <v-chip
                        :color="getRecordCountColor(table.recordCount)"
                        variant="tonal"
                        size="small"
                        class="mb-1"
                      >
                        {{ table.recordCount }} kayıt
                      </v-chip>
                      <div class="text-caption text-grey">
                        {{ formatDate(table.createdAt) }}
                      </div>
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="index < recentTables.length - 1"></v-divider>
              </template>
            </v-list>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { apiService, handleApiError, type Table } from '@/services/api'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Reactive Data
const loading = ref(true)
const recentTables = ref<Table[]>([])
const recentActivities = ref<any[]>([])

const stats = ref({
  totalTables: 0,
  totalRecords: 0,
  tablesThisMonth: 0,
  activeTables: 0,
})

// Methods
const loadDashboardData = async () => {
  loading.value = true
  try {
    // API endpoint'lerinden verileri çek
    const allTables = await apiService.getTables()

    // İstatistikleri hesapla
    stats.value = {
      totalTables: allTables.length,
      totalRecords: allTables.reduce(
        (sum: number, table: Table) => sum + (table.recordCount || 0),
        0,
      ),
      tablesThisMonth: allTables.filter((table: Table) => {
        const createdDate = new Date(table.createdAt)
        const now = new Date()
        return (
          createdDate.getMonth() === now.getMonth() &&
          createdDate.getFullYear() === now.getFullYear()
        )
      }).length,
      activeTables: allTables.filter((table: Table) => table.isActive).length,
    }

    // Son 5 tabloyu göster
    recentTables.value = allTables
      .sort(
        (a: Table, b: Table) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)

    // Mock recent activities - bu gerçek bir aktivite log'undan gelecek
    recentActivities.value = [
      {
        id: 1,
        type: 'create',
        description: 'Yeni tablo oluşturuldu: Müşteri Listesi',
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'update',
        description: 'Ürün Envanteri tablosuna 15 yeni kayıt eklendi',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        type: 'delete',
        description: 'Eski Satış Raporları tablosu silindi',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ]
  } catch (error) {
    handleApiError(error, 'Dashboard verileri yüklenirken hata oluştu')

    // Fallback mock data
    stats.value = { totalTables: 0, totalRecords: 0, tablesThisMonth: 0, activeTables: 0 }
    recentTables.value = []
    recentActivities.value = []
  } finally {
    loading.value = false
  }
}

const createTable = () => {
  router.push('/tables/new')
}

const viewAllTables = () => {
  router.push('/tables')
}

const viewTableData = (tableId: number) => {
  router.push(`/tables/${tableId}/data`)
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

const formatDateTime = (dateString: string): string => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Şimdi'
  if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`
  return formatDate(dateString)
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.bg-gradient-to-r {
  background: linear-gradient(
    135deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-secondary)) 100%
  );
}

.v-card {
  transition: transform 0.2s ease-in-out;
}

.v-card:hover {
  transform: translateY(-2px);
}

.v-list-item {
  transition: background-color 0.2s ease;
}

.v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
