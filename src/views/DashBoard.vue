<template>
  <v-container fluid class="dashboard-container">
    <!-- My Tables Section -->
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="9">
        <v-card elevation="2" class="main-card">
          <!-- Header -->
          <v-card-title class="header-section pa-8">
            <div class="d-flex align-center justify-space-between w-100">
              <div class="d-flex align-center">
                <div>
                  <h1 class="text-h4 font-weight-bold text-gray mb-1">MEVCUT TABLOLAR</h1>
                </div>
              </div>

              <div class="table-actions">
                <v-btn
                  color="primary"
                  variant="elevated"
                  size="large"
                  prepend-icon="mdi-plus"
                  @click="createTable"
                  class="mr-3 action-btn corporate-btn"
                >
                  Yeni Tablo
                </v-btn>
                <v-btn
                  color="grey-darken-1"
                  variant="outlined"
                  size="large"
                  prepend-icon="mdi-view-list"
                  @click="viewAllTables"
                  class="action-btn corporate-btn"
                >
                  Tümünü Görüntüle
                </v-btn>
              </div>
            </div>
          </v-card-title>

          <v-divider class="border-opacity-25"></v-divider>

          <!-- Loading State -->
          <v-card-text v-if="loading" class="text-center py-16">
            <v-progress-circular
              indeterminate
              color="primary"
              size="48"
              width="3"
            ></v-progress-circular>
            <div class="mt-6 text-h6 text-medium-emphasis">Tablolar yükleniyor...</div>
          </v-card-text>

          <!-- Empty State -->
          <v-card-text v-else-if="recentTables.length === 0" class="text-center py-16">
            <div class="empty-state-icon mb-6">
              <v-icon size="80" color="grey-lighten-2">mdi-table-off</v-icon>
            </div>
            <h2 class="text-h5 font-weight-medium text-grey-darken-1 mb-3">
              Henüz tablo bulunmuyor
            </h2>
            <p class="text-body-1 text-grey mb-8 mx-auto" style="max-width: 400px">
              Verilerinizi düzenlemek için ilk tablonuzu oluşturun ve veri yönetimine başlayın.
            </p>
            <v-btn
              color="primary"
              size="large"
              prepend-icon="mdi-plus"
              @click="createTable"
              class="corporate-btn"
            >
              İlk Tablonuzu Oluşturun
            </v-btn>
          </v-card-text>

          <!-- Tables List -->
          <div v-else class="table-list-container">
            <v-list class="pa-0 corporate-list">
              <template v-for="(table, index) in recentTables" :key="table.id">
                <v-list-item
                  @click="viewTableData(table.id)"
                  class="table-list-item"
                  :ripple="false"
                >
                  <template v-slot:prepend>
                    <div class="table-icon-wrapper mr-6">
                      <v-icon color="primary" size="24">mdi-table</v-icon>
                    </div>
                  </template>

                  <div class="table-content flex-grow-1">
                    <v-list-item-title class="text-h6 font-weight-medium text-black mb-1">
                      {{ table.name || table.tableName }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-body-2 text-black">
                      {{
                        table.description ||
                        `${table.columnCount || 0} kolon • Oluşturulma: ${formatDate(table.createdAt)}`
                      }}
                    </v-list-item-subtitle>
                  </div>

                  <template v-slot:append>
                    <div class="table-meta d-flex align-center">
                      <div class="mr-6 text-right">
                        <div class="text-body-2 text-green font-weight-medium mb-1">
                          {{ (table.recordCount || 0).toLocaleString() }} kayıt
                        </div>
                        <v-chip
                          :color="getRecordCountColor(table.recordCount || 0)"
                          variant="flat"
                          size="small"
                          class="status-chip"
                        >
                          {{ getStatusText(table.recordCount || 0) }}
                        </v-chip>
                      </div>
                      <v-icon color="grey-lighten-1" size="20" class="arrow-icon">
                        mdi-chevron-right
                      </v-icon>
                    </div>
                  </template>
                </v-list-item>

                <v-divider
                  v-if="index < recentTables.length - 1"
                  class="mx-8 border-opacity-25"
                ></v-divider>
              </template>
            </v-list>
          </div>

          <!-- Footer -->
          <v-divider class="border-opacity-25"></v-divider>
          <v-card-actions class="px-8 py-4">
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="grey-darken-1"
              size="small"
              @click="loadDashboardData"
              :loading="loading"
            >
              <v-icon start>mdi-refresh</v-icon>
              Yenile
            </v-btn>
          </v-card-actions>
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
  } catch (error) {
    handleApiError(error, 'Dashboard verileri yüklenirken hata oluştu')

    // Fallback mock data
    stats.value = { totalTables: 0, totalRecords: 0, tablesThisMonth: 0, activeTables: 0 }
    recentTables.value = []
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
  if (count === 0) return 'grey-lighten-1'
  if (count < 10) return 'orange-lighten-1'
  if (count < 50) return 'blue-lighten-1'
  return 'green-lighten-1'
}

