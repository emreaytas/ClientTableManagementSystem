<template>
  <div class="dashboard-container">
    <div v-if="loading" class="loading-wrapper">
      <div class="loading-box">
        <div class="spinner">
          <i class="dx-icon-spinup"></i>
        </div>
        <h3>TABLOLAR YÜKLENİYOR</h3>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="dashboard-content">
      <!-- Header Section -->
      <div class="dashboard-header">
        <div class="header-content">
          <div class="header-info">
            <div class="header-icon">
              <i class="dx-icon-chart"></i>
            </div>
            <div class="header-text">
              <h1>TABLOLARINIZ</h1>
              <p>{{ gridData.length }} tablo • {{ totalColumns }} kolon</p>
            </div>
          </div>
          <div class="header-buttons">
            <DxButton
              text="Yeni Tablo"
              type="success"
              styling-mode="contained"
              icon="plus"
              @click="createTable"
            />
            <DxButton
              text="Yenile"
              type="normal"
              styling-mode="outlined"
              icon="refresh"
              @click="refreshData"
              :disabled="refreshing"
            />
          </div>
        </div>
      </div>

      <!-- Data Grid Section -->
      <div class="grid-section">
        <div class="grid-header">
          <div class="grid-actions">
            <DxButton
              text="Excel Export"
              icon="export"
              styling-mode="outlined"
              @click="exportGrid"
            />
          </div>
        </div>

        <div class="grid-container">
          <DxDataGrid
            ref="gridRef"
            :data-source="gridData"
            :show-borders="true"
            :row-alternation-enabled="true"
            :hover-state-enabled="true"
            :allow-column-reordering="true"
            :allow-column-resizing="true"
            key-expr="id"
            @row-click="onRowClick"
            class="main-grid"
          >
            <!-- Grid Features -->
            <DxLoadPanel :enabled="false" />
            <DxSelection mode="multiple" />

            <!-- Paging -->
            <DxPaging :enabled="true" :page-size="20" />
            <DxPager
              :show-page-size-selector="true"
              :allowed-page-sizes="[10, 20, 50, 100]"
              :show-navigation-buttons="true"
              :show-info="true"
              info-text="Sayfa {0} / {1} ({2} kayıt)"
            />

            <!-- Search & Filter -->
            <DxSearchPanel :visible="true" :width="400" placeholder="Tablolarda ara..." />
            <DxFilterRow :visible="true" />
            <DxHeaderFilter :visible="true" />

            <!-- Grouping -->
            <DxGroupPanel :visible="true" />
            <DxGrouping :auto-expand-all="false" />

            <!-- Export & Column Chooser -->
            <DxColumnChooser :enabled="true" />
            <DxExport :enabled="true" :allow-export-selected-data="true" file-name="tablolar" />
            <DxSorting mode="multiple" />

            <!-- Columns -->
            <DxColumn
              data-field="id"
              caption="ID"
              :width="80"
              alignment="center"
              data-type="number"
            />

            <DxColumn
              data-field="tableName"
              caption="Tablo Adı"
              :width="250"
              cell-template="tableNameTemplate"
            />

            <DxColumn
              data-field="description"
              caption="Açıklama"
              :width="300"
              cell-template="descriptionTemplate"
            />

            <DxColumn
              data-field="columnCount"
              caption="Kolon Sayısı"
              :width="140"
              alignment="center"
              data-type="number"
              cell-template="columnCountTemplate"
            />

            <DxColumn
              data-field="createdAt"
              caption="Oluşturma Tarihi"
              :width="180"
              data-type="datetime"
              format="dd.MM.yyyy HH:mm"
            />

            <DxColumn
              caption="İşlemler"
              :width="200"
              :allow-sorting="false"
              :allow-filtering="false"
              cell-template="actionsTemplate"
              :fixed="true"
              fixed-position="right"
            />

            <!-- Summary -->
            <DxSummary>
              <DxTotalItem
                column="tableName"
                summary-type="count"
                display-format="Toplam: {0} tablo"
              />
              <DxTotalItem
                column="columnCount"
                summary-type="sum"
                display-format="Toplam kolon: {0}"
              />
            </DxSummary>

            <template #tableNameTemplate="{ data }">
              <div class="table-name-cell">
                <div class="table-icon">📋</div>
                <div class="table-details">
                  <div class="table-title">{{ data.tableName || 'İsimsiz Tablo' }}</div>
                </div>
              </div>
            </template>

            <template #descriptionTemplate="{ data }">
              <div class="description-cell">
                <span class="description-text">
                  {{ data.description || 'Açıklama yok' }}
                </span>
              </div>
            </template>

            <template #columnCountTemplate="{ data }">
              <div class="column-count-cell">
                <div class="count-badge" :class="getCountBadgeClass(data.columnCount || 0)">
                  <i class="dx-icon-columnchooser"></i>
                  {{ data.columnCount || 0 }}
                </div>
              </div>
            </template>

            <template #statusTemplate="{ data }">
              <div class="status-cell">
                <div class="status-badge" :class="getStatusClass(data.statusBadge)">
                  <i :class="getStatusIcon(data.statusBadge)"></i>
                  {{ data.statusBadge || 'Bilinmiyor' }}
                </div>
              </div>
            </template>

            <template #actionsTemplate="{ data }">
              <div class="actions-cell">
                <DxButton
                  hint="Verileri Görüntüle"
                  icon="detailslayout"
                  styling-mode="text"
                  @click="viewTableData(data.id)"
                  class="action-btn"
                />
                <DxButton
                  hint="Düzenle"
                  icon="edit"
                  styling-mode="text"
                  @click="editTable(data.id)"
                  class="action-btn"
                />
              </div>
            </template>
          </DxDataGrid>
        </div>
      </div>

      <!-- Delete Popup -->
      <DxPopup
        v-model:visible="deletePopup.visible"
        :width="deletePopup.version.width"
        :height="deletePopup.version.height"
        :title="deletePopup.version.title"
        :show-close-button="true"
        :drag-enabled="false"
        :resize-enabled="false"
      >
        <!-- Version 1: Simple -->
        <div v-if="deletePopup.currentVersion === 1" class="delete-v1">
          <div class="delete-simple">
            <div class="delete-icon">
              <i class="dx-icon-warning"></i>
            </div>
            <h3>{{ selectedTable?.tableName }}</h3>
            <p>Bu tabloyu silmek istediğinizden emin misiniz?</p>
          </div>
        </div>

        <!-- Version 2: Detailed -->
        <div v-else-if="deletePopup.currentVersion === 2" class="delete-v2">
          <div class="delete-detailed">
            <div class="warning-header">
              <i class="dx-icon-warning"></i>
              <h3>{{ selectedTable?.tableName }}</h3>
            </div>
            <div class="warning-content">
              <div class="warning-box">
                <h4>⚠️ DİKKAT: Bu işlem geri alınamaz!</h4>
                <ul>
                  <li>Tablodaki tüm veriler silinecek</li>
                  <li>Tablo yapısı tamamen kaldırılacak</li>
                  <li>İlişkili kayıtlar kaybolacak</li>
                </ul>
              </div>
              <div class="table-info">
                <div class="info-item">
                  <span>Kolon Sayısı:</span>
                  <strong>{{ selectedTable?.columnCount || 0 }}</strong>
                </div>
                <div class="info-item">
                  <span>Oluşturma Tarihi:</span>
                  <strong>{{ formatDate(selectedTable?.createdAt) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Version 3: Security -->
        <div v-else-if="deletePopup.currentVersion === 3" class="delete-v3">
          <div class="delete-security">
            <div class="security-header">
              <i class="dx-icon-key"></i>
              <h3>Güvenlik Doğrulaması</h3>
            </div>
            <div class="danger-zone">
              <h4>🚨 DANGER ZONE</h4>
              <p>
                <strong>{{ selectedTable?.tableName }}</strong> tablosunu silmek için:
              </p>
            </div>

            <div class="confirmation-input">
              <label>Tablo adını yazın:</label>
              <DxTextBox
                v-model:value="deletePopup.confirmText"
                placeholder="Tablo adını buraya yazın..."
              />
            </div>

            <div class="security-checks">
              <DxCheckBox
                v-model:value="deletePopup.backupCheck"
                text="Verilerimin yedeğini aldım"
              />
              <DxCheckBox
                v-model:value="deletePopup.riskCheck"
                text="Bu işlemin geri alınamayacağını anlıyorum"
              />
              <DxCheckBox
                v-model:value="deletePopup.finalCheck"
                text="Tabloyu kalıcı olarak silmek istiyorum"
              />
            </div>
          </div>
        </div>

        <template #bottom>
          <div class="popup-footer">
            <div class="version-controls">
              <DxButton
                v-if="deletePopup.currentVersion < 3"
                :text="`Güvenli Mod (v${deletePopup.currentVersion + 1})`"
                styling-mode="outlined"
                icon="dx-icon-lock"
                @click="upgradeVersion"
              />
              <DxButton
                v-if="deletePopup.currentVersion > 1"
                :text="`Basit Mod (v${deletePopup.currentVersion - 1})`"
                styling-mode="text"
                icon="dx-icon-unlock"
                @click="downgradeVersion"
              />
            </div>

            <div class="main-controls">
              <DxButton text="İptal" styling-mode="outlined" @click="cancelDelete" />
              <DxButton text="Sil" type="danger" @click="executeDelete" :disabled="!canDelete" />
            </div>
          </div>
        </template>
      </DxPopup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import {
  DxDataGrid,
  DxColumn,
  DxPaging,
  DxPager,
  DxSearchPanel,
  DxFilterRow,
  DxHeaderFilter,
  DxGroupPanel,
  DxGrouping,
  DxColumnChooser,
  DxExport,
  DxSelection,
  DxSorting,
  DxLoadPanel,
  DxSummary,
  DxTotalItem,
} from 'devextreme-vue/data-grid'
import { DxButton } from 'devextreme-vue/button'
import { DxPopup } from 'devextreme-vue/popup'
import { DxTextBox } from 'devextreme-vue/text-box'
import { DxCheckBox } from 'devextreme-vue/check-box'
import { apiService, type TableListDto } from '@/services/api'

// Router & Toast
const router = useRouter()
const toast = useToast()

// State
const loading = ref(true)
const refreshing = ref(false)
const gridData = ref<TableListDto[]>([])
const gridRef = ref()
const selectedTable = ref<TableListDto | null>(null)

// Delete Popup State
const deleteVersions = {
  1: { width: 400, height: 250, title: 'Tablo Sil' },
  2: { width: 500, height: 350, title: 'Tablo Silme Onayı' },
  3: { width: 600, height: 450, title: 'Güvenlik Doğrulaması' },
}

const deletePopup = ref({
  visible: false,
  currentVersion: 1,
  version: deleteVersions[1],
  confirmText: '',
  backupCheck: false,
  riskCheck: false,
  finalCheck: false,
})

// Computed Properties
const totalColumns = computed(() => {
  return gridData.value.reduce((sum, table) => sum + (table.columnCount || 0), 0)
})

const averageColumns = computed(() => {
  if (gridData.value.length === 0) return '0.0'
  return (totalColumns.value / gridData.value.length).toFixed(1)
})

const monthlyTables = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return gridData.value.filter((table) => {
    if (!table.createdAt) return false
    const date = new Date(table.createdAt)
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear
  }).length
})

