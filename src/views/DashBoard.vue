<template>
  <div class="devexpress-dashboard">
    <!-- Modern Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <i class="dx-icon-favorite"></i>
          </div>
          <div class="header-text">
            <h1>Tablo Yönetim Sistemi</h1>
            <p>DevExpress ile güçlendirilmiş modern tablo yönetimi</p>
          </div>
        </div>

        <div class="header-actions">
          <DxButton
            text="Yeni Tablo"
            type="success"
            styling-mode="contained"
            icon="plus"
            @click="createTable"
            class="create-btn"
          />
          <DxButton
            text="Yenile"
            type="normal"
            styling-mode="outlined"
            icon="refresh"
            @click="refreshData"
            :disabled="loading"
            class="refresh-btn"
          />
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-container" v-if="!loading">
      <div class="stats-grid">
        <div class="stat-card total-tables">
          <div class="stat-icon">
            <i class="dx-icon-folder"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalTables }}</div>
            <div class="stat-label">Toplam Tablo</div>
            <div class="stat-trend">+{{ stats.tablesThisMonth }} bu ay</div>
          </div>
        </div>

        <div class="stat-card active-tables">
          <div class="stat-icon">
            <i class="dx-icon-check"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.activeTables }}</div>
            <div class="stat-label">Aktif Tablo</div>
            <div class="stat-trend">%100 aktif</div>
          </div>
        </div>

        <div class="stat-card recent-tables">
          <div class="stat-icon">
            <i class="dx-icon-clock"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.tablesThisMonth }}</div>
            <div class="stat-label">Bu Ay Oluşturulan</div>
            <div class="stat-trend">Son 30 gün</div>
          </div>
        </div>

        <div class="stat-card total-columns">
          <div class="stat-icon">
            <i class="dx-icon-columnchooser"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ totalColumns }}</div>
            <div class="stat-label">Toplam Kolon</div>
            <div class="stat-trend">Tüm tablolarda</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main DataGrid -->
    <div class="main-grid-container">
      <DxDataGrid
        :data-source="dataSource"
        :allow-column-reordering="true"
        :allow-column-resizing="true"
        :row-alternation-enabled="true"
        :show-borders="false"
        :hover-state-enabled="true"
        key-expr="id"
        @row-click="onRowClick"
        class="modern-grid"
        :height="600"
      >
        <!-- Loading Panel -->
        <DxLoadPanel :enabled="loading" />

        <!-- Selection -->
        <DxSelection mode="multiple" />

        <!-- Sayfalama -->
        <DxPaging :enabled="true" :page-size="15" />
        <DxPager
          :show-page-size-selector="true"
          :allowed-page-sizes="[10, 15, 25, 50]"
          :show-navigation-buttons="true"
          :show-info="true"
          info-text="Sayfa {0} / {1} ({2} kayıt)"
        />

        <!-- Arama ve filtreleme -->
        <DxSearchPanel
          :visible="true"
          :width="350"
          placeholder="Tablolarda ara... (Tablo adı, açıklama)"
        />
        <DxFilterRow :visible="true" />
        <DxHeaderFilter :visible="true" />

        <!-- Gruplandırma -->
        <DxGroupPanel :visible="true" />
        <DxGrouping :auto-expand-all="false" />

        <!-- Sütun seçimi -->
        <DxColumnChooser :enabled="true" />

        <!-- Export -->
        <DxExport :enabled="true" :allow-export-selected-data="true" file-name="tablo-listesi" />

        <!-- Sıralama -->
        <DxSorting mode="multiple" />

        <!-- Sütun tanımları -->
        <DxColumn
          data-field="tableName"
          caption="📋 Tablo Adı"
          :width="220"
          :allow-sorting="true"
          :allow-filtering="true"
          cell-template="tableNameTemplate"
        />

        <DxColumn
          data-field="description"
          caption="📝 Açıklama"
          :width="280"
          cell-template="descriptionTemplate"
        />

        <DxColumn
          data-field="columnCount"
          caption="📊 Kolon Sayısı"
          :width="140"
          data-type="number"
          alignment="center"
          cell-template="columnCountTemplate"
        />

        <DxColumn
          data-field="formattedDate"
          caption="📅 Oluşturma Tarihi"
          :width="160"
          data-type="date"
        />

        <DxColumn
          data-field="statusBadge"
          caption="🏷️ Durum"
          :width="120"
          alignment="center"
          cell-template="statusTemplate"
          :allow-sorting="false"
        />

        <DxColumn
          caption="⚡ İşlemler"
          :width="200"
          :allow-sorting="false"
          :allow-filtering="false"
          cell-template="actionsTemplate"
          :fixed="true"
          fixed-position="right"
        />

        <!-- Summary -->
        <DxSummary>
          <DxTotalItem column="tableName" summary-type="count" display-format="Toplam: {0} tablo" />
          <DxTotalItem column="columnCount" summary-type="sum" display-format="Toplam kolon: {0}" />
          <DxTotalItem
            column="columnCount"
            summary-type="avg"
            display-format="Ortalama: {0} kolon/tablo"
            :value-format="{ type: 'fixedPoint', precision: 1 }"
          />
        </DxSummary>
      </DxDataGrid>
    </div>

    <!-- Templates -->
    <template #tableNameTemplate="{ data }">
      <div class="table-name-cell">
        <div class="table-icon">📋</div>
        <div class="table-info">
          <div class="table-title">{{ data.tableName }}</div>
          <div class="table-id">ID: {{ data.id }}</div>
        </div>
      </div>
    </template>

    <template #descriptionTemplate="{ data }">
      <div class="description-cell">
        <div class="description-text">
          {{ data.description || 'Açıklama bulunmuyor' }}
        </div>
      </div>
    </template>

    <template #columnCountTemplate="{ data }">
      <div class="column-count-cell">
        <div class="count-badge" :class="getCountBadgeClass(data.columnCount)">
          <i class="dx-icon-columnchooser"></i>
          <span>{{ data.columnCount }}</span>
        </div>
        <div class="count-label">{{ data.statusBadge }}</div>
      </div>
    </template>

    <template #statusTemplate="{ data }">
      <div class="status-cell">
        <div class="status-badge" :class="getStatusClass(data.statusBadge)">
          <i :class="getStatusIcon(data.statusBadge)"></i>
          <span>{{ data.statusBadge }}</span>
        </div>
      </div>
    </template>

    <template #actionsTemplate="{ data }">
      <div class="actions-cell">
        <DxButton
          hint="Verileri Görüntüle"
          icon="detailslayout"
          styling-mode="text"
          type="normal"
          @click="viewTableData(data.id)"
          class="action-btn view-btn"
        />
        <DxButton
          hint="Tabloyu Düzenle"
          icon="edit"
          styling-mode="text"
          type="normal"
          @click="editTable(data.id)"
          class="action-btn edit-btn"
        />
        <DxButton
          hint="Veri Ekle"
          icon="plus"
          styling-mode="text"
          type="success"
          @click="addTableData(data.id)"
          class="action-btn add-btn"
        />
        <DxButton
          hint="Tabloyu Sil"
          icon="trash"
          styling-mode="text"
          type="danger"
          @click="confirmDelete(data)"
          class="action-btn delete-btn"
        />
      </div>
    </template>

    <!-- Delete Confirmation Popup -->
    <DxPopup
      v-model:visible="deleteDialogVisible"
      :width="400"
      :height="250"
      title="Tablo Sil"
      :show-close-button="true"
      :drag-enabled="false"
      :resize-enabled="false"
    >
      <div class="delete-confirmation">
        <div class="delete-icon">
          <i class="dx-icon-warning"></i>
        </div>
        <div class="delete-message">
          <h3>{{ selectedTable?.tableName }}</h3>
          <p>Bu tabloyu silmek istediğinizden emin misiniz?</p>
          <div class="warning-text">
            ⚠️ Bu işlem geri alınamaz ve tablodaki tüm veriler silinecektir.
          </div>
        </div>
      </div>

      <template #bottom>
        <div class="delete-actions">
          <DxButton
            text="İptal"
            type="normal"
            styling-mode="outlined"
            @click="deleteDialogVisible = false"
          />
          <DxButton
            text="Sil"
            type="danger"
            styling-mode="contained"
            @click="deleteTable"
            :disabled="deleteLoading"
          />
        </div>
      </template>
    </DxPopup>
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
import ArrayStore from 'devextreme/data/array_store'
import { apiService } from '@/services/api'

