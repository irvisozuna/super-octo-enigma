<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '../stores/toolsStore'
import { useToolsPermissions } from '../composables/useToolsPermissions'
import ToolForm from '../components/ToolForm.vue'

const { t } = useI18n()
const toolsStore = useToolsStore()
const { canCreate, canView, canEdit, canDelete } = useToolsPermissions()

const loading = ref(false)
const showToolDialog = ref(false)
const isEditing = ref(false)
const selectedTool = ref(null)

const filters = ref({
  search: '',
  category: '',
  status: '',
})

const headers = computed(() => [
  { title: t('DrillingReportsModule.common.name'), key: 'name', sortable: true },
  { title: t('DrillingReportsModule.common.code'), key: 'code', sortable: true },
  { title: t('DrillingReportsModule.tools.type'), key: 'category', sortable: true },
  { title: t('DrillingReportsModule.common.status'), key: 'status', sortable: true },
  { title: t('DrillingReportsModule.common.serialNumber'), key: 'serial_number', sortable: true },
  { title: t('DrillingReportsModule.common.condition'), key: 'condition', sortable: true },
  { title: t('DrillingReportsModule.common.actions'), key: 'actions', sortable: false },
])

const tools = computed(() => toolsStore.tools)
const pagination = computed(() => toolsStore.pagination)

const categoryOptions = computed(() => [
  { title: t('DrillingReportsModule.common.drillBit'), value: 'drill_bit' },
  { title: t('DrillingReportsModule.common.hammer'), value: 'hammer' },
  { title: t('DrillingReportsModule.common.stabilizer'), value: 'stabilizer' },
  { title: t('DrillingReportsModule.common.reamer'), value: 'reamer' },
  { title: t('DrillingReportsModule.common.other'), value: 'other' },
])

const statusOptions = computed(() => [
  { title: t('DrillingReportsModule.common.available'), value: 'available' },
  { title: t('DrillingReportsModule.common.assigned'), value: 'assigned' },
  { title: t('DrillingReportsModule.common.maintenance'), value: 'maintenance' },
  { title: t('DrillingReportsModule.common.retired'), value: 'retired' },
])

const conditionOptions = computed(() => [
  { title: t('DrillingReportsModule.common.excellent'), value: 'excellent' },
  { title: t('DrillingReportsModule.common.good'), value: 'good' },
  { title: t('DrillingReportsModule.common.fair'), value: 'fair' },
  { title: t('DrillingReportsModule.common.poor'), value: 'poor' },
  { title: t('DrillingReportsModule.common.damaged'), value: 'damaged' },
])

const getCategoryColor = (category: string) => {
  const colors = {
    drill_bit: 'primary',
    hammer: 'secondary',
    stabilizer: 'success',
    reamer: 'warning',
    other: 'info',
  }

  return colors[category] || 'grey'
}

const getCategoryLabel = (category: string) => {
  const option = categoryOptions.value.find(opt => opt.value === category)

  return option ? option.title : category
}

const getStatusColor = (status: string) => {
  const colors = {
    available: 'success',
    assigned: 'info',
    maintenance: 'warning',
    retired: 'error',
  }

  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const option = statusOptions.value.find(opt => opt.value === status)

  return option ? option.title : status
}

const getConditionColor = (condition: string) => {
  const colors = {
    excellent: 'success',
    good: 'info',
    fair: 'warning',
    poor: 'error',
    damaged: 'error',
  }

  return colors[condition] || 'grey'
}

const getConditionLabel = (condition: string) => {
  const option = conditionOptions.value.find(opt => opt.value === condition)

  return option ? option.title : condition
}

const handleSearch = () => {
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadTools()
  }, 300)
}

let searchTimeout: NodeJS.Timeout

const handleFilterChange = () => {
  loadTools()
}

const handlePageChange = (page: number) => {
  toolsStore.setPage(page)
  loadTools()
}

const handleItemsPerPageChange = (itemsPerPage: number) => {
  toolsStore.setItemsPerPage(itemsPerPage)
  loadTools()
}