const canDelete = computed(() => {
  if (deletePopup.value.currentVersion === 1 || deletePopup.value.currentVersion === 2) {
    return true
  }

  if (deletePopup.value.currentVersion === 3) {
    return (
      deletePopup.value.confirmText === selectedTable.value?.tableName &&
      deletePopup.value.backupCheck &&
      deletePopup.value.riskCheck &&
      deletePopup.value.finalCheck
    )
  }

  return false
})

// Methods
const loadData = async () => {
  try {
    loading.value = true
    console.log('🔄 Loading tables...')

    const response = await apiService.getTablesDevExpress()
    console.log('📊 API Response:', response)

    // Handle different response structures
    let tableData = []
    if (response?.data) {
      if (Array.isArray(response.data)) {
        tableData = response.data
      } else if (response.data.data && Array.isArray(response.data.data)) {
        tableData = response.data.data
      } else if (response.data.results && Array.isArray(response.data.results)) {
        tableData = response.data.results
      }
    }

    console.log('📋 Processed Table Data:', tableData)
    gridData.value = tableData

    console.log('✅ Data loaded successfully:', gridData.value.length, 'tables')
  } catch (error) {
    console.error('❌ Error loading data:', error)
    toast.error('Tablolar yüklenirken hata oluştu')
    gridData.value = []
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  refreshing.value = true
  try {
    await loadData()
    toast.success('Veriler güncellendi')
  } finally {
    refreshing.value = false
  }
}

const exportGrid = () => {
  if (gridRef.value?.instance) {
    gridRef.value.instance.exportToExcel(false)
  }
}

// Navigation
const createTable = () => router.push('/tables/new')
const viewTableData = (id: number) => router.push(`/tables/${id}/data`)
const editTable = (id: number) => router.push(`/tables/${id}/edit`)
const addTableData = (id: number) => router.push(`/tables/${id}/data?action=add`)
const onRowClick = (e: any) => e.data?.id && viewTableData(e.data.id)

// Delete Operations
const confirmDelete = (table: TableListDto) => {
  selectedTable.value = table
  resetDeletePopup()
  deletePopup.value.visible = true
}

const executeDelete = async () => {
  if (!selectedTable.value) return

  try {
    console.log(`Deleting table with ID: ${selectedTable.value.id}`)
    // await apiService.deleteTable(selectedTable.value.id);

    toast.success(`'${selectedTable.value.tableName}' tablosu başarıyla silindi.`)

    cancelDelete()
    await loadData()
  } catch (error) {
    console.error('Error deleting table:', error)
    toast.error('Tablo silinirken bir hata oluştu.')
  }
}

const resetDeletePopup = () => {
  deletePopup.value.currentVersion = 1
  deletePopup.value.version = deleteVersions[1]
  deletePopup.value.confirmText = ''
  deletePopup.value.backupCheck = false
  deletePopup.value.riskCheck = false
  deletePopup.value.finalCheck = false
}

const upgradeVersion = () => {
  if (deletePopup.value.currentVersion < 3) {
    deletePopup.value.currentVersion++
    deletePopup.value.version = deleteVersions[deletePopup.value.currentVersion]
  }
}

const downgradeVersion = () => {
  if (deletePopup.value.currentVersion > 1) {
    deletePopup.value.currentVersion--
    deletePopup.value.version = deleteVersions[deletePopup.value.currentVersion]
  }
}

const cancelDelete = () => {
  deletePopup.value.visible = false
  selectedTable.value = null
  resetDeletePopup()
}

// Helper Functions
const getCountBadgeClass = (count: number) => {
  if (count <= 3) return 'simple'
  if (count <= 6) return 'medium'
  return 'complex'
}

const getStatusClass = (status: string | undefined) => {
  if (!status) return 'status-default'
  switch (status.toLowerCase()) {
    case 'active':
      return 'status-medium'
    case 'pending':
      return 'status-simple'
    case 'error':
      return 'status-complex'
    default:
      return 'status-default'
  }
}

const getStatusIcon = (status: string | undefined) => {
  if (!status) return 'dx-icon-question'
  switch (status.toLowerCase()) {
    case 'active':
      return 'dx-icon-check'
    case 'pending':
      return 'dx-icon-clock'
    case 'error':
      return 'dx-icon-close'
    default:
      return 'dx-icon-question'
  }
}

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return 'Bilinmiyor'
  return new Date(dateStr).toLocaleDateString('tr-TR')
}

