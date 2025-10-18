<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projectsStore'
import { useProjectsPermissions } from '../composables/useProjectsPermissions'
import ProjectForm from '../components/ProjectForm.vue'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'
import { formatDate } from '@/modules/DrillingReportsModule/shared/utils/dateUtils'
import DeleteConfirmationDialog from '@/components/shared/DeleteConfirmationDialog.vue'

const router = useRouter()
const { t } = useI18n()
const projectsStore = useProjectsStore()
const { canCreate, canView, canEdit, canDelete } = useProjectsPermissions()

const loading = ref(false)
const showProjectDialog = ref(false)
const isEditing = ref(false)
const selectedProject = ref(null)

// Delete confirmation dialog
const showDeleteDialog = ref(false)
const projectToDelete = ref(null)
const deleting = ref(false)

const filters = ref({
  search: '',
  status: '',
  client: '',
})

// Filtros múltiples
const selectedStatuses = ref<string[]>([])
const selectedClients = ref<string[]>([])

// Computed para chips de filtros activos
const activeFilters = computed(() => {
  const activeFiltersList: Array<{ label: string; value: string; type: string }> = []

  if (filters.value.search) {
    activeFiltersList.push({
      label: `Búsqueda: ${filters.value.search}`,
      value: 'search',
      type: 'search',
    })
  }

  selectedStatuses.value.forEach(status => {
    const option = statusOptions.value.find(o => o.value === status)
    if (option) {
      activeFiltersList.push({
        label: option.title,
        value: status,
        type: 'status',
      })
    }
  })

  selectedClients.value.forEach(clientId => {
    const option = clientOptions.value.find(o => o.value === clientId)
    if (option) {
      activeFiltersList.push({
        label: option.title,
        value: clientId,
        type: 'client',
      })
    }
  })

  return activeFiltersList
})

const hasActiveFilters = computed(() => activeFilters.value.length > 0)

const headers = computed(() => [
  { title: t('DrillingReportsModule.projects.projectName'), key: 'project_name', sortable: true },
  { title: t('DrillingReportsModule.projects.code'), key: 'project_code', sortable: true },
  { title: t('DrillingReportsModule.projects.client'), key: 'client.business_name', sortable: true },
  { title: t('DrillingReportsModule.common.status'), key: 'status', sortable: true },
  { title: t('DrillingReportsModule.projects.startDate'), key: 'start_date', sortable: true },
  { title: t('DrillingReportsModule.projects.estimatedEndDate'), key: 'estimated_end_date', sortable: true },
  { title: t('actions'), key: 'actions', sortable: false },
])

const projects = computed(() => {
  console.log('📋 projects computed - projectsStore.projects:', projectsStore.projects)

  return projectsStore.projects
})

const pagination = computed(() => {
  console.log('📋 pagination computed - projectsStore.pagination:', projectsStore.pagination)

  return projectsStore.pagination
})

const statusOptions = computed(() => [
  { title: t('DrillingReportsModule.common.planned'), value: 'planned' },
  { title: t('DrillingReportsModule.common.active'), value: 'active' },
  { title: t('DrillingReportsModule.common.completed'), value: 'completed' },
  { title: t('DrillingReportsModule.common.suspended'), value: 'suspended' },
  { title: t('DrillingReportsModule.common.cancelled'), value: 'cancelled' },
])

// Client options - will be loaded from API
const clientOptions = ref([])
const loadingClients = ref(false)

const getStatusColor = (status: string) => {
  const colors = {
    planned: 'info',
    active: 'success',
    completed: 'success',
    suspended: 'warning',
    cancelled: 'error',
  }

  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const option = statusOptions.value.find(opt => opt.value === status)

  return option ? option.title : status
}

// Debounce para búsqueda
let searchTimeout: NodeJS.Timeout

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadProjects()
  }, 300)
}

const handleFilterChange = () => {
  loadProjects()
}

// Funciones para manejar filtros múltiples
const applyFilters = () => {
  loadProjects()
}

const clearFilters = () => {
  filters.value.search = ''
  selectedStatuses.value = []
  selectedClients.value = []
  loadProjects()
}

const removeFilter = (filter: { type: string; value: string }) => {
  if (filter.type === 'search')
    filters.value.search = ''
  else if (filter.type === 'status')
    selectedStatuses.value = selectedStatuses.value.filter(s => s !== filter.value)
  else if (filter.type === 'client')
    selectedClients.value = selectedClients.value.filter(c => c !== filter.value)

  loadProjects()
}

