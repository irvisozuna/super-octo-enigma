<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDocumentsStore } from '../stores/documentsStore'
import { useDocumentsPermissions } from '../composables/useDocumentsPermissions'
import DocumentForm from '../components/DocumentForm.vue'
import { formatDate } from '@/modules/DrillingReportsModule/shared/utils/dateUtils'

const { t } = useI18n()
const documentsStore = useDocumentsStore()
const { canCreate, canView, canEdit, canDelete, canDownload } = useDocumentsPermissions()

const loading = ref(false)
const showDocumentDialog = ref(false)
const isEditing = ref(false)
const selectedDocument = ref(null)

const filters = ref({
  search: '',
  type: '',
  entity_type: '',
})

const headers = computed(() => [
  { title: t('DrillingReportsModule.common.name'), key: 'name', sortable: true },
  { title: t('DrillingReportsModule.documents.type'), key: 'type', sortable: true },
  { title: t('DrillingReportsModule.common.entityType'), key: 'entity_type', sortable: true },
  { title: t('DrillingReportsModule.common.entityId'), key: 'entity_id', sortable: true },
  { title: t('DrillingReportsModule.common.size'), key: 'size', sortable: true },
  { title: t('DrillingReportsModule.common.uploadedAt'), key: 'uploaded_at', sortable: true },
  { title: t('DrillingReportsModule.common.actions'), key: 'actions', sortable: false },
])

const documents = computed(() => documentsStore.documents)
const pagination = computed(() => documentsStore.pagination)

const typeOptions = computed(() => [
  { title: t('DrillingReportsModule.common.contract'), value: 'contract' },
  { title: t('DrillingReportsModule.common.permit'), value: 'permit' },
  { title: t('DrillingReportsModule.common.report'), value: 'report' },
  { title: t('DrillingReportsModule.common.image'), value: 'image' },
  { title: t('DrillingReportsModule.common.other'), value: 'other' },
])

const entityTypeOptions = computed(() => [
  { title: t('DrillingReportsModule.common.project'), value: 'project' },
  { title: t('DrillingReportsModule.common.well'), value: 'well' },
  { title: t('DrillingReportsModule.common.tool'), value: 'tool' },
  { title: t('DrillingReportsModule.common.employee'), value: 'employee' },
  { title: t('DrillingReportsModule.common.equipment'), value: 'equipment' },
  { title: t('DrillingReportsModule.common.drillingReport'), value: 'drilling_report' },
])

const getTypeColor = (type: string) => {
  const colors = {
    contract: 'primary',
    permit: 'secondary',
    report: 'success',
    image: 'warning',
    other: 'info',
  }

  return colors[type] || 'grey'
}

const getTypeLabel = (type: string) => {
  const option = typeOptions.value.find(opt => opt.value === type)

  return option ? option.title : type
}

const getEntityTypeColor = (entityType: string) => {
  const colors = {
    project: 'primary',
    well: 'secondary',
    tool: 'success',
    employee: 'warning',
    equipment: 'info',
    drilling_report: 'error',
  }

  return colors[entityType] || 'grey'
}

const getEntityTypeLabel = (entityType: string) => {
  const option = entityTypeOptions.value.find(opt => opt.value === entityType)

  return option ? option.title : entityType
}

const formatFileSize = (bytes: number) => {
  if (!bytes)
    return '-'
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

const handleSearch = () => {
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadDocuments()
  }, 300)
}

let searchTimeout: NodeJS.Timeout

const handleFilterChange = () => {
  loadDocuments()
}

const handlePageChange = (page: number) => {
  documentsStore.setPage(page)
  loadDocuments()
}

const handleItemsPerPageChange = (itemsPerPage: number) => {
  documentsStore.setItemsPerPage(itemsPerPage)
  loadDocuments()
}

const handleCreateDocument = () => {
  isEditing.value = false
  selectedDocument.value = null
  showDocumentDialog.value = true
}