// Lifecycle
onMounted(() => {
  console.log('🚀 Dashboard mounted')
  loadData()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #ffffff;
  padding: 20px;
}

/* Loading */
.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-box {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.spinner {
  font-size: 40px;
  color: #007bff;
  margin-bottom: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Header */
.dashboard-header {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: #007bff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.header-text h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #212529;
}

.header-text p {
  margin: 4px 0 0 0;
  color: #6c757d;
  font-size: 14px;
}

.header-buttons {
  display: flex;
  gap: 12px;
}

/* Stats */
.stats-section {
  margin-bottom: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-card.blue .stat-icon {
  background: #007bff;
}
.stat-card.green .stat-icon {
  background: #28a745;
}
.stat-card.orange .stat-icon {
  background: #fd7e14;
}
.stat-card.purple .stat-icon {
  background: #6f42c1;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #212529;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
  margin: 4px 0;
}

.stat-extra {
  font-size: 12px;
  color: #28a745;
  font-weight: 500;
}

/* Grid */
.grid-section {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 24px;
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.grid-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-container {
  width: 100%;
  overflow-x: auto;
}

.main-grid {
  width: 100%;
  min-width: 1200px;
}

/* Grid Styling */
:deep(.dx-datagrid) {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

:deep(.dx-datagrid-headers) {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

:deep(.dx-datagrid-rowsview .dx-row) {
  border-bottom: 1px solid #f1f3f4;
}

:deep(.dx-datagrid-rowsview .dx-row:hover) {
  background: #f8f9fa;
}

:deep(.dx-datagrid-rowsview .dx-row-alt) {
  background: #fdfdfe;
}

/* Cell Templates */
.table-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.table-icon {
  font-size: 18px;
  opacity: 0.7;
}

.table-details {
  flex: 1;
}

.table-title {
  font-weight: 600;
  color: #212529;
  font-size: 14px;
  margin-bottom: 2px;
}

.table-id {
  font-size: 11px;
  color: #6c757d;
}

.description-cell {
  padding: 8px 0;
}

.description-text {
  color: #495057;
  font-size: 13px;
  line-height: 1.4;
}

.column-count-cell {
  display: flex;
  justify-content: center;
}

.count-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.count-badge.simple {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.count-badge.medium {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.count-badge.complex {
  background: #cce5ff;
  color: #004085;
  border: 1px solid #b3d9ff;
}

.status-cell {
  display: flex;
  justify-content: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.status-simple {
  background: #fff3cd;
  color: #856404;
}

.status-medium {
  background: #d4edda;
  color: #155724;
}

.status-complex {
  background: #cce5ff;
  color: #004085;
}

.status-default {
  background: #f8f9fa;
  color: #6c757d;
}

.actions-cell {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
}

.action-btn {
  min-width: 32px;
  width: 32px;
  height: 32px;
}

/* Delete Popup Styles */
:deep(.dx-popup-content) {
  padding: 0;
}

/* Version 1: Simple */
.delete-v1 {
  padding: 24px;
}

.delete-simple {
  text-align: center;
}

.delete-icon {
  font-size: 48px;
  color: #dc3545;
  margin-bottom: 16px;
}

.delete-simple h3 {
  margin: 0 0 12px 0;
  color: #212529;
  font-size: 18px;
}

.delete-simple p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

/* Version 2: Detailed */
.delete-v2 {
  padding: 20px;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 2px solid #dc3545;
  margin-bottom: 16px;
}

.warning-header i {
  font-size: 24px;
  color: #dc3545;
}

.warning-header h3 {
  margin: 0;
  color: #212529;
  font-size: 18px;
}

.warning-box {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.warning-box h4 {
  margin: 0 0 12px 0;
  color: #721c24;
  font-size: 14px;
}

.warning-box ul {
  margin: 0;
  padding-left: 16px;
  color: #721c24;
}

.warning-box li {
  margin-bottom: 4px;
  font-size: 13px;
}

.table-info {
  display: flex;
  gap: 24px;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.info-item span {
  font-size: 11px;
  color: #6c757d;
}

.info-item strong {
  font-size: 14px;
  color: #212529;
}

/* Version 3: Security */
.delete-v3 {
  padding: 24px;
}

.security-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 2px solid #dc3545;
  margin-bottom: 20px;
}

.security-header i {
  font-size: 28px;
  color: #dc3545;
}

.security-header h3 {
  margin: 0;
  color: #212529;
  font-size: 20px;
  font-weight: 600;
}

.danger-zone {
  background: #f8d7da;
  border: 2px solid #dc3545;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  margin-bottom: 20px;
}

.danger-zone h4 {
  margin: 0 0 8px 0;
  color: #721c24;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
}

.danger-zone p {
  margin: 0;
  color: #721c24;
  font-size: 14px;
  font-weight: 500;
}

.confirmation-input {
  margin-bottom: 20px;
}

.confirmation-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #212529;
  font-size: 13px;
}

.security-checks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

/* Popup Footer */
.popup-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.version-controls {
  display: flex;
  gap: 8px;
}

.main-controls {
  display: flex;
  gap: 8px;
}

/* Button Overrides */
:deep(.dx-button) {
  border-radius: 6px;
}

:deep(.dx-button.dx-button-success) {
  background-color: #28a745;
  border-color: #28a745;
}

:deep(.dx-button.dx-button-danger) {
  background-color: #dc3545;
  border-color: #dc3545;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .grid-section {
    padding: 16px;
  }

  .grid-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .main-grid {
    min-width: 800px;
  }

  .popup-footer {
    flex-direction: column;
    gap: 12px;
  }

  .version-controls,
  .main-controls {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stat-card {
    padding: 16px;
  }

  .stat-number {
    font-size: 24px;
  }

  .table-name-cell {
    gap: 8px;
  }

  .table-title {
    font-size: 13px;
  }

  .actions-cell {
    flex-direction: column;
    gap: 2px;
  }

  .action-btn {
    width: 100%;
    min-width: auto;
    height: 28px;
  }
}
</style>
