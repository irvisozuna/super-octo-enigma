<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '../stores/toolsStore'
import { useToolsPermissions } from '../composables/useToolsPermissions'
import { useToolDisplay } from '../composables/useToolDisplay'
import { useToolFilters } from '../composables/useToolFilters'
import ToolForm from '../components/ToolForm.vue'
import DeleteConfirmationDialog from '@/components/shared/DeleteConfirmationDialog.vue'
import BaseDataTable from '@/components/BaseDataTable.vue'
import BaseFilters from '@/components/filters/BaseFilters.vue'
import BaseFilterChips from '@/components/filters/BaseFilterChips.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import BaseExportMenu from '@/components/actions/BaseExportMenu.vue'

const { t } = useI18n()
const toolsStore = useToolsStore()
const { canCreate, canEdit, canDelete, canViewDetail, canExport } = useToolsPermissions()

// Display helpers from composable
const {
  getToolTypeLabel,
  getStatusColor,
  getStatusLabel,
  getWearLevelColor,
  getWearLevelLabel,
} = useToolDisplay()

// Filters from composable
const {
  filters,
  filterFields,
  activeFilters,
  buildFilterParams,
  clearFilters,
  removeFilter,
} = useToolFilters()

// UI state
const showToolDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const selectedTool = ref<any>(null)
const deleting = ref(false)
const exporting = ref(false)

// Table configuration
const headers = computed(() => [
  { title: t('DrillingReportsModule.tools.serialNumber'), key: 'serial_number', sortable: true },
  { title: t('DrillingReportsModule.tools.type'), key: 'type', sortable: true },
  { title: t('DrillingReportsModule.common.status'), key: 'status', sortable: true },
  { title: t('DrillingReportsModule.tools.wearlevel'), key: 'wear_level', sortable: true },
  { title: t('DrillingReportsModule.tools.capacity'), key: 'capacity.total_meters', sortable: true },
  { title: t('DrillingReportsModule.tools.usage'), key: 'capacity.usage_percentage', sortable: true },
  { title: t('DrillingReportsModule.common.actions'), key: 'actions', sortable: false, align: 'end' },
])

const tools = computed(() => toolsStore.tools)
const pagination = computed(() => toolsStore.pagination)

// Additional params for BaseDataTable
const additionalParams = computed(() => buildFilterParams())

// Load tools with current filters
const loadToolsWithFilters = () => {
  const params = {
    page: toolsStore.pagination.current_page,
    per_page: toolsStore.pagination.per_page,
    ...buildFilterParams(),
  }

  toolsStore.fetchTools(params)
}

// Search with debounce
let searchTimeout: NodeJS.Timeout

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    toolsStore.setPage(1)
    loadToolsWithFilters()
  }, 300)
}

// Filter change handler
const handleFilterChange = () => {
  toolsStore.setPage(1)
  loadToolsWithFilters()
}

// Table options update handler
const handleOptionsUpdate = (params: any) => {
  toolsStore.fetchTools(params)
}

// Clear all filters handler
const handleClearFilters = () => {
  clearFilters()
  handleFilterChange()
}

// Remove filter handler
const handleRemoveFilter = (filter: any) => {
  removeFilter(filter)
  handleFilterChange()
}

// Export handler
const handleExport = async (format: 'excel' | 'pdf' | 'csv' | 'json') => {
  exporting.value = true
  try {
    // TODO: Implement export logic
    console.log(`Exporting to ${format}`, additionalParams.value)

    // await toolsStore.exportTools(format, additionalParams.value)
  }
  finally {
    exporting.value = false
  }
}

// CRUD handlers
const handleCreateTool = () => {
  isEditing.value = false
  selectedTool.value = null
  showToolDialog.value = true
}

const handleEditTool = async (tool: any) => {
  isEditing.value = true

  const toolId = tool.id || tool.serial_number

  if (!toolId) {
    console.error('Tool does not have an id or serial_number:', tool)

    return
  }

  try {
    const fullTool = await toolsStore.fetchTool(toolId)

    selectedTool.value = fullTool
    showToolDialog.value = true
  }
  catch (error) {
    console.error('Error loading tool details:', error)
  }
}

const handleViewTool = (tool: any) => {
  selectedTool.value = tool
  showToolDialog.value = true
  isEditing.value = false
}

const handleDeleteTool = (tool: any) => {
  selectedTool.value = tool
  showDeleteDialog.value = true
}

const confirmDeleteTool = async () => {
  if (!selectedTool.value)
    return

  deleting.value = true
  try {
    await toolsStore.deleteTool(selectedTool.value.id)
    showDeleteDialog.value = false
    selectedTool.value = null
    loadToolsWithFilters()
  }
  catch (error) {
    console.error('Error deleting tool:', error)
  }
  finally {
    deleting.value = false
  }
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedTool.value = null
}

const handleToolSubmit = async () => {
  showToolDialog.value = false
  loadToolsWithFilters()
}

// No need for onMounted - VDataTableServer handles initial load via @update:options
</script>