const handleViewDocument = (document: any) => {
  // Navigate to document detail view
  console.log('View document:', document)
}

const handleDownloadDocument = async (document: any) => {
  try {
    await documentsStore.downloadDocument(document.id)
  }
  catch (error) {
    console.error('Error downloading document:', error)
  }
}

const handleEditDocument = (document: any) => {
  isEditing.value = true
  selectedDocument.value = document
  showDocumentDialog.value = true
}

const handleDeleteDocument = async (document: any) => {
  if (confirm(t('DrillingReportsModule.common.confirmDelete'))) {
    try {
      await documentsStore.deleteDocument(document.id)
      loadDocuments()
    }
    catch (error) {
      console.error('Error deleting document:', error)
    }
  }
}

const handleDocumentSubmit = async () => {
  showDocumentDialog.value = false
  loadDocuments()
}

const loadDocuments = async () => {
  loading.value = true
  try {
    await documentsStore.fetchDocuments({
      search: filters.value.search,
      type: filters.value.type,
      entity_type: filters.value.entity_type,
    })
  }
  catch (error) {
    console.error('Error loading documents:', error)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDocuments()
})
</script>

<template>
  <div class="documents-list">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="tabler-file-text"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.documents.title') }}
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
              v-model="filters.type"
              :items="typeOptions"
              :label="$t('DrillingReportsModule.documents.type')"
              clearable
              @change="handleFilterChange"
            />
          </VCol>
          <VCol
            cols="12"
            md="3"
          >
            <VSelect
              v-model="filters.entity_type"
              :items="entityTypeOptions"
              :label="$t('DrillingReportsModule.common.entityType')"
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
              @click="handleCreateDocument"
            >
              <VIcon
                icon="tabler-plus"
                class="me-2"
              />
              {{ $t('DrillingReportsModule.common.create') }}
            </VBtn>
          </VCol>
        </VRow>

        <!-- Documents Table -->
        <VDataTable
          :headers="headers"
          :items="documents"
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
              @click="handleViewDocument(item)"
            >
              {{ item.name }}
            </VBtn>
          </template>

          <template #item.type="{ item }">
            <VChip
              :color="getTypeColor(item.type)"
              size="small"
            >
              {{ getTypeLabel(item.type) }}
            </VChip>
          </template>

          <template #item.entity_type="{ item }">
            <VChip
              :color="getEntityTypeColor(item.entity_type)"
              size="small"
            >
              {{ getEntityTypeLabel(item.entity_type) }}
            </VChip>
          </template>

          <template #item.size="{ item }">
            {{ formatFileSize(item.size) }}
          </template>

          <template #item.uploaded_at="{ item }">
            {{ formatDate(item.uploaded_at) }}
          </template>

          <template #item.actions="{ item }">
            <VBtn
              icon="tabler-eye"
              size="small"
              variant="text"
              :disabled="!canView"
              @click="handleViewDocument(item)"
            />
            <VBtn
              icon="tabler-download"
              size="small"
              variant="text"
              :disabled="!canDownload(item)"
              @click="handleDownloadDocument(item)"
            />
            <VBtn
              icon="tabler-edit"
              size="small"
              variant="text"
              :disabled="!canEdit(item)"
              @click="handleEditDocument(item)"
            />
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              :disabled="!canDelete(item)"
              @click="handleDeleteDocument(item)"
            />
          </template>
        </VDataTable>
      </VCardText>
    </VCard>

    <!-- Create/Edit Document Dialog -->
    <VDialog
      v-model="showDocumentDialog"
      max-width="800"
    >
      <DocumentForm
        :document="selectedDocument"
        :is-editing="isEditing"
        :show-close-button="false"
        @submit="handleDocumentSubmit"
        @cancel="showDocumentDialog = false"
      />
    </VDialog>
  </div>
</template>

<style scoped>
.documents-list {
  inline-size: 100%;
}
</style>
