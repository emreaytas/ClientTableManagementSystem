<template>
  <v-container fluid class="dashboard-container">
    <!-- Main Content - Recent Tables Section -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2" class="main-card">
          <!-- Header -->
          <v-card-title class="header-section pa-8">
            <div class="d-flex align-center justify-space-between w-100">
              <div class="d-flex align-center">
                <v-icon icon="mdi-table-clock" class="mr-3" color="primary" size="32"></v-icon>
                <div>
                  <h1 class="text-h4 font-weight-bold text-gray mb-1">TABLOLARINIZ</h1>
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
          <v-card-text v-else class="pa-0">
            <v-list lines="three" class="py-0">
              <template v-for="(table, index) in recentTables" :key="table.id">
                <v-list-item @click="viewTableData(table.id)" class="table-item pa-6">
                  <template v-slot:prepend>
                    <v-avatar size="56" :color="getTableColor(index)" variant="tonal">
                      <v-icon icon="mdi-table" size="28"></v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title class="text-h6 font-weight-medium mb-1">
                    {{ table.tableName }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="text-body-2">
                    <div class="d-flex align-center mb-1">
                      <v-icon icon="mdi-calendar" size="16" class="mr-1"></v-icon>
                      {{ formatDate(table.createdAt) }}
                    </div>
                    <div class="d-flex align-center">
                      <v-chip
                        size="small"
                        :color="getRecordCountColor(table.recordCount || 0)"
                        variant="flat"
                        class="mr-2"
                      >
                        <v-icon icon="mdi-database" size="14" class="mr-1"></v-icon>
                        {{ table.recordCount || 0 }} kayıt
                      </v-chip>
                      <v-chip
                        size="small"
                        :color="table.isActive ? 'success' : 'warning'"
                        variant="flat"
                      >
                        {{ table.isActive ? 'Aktif' : 'Pasif' }}
                      </v-chip>
                    </div>
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <v-btn icon="mdi-chevron-right" variant="text" color="grey"></v-btn>
                  </template>
                </v-list-item>
                <v-divider v-if="index < recentTables.length - 1"></v-divider>
              </template>
            </v-list>

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
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { apiService } from '@/services/api'

// Interfaces - Backend'inizle uyumlu
interface ApiTable {
  id: number
  tableName: string
  description: string
  createdAt: string
  isActive: boolean
  recordCount?: number
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
const authStore = useAuthStore()
const toast = useToast()

// Reactive Data
const loading = ref(true)
const showWelcomeMessage = ref(false)
const stats = ref({
  totalTables: 0,
  totalRecords: 0,
  tablesThisMonth: 0,
  activeTables: 0,
})
const recentTables = ref<ApiTable[]>([])

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
  if (count < 10) return 'warning'
  if (count < 50) return 'info'
  return 'success'
}

const getTableColor = (index: number): string => {
  const colors = ['primary', 'success', 'info', 'warning', 'secondary']
  return colors[index % colors.length]
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Lifecycle
onMounted(async () => {
  // Hoş geldin mesajını göster
  await nextTick()
  showWelcomeMessage.value = true
})
</script>

<style scoped>
.dashboard-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 64px);
  padding: 2rem 1rem;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.action-btn {
  transition: all 0.2s ease-in-out;
  min-height: 80px;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.corporate-btn {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 8px;
}

.table-item {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.table-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.main-card {
  border-radius: 16px;
  overflow: hidden;
}

.header-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.text-gray {
  color: #495057 !important;
}

.empty-state-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.welcome-snackbar {
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 960px) {
  .dashboard-container {
    padding: 1rem 0.5rem;
  }

  .header-section {
    padding: 1.5rem !important;
  }

  .table-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .corporate-btn {
    width: 100%;
    margin: 0 !important;
  }
}

@media (max-width: 600px) {
  .action-btn {
    min-height: 60px;
  }

  .stat-card .text-h3 {
    font-size: 1.5rem !important;
  }

  .header-section .text-h4 {
    font-size: 1.25rem !important;
  }
}
</style>
