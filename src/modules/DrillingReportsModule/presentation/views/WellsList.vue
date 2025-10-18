<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWellsStore } from '../stores/wellsStore'
import { useWellsPermissions } from '../composables/useWellsPermissions'
import { useProjectsStore } from '../stores/projectsStore'
import WellForm from '../components/WellForm.vue'

const { t } = useI18n()
const wellsStore = useWellsStore()
const projectsStore = useProjectsStore()
const { canCreate, canView, canEdit, canDelete } = useWellsPermissions()

const loading = ref(false)
const showWellDialog = ref(false)
const isEditing = ref(false)
const selectedWell = ref(null)

const filters = ref({
  search: '',
  project_id: '',
  status: '',
})

const headers = computed(() => [
  { title: t('DrillingReportsModule.wells.name'), key: 'name', sortable: true },
  { title: t('DrillingReportsModule.common.code'), key: 'code', sortable: true },
  { title: t('DrillingReportsModule.wells.project'), key: 'project', sortable: true },
  { title: t('DrillingReportsModule.common.status'), key: 'status', sortable: true },
  { title: t('DrillingReportsModule.wells.depthPlanned'), key: 'depth', sortable: true },
  { title: t('DrillingReportsModule.wells.diameter'), key: 'diameter', sortable: true },
  { title: t('DrillingReportsModule.common.actions'), key: 'actions', sortable: false },
])

const wells = computed(() => wellsStore.wells)
const pagination = computed(() => wellsStore.pagination)
const projects = computed(() => projectsStore.projects)

const statusOptions = computed(() => [
  { title: t('DrillingReportsModule.common.active'), value: 'active' },
  { title: t('DrillingReportsModule.common.completed'), value: 'completed' },
  { title: t('DrillingReportsModule.common.suspended'), value: 'suspended' },
  { title: t('DrillingReportsModule.common.cancelled'), value: 'cancelled' },
])

const projectOptions = computed(() =>
  projects.value.map(project => ({
    title: project.name,
    value: project.id,
  })),
)

const getStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    completed: 'info',
    suspended: 'warning',
    cancelled: 'error',
  }

  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const option = statusOptions.value.find(opt => opt.value === status)

  return option ? option.title : status
}

const handleSearch = () => {
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadWells()
  }, 300)
}

let searchTimeout: NodeJS.Timeout

const handleFilterChange = () => {
  loadWells()
}

const handlePageChange = (page: number) => {
  wellsStore.setPage(page)
  loadWells()
}

const handleItemsPerPageChange = (itemsPerPage: number) => {
  wellsStore.setItemsPerPage(itemsPerPage)
  loadWells()
}

const handleCreateWell = () => {
  isEditing.value = false
  selectedWell.value = null
  showWellDialog.value = true
}

const handleViewWell = (well: any) => {
  // Navigate to well detail view
  console.log('View well:', well)
}

const handleEditWell = (well: any) => {
  isEditing.value = true
  selectedWell.value = well
  showWellDialog.value = true
}

const handleDeleteWell = async (well: any) => {
  if (confirm(t('DrillingReportsModule.common.confirmDelete'))) {
    try {
      await wellsStore.deleteWell(well.id)
      loadWells()
    }
    catch (error) {
      console.error('Error deleting well:', error)
    }
  }
}

const handleWellSubmit = async () => {
  showWellDialog.value = false
  loadWells()
}

const loadWells = async () => {
  loading.value = true
  try {
    await wellsStore.fetchWells({
      search: filters.value.search,
      project_id: filters.value.project_id,
      status: filters.value.status,
    })
  }
  catch (error) {
    console.error('Error loading wells:', error)
  }
  finally {
    loading.value = false
  }
}

const loadProjects = async () => {
  try {
    await projectsStore.fetchProjectsSimple()
  }
  catch (error) {
    console.error('Error loading projects:', error)
  }
}

onMounted(() => {
  loadProjects()
  loadWells()
})
</script>

<template>
  <div class="wells-list">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="tabler-well"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.wells.title') }}
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
              v-model="filters.project_id"
              :items="projectOptions"
              :label="$t('DrillingReportsModule.wells.project')"
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
              @click="handleCreateWell"
            >
              <VIcon
                icon="tabler-plus"
                class="me-2"
              />
              {{ $t('DrillingReportsModule.common.create') }}
            </VBtn>
          </VCol>
        </VRow>

        <!-- Wells Table -->
        <VDataTable
          :headers="headers"
          :items="wells"
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
              @click="handleViewWell(item)"
            >
              {{ item.name }}
            </VBtn>
          </template>

          <template #item.project="{ item }">
            {{ item.project?.name || '-' }}
          </template>

          <template #item.status="{ item }">
            <VChip
              :color="getStatusColor(item.status)"
              size="small"
            >
              {{ getStatusLabel(item.status) }}
            </VChip>
          </template>

          <template #item.depth="{ item }">
            {{ item.depth ? `${item.depth} m` : '-' }}
          </template>

          <template #item.diameter="{ item }">
            {{ item.diameter ? `${item.diameter} in` : '-' }}
          </template>

          <template #item.actions="{ item }">
            <VBtn
              icon="tabler-eye"
              size="small"
              variant="text"
              :disabled="!canView"
              @click="handleViewWell(item)"
            />
            <VBtn
              icon="tabler-edit"
              size="small"
              variant="text"
              :disabled="!canEdit(item)"
              @click="handleEditWell(item)"
            />
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              :disabled="!canDelete(item)"
              @click="handleDeleteWell(item)"
            />
          </template>
        </VDataTable>
      </VCardText>
    </VCard>

    <!-- Create/Edit Well Dialog -->
    <VDialog
      v-model="showWellDialog"
      max-width="800"
    >
      <WellForm
        :well="selectedWell"
        :is-editing="isEditing"
        :show-close-button="false"
        @submit="handleWellSubmit"
        @cancel="showWellDialog = false"
      />
    </VDialog>
  </div>
</template>

<style scoped>
.wells-list {
  inline-size: 100%;
}
</style>
