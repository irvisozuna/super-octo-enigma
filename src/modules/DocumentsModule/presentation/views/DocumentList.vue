<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'
import type { DocumentEntity, DocumentFilter } from '../../domain/entities/DocumentEntity'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// Estado local para filtros múltiples
const selectedDocumentTypes = ref<string[]>([])
const selectedCategories = ref<string[]>([])
const selectedStatuses = ref<string[]>([])

// Headers para la tabla
const headers = [
  { title: t('DocumentsModule.document.fields.title'), key: 'title' },
  { title: t('DocumentsModule.document.fields.file_name'), key: 'file_name' },
  { title: t('DocumentsModule.document.fields.document_type'), key: 'document_type' },
  { title: t('DocumentsModule.document.fields.category'), key: 'category' },
  { title: t('DocumentsModule.document.fields.resource_type'), key: 'resource_type' },
  { title: t('DocumentsModule.document.fields.file_size'), key: 'file_size' },
  { title: t('DocumentsModule.common.status'), key: 'status' },
  { title: t('DocumentsModule.common.actions'), key: 'actions', sortable: false },
]

// Opciones del menú de exportación
const menuOptions = [
  {
    text: t('DocumentsModule.common.export_excel'),
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: t('DocumentsModule.common.export_pdf'),
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
  {
    text: t('DocumentsModule.common.export_csv'),
    icon: 'tabler-file-text',
    action: () => exportItems('csv'),
  },
]

// Estado local
const searchQuery = ref('')
const showFilters = ref(false)
const selectedItems = ref<string[]>([])
const showBulkActions = ref(false)

// Computed
const filteredItems = computed(() => {
  return documentStore.items
})

const hasSelectedItems = computed(() => selectedItems.value.length > 0)

const canCreate = computed(() => {
  // Add permission check here
  return true
})

const canEdit = computed(() => {
  // Add permission check here
  return true
})

const canDelete = computed(() => {
  // Add permission check here
  return true
})

// Watchers
watch(searchQuery, debounce((newQuery: string) => {
  documentStore.setFilters({ search: newQuery, page: 1 })
  documentStore.fetchDocuments()
}, 300))

watch(() => documentStore.filters, newFilters => {
  // Update local filter states when store filters change
  selectedDocumentTypes.value = newFilters.document_type ? [newFilters.document_type] : []
  selectedCategories.value = newFilters.category ? [newFilters.category] : []
  selectedStatuses.value = newFilters.status ? [newFilters.status] : []
}, { deep: true })

// Methods
const loadDocuments = async () => {
  await documentStore.fetchDocuments()
}

const handleSearch = () => {
  documentStore.setFilters({ search: searchQuery.value, page: 1 })
  documentStore.fetchDocuments()
}

const handleFilterChange = () => {
  const filters: Partial<DocumentFilter> = {
    page: 1,
    document_type: selectedDocumentTypes.value.length === 1 ? selectedDocumentTypes.value[0] : undefined,
    category: selectedCategories.value.length === 1 ? selectedCategories.value[0] : undefined,
    status: selectedStatuses.value.length === 1 ? selectedStatuses.value[0] : undefined,
  }

  documentStore.setFilters(filters)
  documentStore.fetchDocuments()
}

const clearFilters = () => {
  selectedDocumentTypes.value = []
  selectedCategories.value = []
  selectedStatuses.value = []
  searchQuery.value = ''
  documentStore.resetFilters()
  documentStore.fetchDocuments()
}

const handlePageChange = (page: number) => {
  documentStore.setFilters({ page })
  documentStore.fetchDocuments()
}

const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
  documentStore.setFilters({ sort_by: sortBy, sort_order: sortOrder })
  documentStore.fetchDocuments()
}

const handleCreate = () => {
  router.push({ name: 'documents-create' })
}

const handleEdit = (document: DocumentEntity) => {
  router.push({ name: 'documents-edit', params: { id: document.id } })
}

const handleView = (document: DocumentEntity) => {
  router.push({ name: 'documents-detail', params: { id: document.id } })
}

const handleDelete = async (document: DocumentEntity) => {
  if (confirm(t('DocumentsModule.messages.confirm_delete', { title: document.title }))) {
    try {
      await documentStore.deleteDocument(document.id)
      await loadDocuments()
    }
    catch (error) {
      console.error('Error deleting document:', error)
    }
  }
}

const handleBulkDelete = async () => {
  if (confirm(t('DocumentsModule.messages.confirm_bulk_delete', { count: selectedItems.value.length }))) {
    try {
      await documentStore.bulkDeleteDocuments(selectedItems.value)
      selectedItems.value = []
      showBulkActions.value = false
      await loadDocuments()
    }
    catch (error) {
      console.error('Error bulk deleting documents:', error)
    }
  }
}

