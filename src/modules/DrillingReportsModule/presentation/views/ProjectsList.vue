<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '../stores/projectsStore'
import { useProjectsPermissions } from '../composables/useProjectsPermissions'
import { useProjectDisplay } from '../composables/useProjectDisplay'
import { useProjectFilters } from '../composables/useProjectFilters'
import ProjectForm from '../components/ProjectForm.vue'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'
import DeleteConfirmationDialog from '@/components/shared/DeleteConfirmationDialog.vue'
import BaseDataTable from '@/components/BaseDataTable.vue'
import BaseFilters from '@/components/filters/BaseFilters.vue'
import BaseFilterChips from '@/components/filters/BaseFilterChips.vue'
import BaseListHeader from '@/components/layout/BaseListHeader.vue'
import BaseExportMenu from '@/components/actions/BaseExportMenu.vue'
import { formatDate } from '@/modules/DrillingReportsModule/shared/utils/dateUtils'

const router = useRouter()
const { t } = useI18n()
const projectsStore = useProjectsStore()
const { canCreate, canView, canEdit, canDelete } = useProjectsPermissions()

// Display helpers from composable
const {
  getStatusLabel,
  getStatusColor,
} = useProjectDisplay()

// Client options - will be loaded from API
const clientOptions = ref([])
const loadingClients = ref(false)

// Filters from composable
const {
  filters,
  filterFields,
  activeFilters,
  buildFilterParams,
  clearFilters,
  removeFilter,
} = useProjectFilters(clientOptions)

// UI state
const showProjectDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const selectedProject = ref(null)
const deleting = ref(false)
const exporting = ref(false)

// Table configuration
const headers = computed(() => [
  { title: t('DrillingReportsModule.projects.projectName'), key: 'project_name', sortable: true },
  { title: t('DrillingReportsModule.projects.code'), key: 'project_code', sortable: true },
  { title: t('DrillingReportsModule.projects.client'), key: 'client.business_name', sortable: true },
  { title: t('DrillingReportsModule.common.status'), key: 'status', sortable: true },
  { title: t('DrillingReportsModule.projects.startDate'), key: 'dates.start_date', sortable: true },
  { title: t('DrillingReportsModule.projects.estimatedEndDate'), key: 'dates.estimated_end_date', sortable: true },
  { title: t('DrillingReportsModule.common.actions'), key: 'actions', sortable: false, align: 'end' },
])

const projects = computed(() => projectsStore.projects)
const pagination = computed(() => projectsStore.pagination)

// Additional params for BaseDataTable
const additionalParams = computed(() => buildFilterParams())

// Load projects with current filters
const loadProjectsWithFilters = () => {
  const params = {
    page: projectsStore.pagination.current_page,
    per_page: projectsStore.pagination.per_page,
    ...buildFilterParams(),
  }

  projectsStore.fetchProjects(params)
}

// Search with debounce
let searchTimeout: NodeJS.Timeout

const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    projectsStore.setPage(1)
    loadProjectsWithFilters()
  }, 300)
}

// Filter change handler
const handleFilterChange = () => {
  projectsStore.setPage(1)
  loadProjectsWithFilters()
}

// Table options update handler
const handleOptionsUpdate = (params: any) => {
  projectsStore.fetchProjects(params)
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

    // await projectsStore.exportProjects(format, additionalParams.value)
  }
  finally {
    exporting.value = false
  }
}

// CRUD handlers
const handleCreateProject = () => {
  isEditing.value = false
  selectedProject.value = null
  showProjectDialog.value = true
}

const handleViewProject = (project: any) => {
  router.push({ name: 'drilling-projects-detail', params: { id: project.id } })
}

const handleEditProject = (project: any) => {
  isEditing.value = true
  selectedProject.value = project
  showProjectDialog.value = true
}

const handleDeleteProject = (project: any) => {
  selectedProject.value = project
  showDeleteDialog.value = true
}

const confirmDeleteProject = async () => {
  if (!selectedProject.value)
    return

  deleting.value = true
  try {
    await projectsStore.deleteProject(selectedProject.value.id)
    showDeleteDialog.value = false
    selectedProject.value = null
    loadProjectsWithFilters()
  }
  catch (error) {
    console.error('Error deleting project:', error)
  }
  finally {
    deleting.value = false
  }
}

const handleProjectSubmit = async () => {
  showProjectDialog.value = false
  loadProjectsWithFilters()
}