const handlePageChange = (page: number) => {
  projectsStore.setPage(page)
  loadProjects()
}

const handleItemsPerPageChange = (itemsPerPage: number) => {
  projectsStore.setItemsPerPage(itemsPerPage)
  loadProjects()
}

const handleCreateProject = () => {
  isEditing.value = false
  selectedProject.value = null
  showProjectDialog.value = true
}

const handleViewProject = (project: any) => {
  console.log('View project:', project)
  router.push({ name: 'drilling-projects-detail', params: { id: project.id } })
}

const handleEditProject = (project: any) => {
  isEditing.value = true
  selectedProject.value = project
  showProjectDialog.value = true
}

const handleDeleteProject = (project: any) => {
  projectToDelete.value = project
  showDeleteDialog.value = true
}

const confirmDeleteProject = async () => {
  if (!projectToDelete.value)
    return

  deleting.value = true
  try {
    await projectsStore.deleteProject(projectToDelete.value.id)
    loadProjects()
    showDeleteDialog.value = false
    projectToDelete.value = null
  }
  catch (error) {
    console.error('Error deleting project:', error)
  }
  finally {
    deleting.value = false
  }
}

const cancelDeleteProject = () => {
  showDeleteDialog.value = false
  projectToDelete.value = null
}

const handleProjectSubmit = async () => {
  showProjectDialog.value = false
  loadProjects()
}

// Cargar clientes desde la API
const loadClients = async () => {
  loadingClients.value = true
  try {
    console.log('🔄 Cargando clientes...')

    // Usar el servicio de clientes del DrillingReportsModule
    const response = await DrillingReportApiService.getClients()

    console.log('🔄 Clientes cargados:', response)

    if (response && response.data) {
      clientOptions.value = response.data.map((client: any) => ({
        title: client.business_name || client.company_name || `${client.first_name} ${client.last_name}`,
        value: client.id,
      }))
    }
  }
  catch (error) {
    console.error('Error loading clients:', error)
    clientOptions.value = []
  }
  finally {
    loadingClients.value = false
  }
}

const loadProjects = async () => {
  console.log('🔄 loadProjects iniciado')
  loading.value = true
  try {
    const filterParams = {
      search: filters.value.search,
      status: selectedStatuses.value.length > 0 ? selectedStatuses.value.join(',') : undefined,
      client: selectedClients.value.length > 0 ? selectedClients.value.join(',') : undefined,
    }

    console.log('🔄 Llamando a projectsStore.fetchProjects con filtros:', filterParams)

    await projectsStore.fetchProjects(filterParams)

    console.log('🔄 fetchProjects completado, projects.value:', projects.value)
  }
  catch (error) {
    console.error('Error loading projects:', error)
  }
  finally {
    loading.value = false
    console.log('🔄 loadProjects terminado')
  }
}

onMounted(() => {
  loadClients()
  loadProjects()
})
</script>