<template>
  <div class="tools-list">
    <VCard>
      <VCardText>
        <!-- Header -->
        <BaseListHeader
          :title="$t('DrillingReportsModule.tools.title')"
          icon="tabler-tools"
          :total="pagination.total"
          item-label="herramienta"
          item-label-plural="herramientas"
          :description="$t('DrillingReportsModule.tools.description')"
          :create-button-text="$t('DrillingReportsModule.common.create')"
          :can-create="canCreate"
          :can-view="canViewDetail"
          :can-edit="canEdit"
          :can-delete="canDelete"
          :can-export="canExport"
          @create="handleCreateTool"
        >
          <template #actions>
            <BaseExportMenu
              :loading="exporting"
              :disabled="!tools.length"
              @export="handleExport"
            />
          </template>
        </BaseListHeader>

        <!-- Filters -->
        <BaseFilters
          v-model="filters"
          :fields="filterFields"
          :loading="toolsStore.loading"
          @search="handleSearch"
          @change="handleFilterChange"
        />

        <!-- Active Filters Chips -->
        <BaseFilterChips
          :filters="activeFilters"
          @remove="handleRemoveFilter"
          @clear="handleClearFilters"
        />

        <!-- Tools Data Table -->
        <BaseDataTable
          :headers="headers"
          :items="tools"
          :meta="pagination"
          :loading="toolsStore.loading"
          :additional-params="additionalParams"
          :items-per-page-options="[3, 10, 15, 25, 50, 100]"
          empty-state-title="No hay herramientas"
          empty-state-description="Aún no se han registrado herramientas en el sistema"
          empty-state-icon="tabler-tools-off"
          :show-create-button="canCreate"
          create-button-text="Crear Primera Herramienta"
          @update:options="handleOptionsUpdate"
          @create="handleCreateTool"
        >
          <!-- Serial Number -->
          <template #item.serial_number="{ item }">
            <div class="d-flex align-center gap-2">
              <VIcon
                icon="tabler-tool"
                size="18"
                class="text-medium-emphasis"
              />
              <span class="font-weight-medium">{{ item.serial_number }}</span>
            </div>
          </template>

          <!-- Type -->
          <template #item.type="{ item }">
            <VChip
              size="small"
              variant="tonal"
              color="primary"
            >
              {{ getToolTypeLabel(item.type) }}
            </VChip>
          </template>

          <!-- Status -->
          <template #item.status="{ item }">
            <VChip
              :color="getStatusColor(item.status)"
              size="small"
              variant="tonal"
            >
              {{ getStatusLabel(item.status) }}
            </VChip>
          </template>

          <!-- Wear Level -->
          <template #item.wear_level="{ item }">
            <VChip
              :color="getWearLevelColor(item.wear_level)"
              size="small"
              variant="tonal"
            >
              {{ getWearLevelLabel(item.wear_level) }}
            </VChip>
          </template>

          <!-- Capacity -->
          <template #item.capacity.total_meters="{ item }">
            <div class="text-body-2">
              {{ item.capacity?.total_meters?.toFixed(2) || 0 }}m
            </div>
          </template>

          <!-- Usage -->
          <template #item.capacity.usage_percentage="{ item }">
            <div class="d-flex align-center gap-2">
              <VProgressLinear
                :model-value="item.capacity?.usage_percentage || 0"
                :color="(item.capacity?.usage_percentage || 0) >= 80 ? 'error' : (item.capacity?.usage_percentage || 0) >= 50 ? 'warning' : 'success'"
                height="6"
                rounded
                class="flex-grow-1"
                style="max-inline-size: 100px;"
              />
              <span class="text-body-2 text-medium-emphasis">{{ (item.capacity?.usage_percentage || 0).toFixed(1) }}%</span>
            </div>
          </template>

          <!-- Actions -->
          <template #actions="{ item }">
            <div class="d-flex gap-1">
              <VTooltip text="Ver">
                <template #activator="{ props: tooltipProps }">
                  <VBtn
                    v-bind="tooltipProps"
                    icon="tabler-eye"
                    variant="text"
                    size="small"
                    :disabled="!canEdit"
                    @click="handleViewTool(item)"
                  />
                </template>
              </VTooltip>
              <VTooltip text="Editar">
                <template #activator="{ props: tooltipProps }">
                  <VBtn
                    v-bind="tooltipProps"
                    icon="tabler-edit"
                    variant="text"
                    size="small"
                    :disabled="!canEdit"
                    @click="handleEditTool(item)"
                  />
                </template>
              </VTooltip>
              <VTooltip text="Eliminar">
                <template #activator="{ props: tooltipProps }">
                  <VBtn
                    v-bind="tooltipProps"
                    icon="tabler-trash"
                    variant="text"
                    size="small"
                    color="error"
                    :disabled="!canDelete"
                    @click="handleDeleteTool(item)"
                  />
                </template>
              </VTooltip>
            </div>
          </template>
        </BaseDataTable>
      </VCardText>
    </VCard>

    <!-- Create/Edit Tool Dialog -->
    <VDialog
      v-model="showToolDialog"
      max-width="800"
    >
      <ToolForm
        :tool="selectedTool"
        :is-editing="isEditing"
        :show-close-button="false"
        @submit="handleToolSubmit"
        @cancel="showToolDialog = false"
      />
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmationDialog
      :visible="showDeleteDialog"
      :entity-name="selectedTool?.serial_number || ''"
      :deleting="deleting"
      title="Eliminar herramienta"
      confirmation-word="ELIMINAR"
      @confirm="confirmDeleteTool"
      @close="closeDeleteDialog"
    />
  </div>
</template>

<style scoped lang="scss">
.tools-list {
  inline-size: 100%;
}
</style>