// Load clients from API
const loadClients = async () => {
  loadingClients.value = true
  try {
    const response = await DrillingReportApiService.getClients()
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

onMounted(() => {
  loadClients()
})
</script>

<template>
  <div class="projects-list">
    <VCard>
      <VCardText>
        <!-- Header -->
        <BaseListHeader
          :title="$t('DrillingReportsModule.projects.title')"
          icon="tabler-folder"
          :total="pagination.total"
          item-label="proyecto"
          item-label-plural="proyectos"
          :description="$t('DrillingReportsModule.projects.description')"
          :create-button-text="$t('DrillingReportsModule.projects.newProject')"
          :can-create="canCreate"
          @create="handleCreateProject"
        >
          <template #actions>
            <BaseExportMenu
              :loading="exporting"
              :disabled="!projects.length"
              @export="handleExport"
            />
          </template>
        </BaseListHeader>

        <!-- Filters -->
        <BaseFilters
          v-model="filters"
          :fields="filterFields"
          :loading="projectsStore.loading || loadingClients"
          @search="handleSearch"
          @change="handleFilterChange"
        />

        <!-- Active Filters Chips -->
        <BaseFilterChips
          :filters="activeFilters"
          @remove="handleRemoveFilter"
          @clear="handleClearFilters"
        />

        <!-- Projects Data Table -->
        <BaseDataTable
          :headers="headers"
          :items="projects"
          :meta="pagination"
          :loading="projectsStore.loading"
          :additional-params="additionalParams"
          :items-per-page-options="[10, 15, 25, 50, 100]"
          empty-state-title="No hay proyectos"
          empty-state-description="Aún no se han registrado proyectos en el sistema"
          empty-state-icon="tabler-folder-off"
          :show-create-button="canCreate"
          create-button-text="Crear Primer Proyecto"
          @update:options="handleOptionsUpdate"
          @create="handleCreateProject"
        >
          <!-- Project Name -->
          <template #item.project_name="{ item }">
            <VBtn
              variant="text"
              color="primary"
              @click="handleViewProject(item)"
            >
              {{ item.project_name }}
            </VBtn>
          </template>

          <!-- Project Code -->
          <template #item.project_code="{ item }">
            <span class="font-weight-medium">{{ item.project_code }}</span>
          </template>

          <!-- Client -->
          <template #item.client.business_name="{ item }">
            {{ item.client?.business_name || '-' }}
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

          <!-- Start Date -->
          <template #item.dates.start_date="{ item }">
            {{ formatDate(item.dates?.start_date) }}
          </template>

          <!-- Estimated End Date -->
          <template #item.dates.estimated_end_date="{ item }">
            {{ formatDate(item.dates?.estimated_end_date) }}
          </template>

          <!-- Actions -->
          <template #actions="{ item }">
            <div class="d-flex gap-1">
              <VTooltip text="Ver Detalles">
                <template #activator="{ props: tooltipProps }">
                  <VBtn
                    v-bind="tooltipProps"
                    icon="tabler-eye"
                    variant="text"
                    size="small"
                    :disabled="!canView"
                    @click="handleViewProject(item)"
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
                    :disabled="!canEdit || (typeof canEdit === 'function' && !canEdit(item))"
                    @click="handleEditProject(item)"
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
                    :disabled="!canDelete || (typeof canDelete === 'function' && !canDelete(item))"
                    @click="handleDeleteProject(item)"
                  />
                </template>
              </VTooltip>
            </div>
          </template>
        </BaseDataTable>
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
      :entity-name="selectedProject?.project_name || ''"
      :deleting="deleting"
      title="Eliminar Proyecto"
      confirmation-word="ELIMINAR"
      @confirm="confirmDeleteProject"
      @cancel="showDeleteDialog = false"
    >
      <template #default>
        <div v-if="selectedProject">
          <p class="text-body-1 mb-4">
            ¿Estás seguro que deseas eliminar este proyecto?
          </p>
          <VCard
            variant="outlined"
            class="mb-4"
          >
            <VCardText>
              <div class="d-flex flex-column gap-2">
                <div class="d-flex align-center gap-2">
                  <VIcon
                    icon="tabler-folder"
                    size="20"
                  />
                  <span class="font-weight-medium">{{ selectedProject.project_name }}</span>
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  Código: {{ selectedProject.project_code }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  Estado: {{ getStatusLabel(selectedProject.status) }}
                </div>
              </div>
            </VCardText>
          </VCard>
          <VAlert
            color="warning"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            Esta acción eliminará permanentemente el proyecto y todos sus datos asociados (pozos, reportes, personal asignado, etc.).
          </VAlert>
          <p class="text-body-2 text-error">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </template>
    </DeleteConfirmationDialog>
  </div>
</template>

<style scoped lang="scss">
.projects-list {
  inline-size: 100%;
}
</style>