<template>
  <div class="projects-list">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="tabler-folder"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.projects.title') }}
      </VCardTitle>

      <VCardText>
        <!-- Filters -->
        <VRow class="mb-3">
          <!-- Búsqueda -->
          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="filters.search"
              :label="$t('DrillingReportsModule.common.search')"
              prepend-inner-icon="tabler-search"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              @input="handleSearch"
            />
          </VCol>

          <!-- Estado - Múltiple -->
          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <VSelect
              v-model="selectedStatuses"
              :label="$t('DrillingReportsModule.common.status')"
              :items="statusOptions"
              variant="outlined"
              density="compact"
              multiple
              chips
              closable-chips
              hide-details
              @update:model-value="applyFilters"
            >
              <template #chip="{ item, index }">
                <VChip
                  size="small"
                  closable
                  @click:close="selectedStatuses.splice(index, 1); applyFilters()"
                >
                  {{ item.title }}
                </VChip>
              </template>
            </VSelect>
          </VCol>

          <!-- Cliente - Múltiple -->
          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <VSelect
              v-model="selectedClients"
              :label="$t('DrillingReportsModule.projects.client')"
              :items="clientOptions"
              :loading="loadingClients"
              variant="outlined"
              density="compact"
              multiple
              chips
              closable-chips
              hide-details
              @update:model-value="applyFilters"
            >
              <template #chip="{ item, index }">
                <VChip
                  size="small"
                  closable
                  @click:close="selectedClients.splice(index, 1); applyFilters()"
                >
                  {{ item.title }}
                </VChip>
              </template>
            </VSelect>
          </VCol>

          <!-- Botón Crear -->
          <VCol
            cols="12"
            md="2"
          >
            <VBtn
              color="primary"
              :disabled="!canCreate"
              block
              @click="handleCreateProject"
            >
              <VIcon
                icon="tabler-plus"
                class="me-2"
              />
              {{ $t('DrillingReportsModule.projects.newProject') }}
            </VBtn>
          </VCol>
        </VRow>

        <!-- Chips de filtros activos -->
        <VRow v-if="hasActiveFilters">
          <VCol cols="12">
            <VAlert
              color="primary"
              variant="tonal"
              density="compact"
              border="start"
              border-color="primary"
              class="mb-0"
            >
              <div class="d-flex align-center flex-wrap gap-2">
                <span class="text-body-2 font-weight-medium">
                  <VIcon
                    size="18"
                    class="me-1"
                  >tabler-filter</VIcon>
                  Filtros activos:
                </span>

                <VChip
                  v-for="filter in activeFilters"
                  :key="`${filter.type}-${filter.value}`"
                  size="small"
                  closable
                  color="primary"
                  @click:close="removeFilter(filter)"
                >
                  {{ filter.label }}
                </VChip>

                <VSpacer />

                <VBtn
                  size="small"
                  variant="text"
                  color="error"
                  prepend-icon="tabler-x"
                  @click="clearFilters"
                >
                  Limpiar todo
                </VBtn>
              </div>
            </VAlert>
          </VCol>
        </VRow>

        <!-- Projects Table -->
        <VDataTable
          :headers="headers"
          :items="projects"
          :loading="loading"
          :items-per-page="pagination.per_page"
          :page="pagination.current_page"
          :server-items-length="pagination.total"
          @update:page="handlePageChange"
          @update:items-per-page="handleItemsPerPageChange"
        >
          <template #item.project_name="{ item }">
            <VBtn
              variant="text"
              color="primary"
              @click="handleViewProject(item)"
            >
              {{ item.project_name }}
            </VBtn>
          </template>

          <template #item.status="{ item }">
            <VChip
              :color="getStatusColor(item.status)"
              size="small"
            >
              {{ getStatusLabel(item.status) }}
            </VChip>
          </template>

          <template #item.start_date="{ item }">
            {{ formatDate(item.dates?.start_date) }}
          </template>

          <template #item.estimated_end_date="{ item }">
            {{ formatDate(item.dates?.estimated_end_date) }}
          </template>

          <template #item.actions="{ item }">
            <VBtn
              icon="tabler-eye"
              size="small"
              variant="text"
              :disabled="!canView"
              @click="handleViewProject(item)"
            />
            <VBtn
              icon="tabler-edit"
              size="small"
              variant="text"
              :disabled="!canEdit || !canEdit(item)"
              @click="handleEditProject(item)"
            />
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              :disabled="!canDelete || !canDelete(item)"
              @click="handleDeleteProject(item)"
            />
          </template>
        </VDataTable>
      </VCardText>
    </VCard>

    <!-- Create/Edit Project Dialog -->
    <VDialog
      v-model="showProjectDialog"
      max-width="800"
    >
      <ProjectForm
        :project="selectedProject"
        :is-editing="isEditing"
        :show-close-button="false"
        @submit="handleProjectSubmit"
        @cancel="showProjectDialog = false"
      />
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmationDialog
      :visible="showDeleteDialog"
      title="Eliminar Proyecto"
      entity-name="Proyecto"
      :entity-id="projectToDelete?.id"
      warning-message="Esta acción eliminará permanentemente el proyecto y todos sus datos asociados (pozos, reportes, personal asignado, etc.). Esta acción no se puede deshacer."
      confirmation-word="ELIMINAR"
      :loading="deleting"
      @close="cancelDeleteProject"
      @confirm="confirmDeleteProject"
    >
      <template #entity-info>
        {{ projectToDelete?.project_name }} ({{ projectToDelete?.project_code }})
      </template>
      <template #confirmation-text>
        el proyecto <strong>{{ projectToDelete?.project_name }}</strong> y todos sus datos asociados
      </template>
    </DeleteConfirmationDialog>
  </div>
</template>

<style scoped>
.projects-list {
  inline-size: 100%;
}
</style>