const handleBulkExport = async () => {
  try {
    const filter: DocumentFilter = {
      ...documentStore.filters,

      // Add filter for selected items if needed
    }

    const blob = await documentStore.exportDocuments(filter, 'excel')

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `documents-${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
  catch (error) {
    console.error('Error exporting documents:', error)
  }
}

const exportItems = async (format: 'excel' | 'pdf' | 'csv') => {
  try {
    const blob = await documentStore.exportDocuments(documentStore.filters, format)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `documents-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
  catch (error) {
    console.error('Error exporting documents:', error)
  }
}

const getDocumentIcon = (document: DocumentEntity): string => {
  return documentStore.getDocumentIcon(document)
}

const getStatusColor = (status: string): string => {
  const colors = {
    draft: 'grey',
    active: 'success',
    archived: 'warning',
    deleted: 'error',
  }

  return colors[status as keyof typeof colors] || 'grey'
}

const getStatusLabel = (status: string): string => {
  return documentStore.statusOptions.find(option => option.value === status)?.label || status
}

const getDocumentTypeLabel = (type: string): string => {
  return documentStore.documentTypeOptions.find(option => option.value === type)?.label || type
}

const getCategoryLabel = (category: string): string => {
  return documentStore.categoryOptions.find(option => option.value === category)?.label || category
}

const formatFileSize = (size: number): string => {
  if (size === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(size) / Math.log(k))

  return `${Number.parseFloat((size / k ** i).toFixed(2))} ${sizes[i]}`
}

const handleSelectionChange = (selection: string[]) => {
  selectedItems.value = selection
  showBulkActions.value = selection.length > 0
}

// Lifecycle
onMounted(() => {
  loadDocuments()
})
</script>

<template>
  <div class="document-list">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.subtitle') }}
        </p>
      </div>

      <div class="d-flex gap-3">
        <VBtn
          v-if="canCreate"
          color="primary"
          prepend-icon="tabler-plus"
          @click="handleCreate"
        >
          {{ t('DocumentsModule.common.create') }}
        </VBtn>
      </div>
    </div>

    <!-- Search and Filters -->
    <VCard class="mb-6">
      <VCardText>
        <div class="d-flex gap-4 align-center">
          <!-- Search -->
          <VTextField
            v-model="searchQuery"
            :placeholder="t('DocumentsModule.common.search_placeholder')"
            prepend-inner-icon="tabler-search"
            variant="outlined"
            density="compact"
            class="flex-grow-1"
            clearable
            @keyup.enter="handleSearch"
          />

          <!-- Filter Toggle -->
          <VBtn
            variant="outlined"
            prepend-icon="tabler-filter"
            @click="showFilters = !showFilters"
          >
            {{ t('DocumentsModule.common.filters') }}
          </VBtn>

          <!-- Clear Filters -->
          <VBtn
            variant="text"
            prepend-icon="tabler-x"
            @click="clearFilters"
          >
            {{ t('DocumentsModule.common.clear_filters') }}
          </VBtn>
        </div>

        <!-- Advanced Filters -->
        <VExpandTransition>
          <div
            v-if="showFilters"
            class="mt-4"
          >
            <VRow>
              <VCol
                cols="12"
                md="3"
              >
                <VSelect
                  v-model="selectedDocumentTypes"
                  :items="documentStore.documentTypeOptions"
                  :label="t('DocumentsModule.document.fields.document_type')"
                  variant="outlined"
                  density="compact"
                  multiple
                  clearable
                  @update:model-value="handleFilterChange"
                />
              </VCol>

              <VCol
                cols="12"
                md="3"
              >
                <VSelect
                  v-model="selectedCategories"
                  :items="documentStore.categoryOptions"
                  :label="t('DocumentsModule.document.fields.category')"
                  variant="outlined"
                  density="compact"
                  multiple
                  clearable
                  @update:model-value="handleFilterChange"
                />
              </VCol>

              <VCol
                cols="12"
                md="3"
              >
                <VSelect
                  v-model="selectedStatuses"
                  :items="documentStore.statusOptions"
                  :label="t('DocumentsModule.common.status')"
                  variant="outlined"
                  density="compact"
                  multiple
                  clearable
                  @update:model-value="handleFilterChange"
                />
              </VCol>

              <VCol
                cols="12"
                md="3"
              >
                <VTextField
                  v-model="documentStore.filters.resource_type"
                  :label="t('DocumentsModule.document.fields.resource_type')"
                  variant="outlined"
                  density="compact"
                  clearable
                  @update:model-value="handleFilterChange"
                />
              </VCol>
            </VRow>
          </div>
        </VExpandTransition>
      </VCardText>
    </VCard>

    <!-- Bulk Actions -->
    <VCard
      v-if="showBulkActions"
      class="mb-6"
    >
      <VCardText>
        <div class="d-flex align-center gap-3">
          <span class="text-body-1">
            {{ t('DocumentsModule.common.selected_items', { count: selectedItems.length }) }}
          </span>

          <VBtn
            color="error"
            variant="outlined"
            prepend-icon="tabler-trash"
            @click="handleBulkDelete"
          >
            {{ t('DocumentsModule.common.bulk_delete') }}
          </VBtn>

          <VBtn
            color="primary"
            variant="outlined"
            prepend-icon="tabler-download"
            @click="handleBulkExport"
          >
            {{ t('DocumentsModule.common.bulk_export') }}
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Documents Table -->
    <VCard>
      <VDataTable
        v-model="selectedItems"
        :headers="headers"
        :items="filteredItems"
        :loading="documentStore.isLoading"
        :items-per-page="documentStore.filters.per_page"
        :page="documentStore.currentPage"
        :server-items-length="documentStore.totalItems"
        show-select
        item-value="id"
        @update:page="handlePageChange"
        @update:sort-by="handleSort"
      >
        <!-- Title Column -->
        <template #item.title="{ item }">
          <div class="d-flex align-center gap-3">
            <VIcon
              :icon="getDocumentIcon(item)"
              size="24"
            />
            <div>
              <div class="font-weight-medium">
                {{ item.title }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.resource_type }} - {{ item.resource_id }}
              </div>
            </div>
          </div>
        </template>

        <!-- File Name Column -->
        <template #item.file_name="{ item }">
          <div
            class="text-truncate"
            style="max-inline-size: 200px;"
          >
            {{ item.file_name }}
          </div>
        </template>

        <!-- Document Type Column -->
        <template #item.document_type="{ item }">
          <VChip
            :color="item.document_type === 'contract' ? 'primary' : 'default'"
            size="small"
            variant="tonal"
          >
            {{ getDocumentTypeLabel(item.document_type) }}
          </VChip>
        </template>

        <!-- Category Column -->
        <template #item.category="{ item }">
          <VChip
            :color="item.category === 'legal' ? 'success' : 'default'"
            size="small"
            variant="tonal"
          >
            {{ getCategoryLabel(item.category) }}
          </VChip>
        </template>

        <!-- Resource Type Column -->
        <template #item.resource_type="{ item }">
          <VChip
            size="small"
            variant="outlined"
          >
            {{ item.resource_type }}
          </VChip>
        </template>

        <!-- File Size Column -->
        <template #item.file_size="{ item }">
          <span class="text-body-2">
            {{ item.file_size_formatted }}
          </span>
        </template>

        <!-- Status Column -->
        <template #item.status="{ item }">
          <VChip
            :color="getStatusColor(item.status)"
            size="small"
            variant="tonal"
          >
            {{ getStatusLabel(item.status) }}
          </VChip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <VBtn
              icon="tabler-eye"
              size="small"
              variant="text"
              @click="handleView(item)"
            />

            <VBtn
              v-if="canEdit"
              icon="tabler-edit"
              size="small"
              variant="text"
              @click="handleEdit(item)"
            />

            <VBtn
              v-if="canDelete"
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click="handleDelete(item)"
            />
          </div>
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="text-center py-8">
            <VIcon
              icon="tabler-file-off"
              size="48"
              class="text-medium-emphasis mb-4"
            />
            <div class="text-h6 mb-2">
              {{ t('DocumentsModule.common.no_data') }}
            </div>
            <div class="text-body-2 text-medium-emphasis mb-4">
              {{ t('DocumentsModule.common.no_data_description') }}
            </div>
            <VBtn
              v-if="canCreate"
              color="primary"
              prepend-icon="tabler-plus"
              @click="handleCreate"
            >
              {{ t('DocumentsModule.common.create_first') }}
            </VBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Pagination -->
      <template #bottom>
        <div class="d-flex justify-space-between align-center pa-4">
          <div class="text-body-2 text-medium-emphasis">
            {{ t('DocumentsModule.common.showing_results', {
              from: ((documentStore.currentPage - 1) * documentStore.filters.per_page) + 1,
              to: Math.min(documentStore.currentPage * documentStore.filters.per_page, documentStore.totalItems),
              total: documentStore.totalItems,
            }) }}
          </div>

          <div class="d-flex gap-2">
            <VMenu>
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  variant="outlined"
                  prepend-icon="tabler-download"
                >
                  {{ t('DocumentsModule.common.export') }}
                </VBtn>
              </template>

              <VList>
                <VListItem
                  v-for="option in menuOptions"
                  :key="option.text"
                  @click="option.action"
                >
                  <template #prepend>
                    <VIcon :icon="option.icon" />
                  </template>
                  <VListItemTitle>{{ option.text }}</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </div>
        </div>
      </template>
    </VCard>
  </div>
</template>

<style scoped>
.document-list {
  padding: 24px;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