const handleCreateTool = () => {
  isEditing.value = false
  selectedTool.value = null
  showToolDialog.value = true
}

const handleViewTool = (tool: any) => {
  // Navigate to tool detail view
  console.log('View tool:', tool)
}

const handleEditTool = (tool: any) => {
  isEditing.value = true
  selectedTool.value = tool
  showToolDialog.value = true
}

const handleDeleteTool = async (tool: any) => {
  if (confirm(t('DrillingReportsModule.common.confirmDelete'))) {
    try {
      await toolsStore.deleteTool(tool.id)
      loadTools()
    }
    catch (error) {
      console.error('Error deleting tool:', error)
    }
  }
}

const handleToolSubmit = async () => {
  showToolDialog.value = false
  loadTools()
}

const loadTools = async () => {
  loading.value = true
  try {
    await toolsStore.fetchTools({
      search: filters.value.search,
      category: filters.value.category,
      status: filters.value.status,
    })
  }
  catch (error) {
    console.error('Error loading tools:', error)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTools()
})
</script>

<template>
  <div class="tools-list">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="tabler-tools"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.tools.title') }}
      </VCardTitle>

      <VCardText>
        <!-- Filters -->
        <VRow class="mb-4">
          <VCol
            cols="12"
            md="3"
          >
            <VTextField
              v-model="filters.search"
              :label="$t('DrillingReportsModule.common.search')"
              prepend-inner-icon="tabler-search"
              clearable
              @input="handleSearch"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="filters.category"
              :items="categoryOptions"
              :label="$t('DrillingReportsModule.tools.type')"
              clearable
              @change="handleFilterChange"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="filters.status"
              :items="statusOptions"
              :label="$t('DrillingReportsModule.common.status')"
              clearable
              @change="handleFilterChange"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VBtn
              color="primary"
              :disabled="!canCreate"
              @click="handleCreateTool"
            >
              <VIcon
                icon="tabler-plus"
                class="me-2"
              />
              {{ $t('DrillingReportsModule.common.create') }}
            </VBtn>
          </VCol>
        </VRow>

        <!-- Tools Table -->
        <VDataTable
          :headers="headers"
          :items="tools"
          :loading="loading"
          :items-per-page="pagination.per_page"
          :page="pagination.current_page"
          :server-items-length="pagination.total"
          @update:page="handlePageChange"
          @update:items-per-page="handleItemsPerPageChange"
        >
          <template #item.name="{ item }">
            <VBtn
              variant="text"
              color="primary"
              @click="handleViewTool(item)"
            >
              {{ item.name }}
            </VBtn>
          </template>

          <template #item.category="{ item }">
            <VChip
              :color="getCategoryColor(item.category)"
              size="small"
            >
              {{ getCategoryLabel(item.category) }}
            </VChip>
          </template>

          <template #item.status="{ item }">
            <VChip
              :color="getStatusColor(item.status)"
              size="small"
            >
              {{ getStatusLabel(item.status) }}
            </VChip>
          </template>

          <template #item.serial_number="{ item }">
            {{ item.serial_number || '-' }}
          </template>

          <template #item.condition="{ item }">
            <VChip
              :color="getConditionColor(item.condition)"
              size="small"
            >
              {{ getConditionLabel(item.condition) }}
            </VChip>
          </template>

          <template #item.actions="{ item }">
            <VBtn
              icon="tabler-eye"
              size="small"
              variant="text"
              :disabled="!canView"
              @click="handleViewTool(item)"
            />
            <VBtn
              icon="tabler-edit"
              size="small"
              variant="text"
              :disabled="!canEdit(item)"
              @click="handleEditTool(item)"
            />
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              :disabled="!canDelete(item)"
              @click="handleDeleteTool(item)"
            />
          </template>
        </VDataTable>
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
  </div>
</template>

<style scoped>
.tools-list {
  inline-size: 100%;
}
</style>