const getStatusText = (count: number): string => {
  if (count === 0) return 'Boş'
  if (count < 10) return 'Az Veri'
  if (count < 50) return 'Orta'
  return 'Aktif'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  background: #fafafa;
  min-height: calc(100vh - 64px);
  padding: 40px 24px;
}

.main-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-section {
  background: white;
  border-bottom: 1px solid #f5f5f5;
}

.header-icon-wrapper {
  width: 48px;
  height: 48px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e9ecef;
}

.corporate-btn {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.5px;
  border-radius: 6px;
  box-shadow: none;
  min-width: 120px;
}

.corporate-btn:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state-icon {
  width: 120px;
  height: 120px;
  background: #f8f9fa;
  border-radius: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 2px solid #e9ecef;
}

.corporate-list {
  background: white;
}

.table-list-item {
  padding: 20px 32px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-height: 80px;
}

.table-list-item:hover {
  background: #f8f9fa;
}

.table-list-item:hover .arrow-icon {
  color: #1976d2 !important;
  transform: translateX(4px);
}

.table-icon-wrapper {
  width: 40px;
  height: 40px;
  background: #f0f4ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e3f2fd;
}

.table-content {
  padding: 4px 0;
}

.table-meta {
  min-width: 180px;
}

.status-chip {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  height: 20px;
}

.arrow-icon {
  transition: all 0.2s ease;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 20px 16px;
  }

  .header-section .d-flex {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .table-actions {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .table-actions .corporate-btn {
    flex: 1;
  }

  .table-list-item {
    padding: 16px 20px;
  }

  .table-meta {
    min-width: auto;
  }
}

@media (max-width: 600px) {
  .table-list-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .table-icon-wrapper {
    margin-right: 0 !important;
    margin-bottom: 8px;
  }

  .table-meta {
    width: 100%;
    justify-content: space-between;
  }

  .arrow-icon {
    display: none;
  }
}

/* Dark theme adjustments */
.v-theme--dark .dashboard-container {
  background: #121212;
}

.v-theme--dark .main-card {
  background: #1e1e1e;
  border: 1px solid #333;
}

.v-theme--dark .header-section {
  background: #1e1e1e;
  border-bottom: 1px solid #333;
}

.v-theme--dark .header-icon-wrapper {
  background: #2a2a2a;
  border: 1px solid #404040;
}

.v-theme--dark .table-list-item:hover {
  background: #2a2a2a;
}

.v-theme--dark .table-icon-wrapper {
  background: #1a237e;
  border: 1px solid #303f9f;
}

.v-theme--dark .empty-state-icon {
  background: #2a2a2a;
  border: 2px solid #404040;
}

/* Professional animations */
.table-list-item {
  opacity: 0;
  animation: slideInUp 0.4s ease forwards;
}

.table-list-item:nth-child(1) {
  animation-delay: 0.1s;
}
.table-list-item:nth-child(2) {
  animation-delay: 0.15s;
}
.table-list-item:nth-child(3) {
  animation-delay: 0.2s;
}
.table-list-item:nth-child(4) {
  animation-delay: 0.25s;
}
.table-list-item:nth-child(5) {
  animation-delay: 0.3s;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