// Interfaces
interface TableListDto {
  id: number
  tableName: string
  description: string
  createdAt: string
  updatedAt?: string
  columnCount: number
  formattedDate: string
  statusBadge: string
  statusColor: string
  columns: any[]
}

// Composables
const router = useRouter()
const toast = useToast()

// Reactive Data
const loading = ref(true)
const deleteLoading = ref(false)
const deleteDialogVisible = ref(false)
const selectedTable = ref<TableListDto | null>(null)
const gridData = ref<TableListDto[]>([])

const stats = ref({
  totalTables: 0,
  totalRecords: 0,
  tablesThisMonth: 0,
  activeTables: 0,
})

// DataSource
const dataSource = ref(
  new ArrayStore({
    key: 'id',
    data: [],
  }),
)

// Computed
const totalColumns = computed(() => {
  return gridData.value.reduce((sum, table) => sum + table.columnCount, 0)
})

// Methods
const loadData = async () => {
  try {
    loading.value = true
    const response = await apiService.getTablesDevExpress()

    if (response && response.data) {
      gridData.value = response.data

      // DataSource'u güncelle
      dataSource.value = new ArrayStore({
        key: 'id',
        data: response.data,
      })

      // İstatistikleri hesapla
      updateStats()
    }
  } catch (error) {
    console.error('Data loading error:', error)
    toast.error('Veriler yüklenirken hata oluştu')
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  stats.value = {
    totalTables: gridData.value.length,
    totalRecords: 0,
    tablesThisMonth: gridData.value.filter((table) => {
      const createdDate = new Date(table.createdAt)
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
    }).length,
    activeTables: gridData.value.length,
  }
}

const refreshData = async () => {
  await loadData()
  toast.success('Veriler güncellendi')
}

const createTable = () => {
  router.push('/tables/new')
}

const viewTableData = (tableId: number) => {
  router.push(`/tables/${tableId}/data`)
}

const editTable = (tableId: number) => {
  router.push(`/tables/${tableId}/edit`)
}

const addTableData = (tableId: number) => {
  router.push(`/tables/${tableId}/data?action=add`)
}

const onRowClick = (e: any) => {
  viewTableData(e.data.id)
}

const confirmDelete = (table: TableListDto) => {
  selectedTable.value = table
  deleteDialogVisible.value = true
}

const deleteTable = async () => {
  if (!selectedTable.value) return

  deleteLoading.value = true
  try {
    await apiService.deleteTable(selectedTable.value.id)
    await loadData()
    toast.success('Tablo başarıyla silindi')
    deleteDialogVisible.value = false
  } catch (error: any) {
    console.error('Table deletion error:', error)
    toast.error('Tablo silinirken hata oluştu')
  } finally {
    deleteLoading.value = false
  }
}

// Style helper methods
const getCountBadgeClass = (count: number) => {
  if (count <= 3) return 'simple'
  if (count <= 6) return 'medium'
  return 'complex'
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Basit':
      return 'status-simple'
    case 'Orta':
      return 'status-medium'
    case 'Karmaşık':
      return 'status-complex'
    default:
      return 'status-default'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Basit':
      return 'dx-icon-check'
    case 'Orta':
      return 'dx-icon-clock'
    case 'Karmaşık':
      return 'dx-icon-warning'
    default:
      return 'dx-icon-info'
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.devexpress-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

/* Header Styles */
.dashboard-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.header-text h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
}

.header-text p {
  margin: 5px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 15px;
}

/* Stats Container */
.stats-container {
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.total-tables .stat-icon {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.active-tables .stat-icon {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
}

.recent-tables .stat-icon {
  background: linear-gradient(135deg, #f39c12, #e67e22);
}

.total-columns .stat-icon {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
  margin: 5px 0;
}

.stat-trend {
  font-size: 12px;
  color: #27ae60;
  font-weight: 600;
}

/* Main Grid Container */
.main-grid-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

/* Grid Styling */
:deep(.dx-datagrid) {
  border: none;
  border-radius: 15px;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

:deep(.dx-datagrid-headers) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 2px solid #dee2e6;
}

:deep(.dx-datagrid-header-panel) {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

:deep(.dx-datagrid-rowsview .dx-row) {
  border-bottom: 1px solid #f1f3f4;
}

:deep(.dx-datagrid-rowsview .dx-row:hover) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
}

:deep(.dx-datagrid-rowsview .dx-row-alt) {
  background: rgba(248, 249, 250, 0.5);
}

/* Cell Templates */
.table-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-icon {
  font-size: 18px;
}

.table-info {
  flex: 1;
}

.table-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.table-id {
  font-size: 11px;
  color: #7f8c8d;
}

.description-cell {
  padding: 5px 0;
}

.description-text {
  color: #5a6c7d;
  font-size: 13px;
  line-height: 1.4;
}

.column-count-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.count-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.count-badge.simple {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  color: #856404;
}

.count-badge.medium {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
}

.count-badge.complex {
  background: linear-gradient(135deg, #cce5ff, #b3d9ff);
  color: #004085;
}

.count-label {
  font-size: 10px;
  color: #7f8c8d;
  font-weight: 500;
}

.status-cell {
  display: flex;
  justify-content: center;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-simple {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  color: #856404;
}

.status-medium {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
}

.status-complex {
  background: linear-gradient(135deg, #cce5ff, #b3d9ff);
  color: #004085;
}

.actions-cell {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.action-btn {
  min-width: 32px;
  width: 32px;
  height: 32px;
}

/* Delete Confirmation */
.delete-confirmation {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
}

.delete-icon {
  font-size: 48px;
  color: #e74c3c;
  margin-bottom: 15px;
}

.delete-message h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.delete-message p {
  margin: 0 0 15px 0;
  color: #7f8c8d;
}

.warning-text {
  background: #fff3cd;
  color: #856404;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
}

.delete-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 15px;
}

/* Button Customizations */
:deep(.create-btn .dx-button-content) {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
}

:deep(.refresh-btn .dx-button-content) {
  border: 2px solid #3498db;
  border-radius: 10px;
  padding: 12px 24px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .devexpress-dashboard {
    padding: 10px;
  }

  .header-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .main-grid-container {
    padding: 15px;
  }

  :deep(.dx-datagrid) {
    font-size: 12px;
  }
}
</style>
