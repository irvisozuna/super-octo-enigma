<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Document } from '../../../domain/entities/DocumentEntity'
import { formatDate } from '../../../shared/utils/dateUtils'

export interface ProjectDocumentsTabProps {
  documents: Document[]
  loading?: boolean
  projectId: string
}

const props = defineProps<ProjectDocumentsTabProps>()

const emit = defineEmits<{
  'upload': [data: any]
  'download': [document: Document]
  'view': [document: Document]
  'edit': [document: Document]
  'delete': [document: Document]
}>()

// State
const showFilters = ref(false)
const uploadDialog = ref(false)
const uploading = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(12)

const filters = ref({
  search: '',
  documentType: null as string | null,
  sortBy: 'newest',
})

const uploadData = ref({
  file: null as File[] | null,
  name: '',
  description: '',
  documentType: null as string | null,
})

const uploadForm = ref()

// Constants
const documentTypes = [
  { label: 'Reporte', value: 'report' },
  { label: 'Permiso', value: 'permit' },
  { label: 'Certificado', value: 'certificate' },
  { label: 'Manual', value: 'manual' },
  { label: 'Otro', value: 'other' },
]

const sortOptions = [
  { label: 'Más Recientes', value: 'newest' },
  { label: 'Más Antiguos', value: 'oldest' },
  { label: 'Nombre (A-Z)', value: 'name-asc' },
  { label: 'Nombre (Z-A)', value: 'name-desc' },
  { label: 'Tamaño (Mayor)', value: 'size-desc' },
  { label: 'Tamaño (Menor)', value: 'size-asc' },
]

// Computed
const totalDocuments = computed(() => props.documents.length)

const filteredDocuments = computed(() => {
  let result = [...props.documents]

  // Filter by search
  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()

    result = result.filter(doc =>
      doc.name.toLowerCase().includes(searchLower)
      || doc.description?.toLowerCase().includes(searchLower),
    )
  }

  // Filter by type
  if (filters.value.documentType)
    result = result.filter(doc => doc.document_type === filters.value.documentType)

  // Sort
  switch (filters.value.sortBy) {
  case 'newest':
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    break
  case 'oldest':
    result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    break
  case 'name-asc':
    result.sort((a, b) => a.name.localeCompare(b.name))
    break
  case 'name-desc':
    result.sort((a, b) => b.name.localeCompare(a.name))
    break
  case 'size-desc':
    result.sort((a, b) => b.file_size - a.file_size)
    break
  case 'size-asc':
    result.sort((a, b) => a.file_size - b.file_size)
    break
  }

  return result
})

const totalPages = computed(() =>
  Math.ceil(filteredDocuments.value.length / itemsPerPage.value),
)

const paginatedDocuments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value

  return filteredDocuments.value.slice(start, end)
})

// Methods
const getDocumentTypeIcon = (type: string) => {
  const icons = {
    report: 'tabler-file-text',
    permit: 'tabler-license',
    certificate: 'tabler-certificate',
    manual: 'tabler-book',
    other: 'tabler-file',
  }

  return icons[type] || 'tabler-file'
}

const getDocumentTypeColor = (type: string) => {
  const colors = {
    report: 'primary',
    permit: 'warning',
    certificate: 'success',
    manual: 'info',
    other: 'grey',
  }

  return colors[type] || 'grey'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0)
    return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round(bytes / k ** i * 100) / 100} ${sizes[i]}`
}

const clearFilters = () => {
  filters.value = {
    search: '',
    documentType: null,
    sortBy: 'newest',
  }
}

const openUploadDialog = () => {
  uploadDialog.value = true
}

const closeUploadDialog = () => {
  uploadDialog.value = false
  uploadData.value = {
    file: null,
    name: '',
    description: '',
    documentType: null,
  }
  uploadForm.value?.reset()
}

const handleUpload = async () => {
  const { valid } = await uploadForm.value.validate()
  if (!valid)
    return

  uploading.value = true
  try {
    emit('upload', {
      file: uploadData.value.file?.[0],
      name: uploadData.value.name,
      description: uploadData.value.description,
      document_type: uploadData.value.documentType,
      related_entity_type: 'project',
      related_entity_id: props.projectId,
    })
    closeUploadDialog()
  }
  finally {
    uploading.value = false
  }
}

const downloadDocument = (document: Document) => {
  emit('download', document)
}

const viewDocument = (document: Document) => {
  emit('view', document)
}

const editDocument = (document: Document) => {
  emit('edit', document)
}

const deleteDocument = (document: Document) => {
  emit('delete', document)
}
</script>

<template>
  <div class="project-documents-tab">
    <!-- Header with Actions -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h6 class="text-h6 mb-1">
          Documentos del Proyecto
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ totalDocuments }} {{ totalDocuments === 1 ? 'documento' : 'documentos' }} en total
        </p>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          variant="tonal"
          color="primary"
          prepend-icon="tabler-filter"
          @click="showFilters = !showFilters"
        >
          Filtros
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="tabler-upload"
          @click="openUploadDialog"
        >
          Subir Documento
        </VBtn>
      </div>
    </div>

    <!-- Filters -->
    <VExpandTransition>
      <VCard
        v-show="showFilters"
        variant="outlined"
        class="mb-6"
      >
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="4"
            >
              <VTextField
                v-model="filters.search"
                label="Buscar"
                placeholder="Nombre o descripción..."
                prepend-inner-icon="tabler-search"
                clearable
                density="compact"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="filters.documentType"
                label="Tipo de Documento"
                :items="documentTypes"
                item-title="label"
                item-value="value"
                clearable
                density="compact"
              />
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VSelect
                v-model="filters.sortBy"
                label="Ordenar por"
                :items="sortOptions"
                item-title="label"
                item-value="value"
                density="compact"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VExpandTransition>

    <!-- Documents Grid/List -->
    <VRow v-if="filteredDocuments.length > 0">
      <VCol
        v-for="document in paginatedDocuments"
        :key="document.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <VCard
          variant="outlined"
          class="document-card"
          hover
        >
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-3">
              <VAvatar
                :color="getDocumentTypeColor(document.document_type)"
                size="48"
                variant="tonal"
              >
                <VIcon
                  :icon="getDocumentTypeIcon(document.document_type)"
                  size="24"
                />
              </VAvatar>
              <VMenu location="bottom end">
                <template #activator="{ props: menuProps }">
                  <VBtn
                    v-bind="menuProps"
                    icon="tabler-dots-vertical"
                    variant="text"
                    size="small"
                  />
                </template>
                <VList>
                  <VListItem @click="downloadDocument(document)">
                    <template #prepend>
                      <VIcon icon="tabler-download" />
                    </template>
                    <VListItemTitle>Descargar</VListItemTitle>
                  </VListItem>
                  <VListItem @click="viewDocument(document)">
                    <template #prepend>
                      <VIcon icon="tabler-eye" />
                    </template>
                    <VListItemTitle>Ver</VListItemTitle>
                  </VListItem>
                  <VListItem @click="editDocument(document)">
                    <template #prepend>
                      <VIcon icon="tabler-edit" />
                    </template>
                    <VListItemTitle>Editar</VListItemTitle>
                  </VListItem>
                  <VDivider />
                  <VListItem
                    class="text-error"
                    @click="deleteDocument(document)"
                  >
                    <template #prepend>
                      <VIcon
                        icon="tabler-trash"
                        color="error"
                      />
                    </template>
                    <VListItemTitle>Eliminar</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </div>

            <VTooltip location="top">
              <template #activator="{ props: tooltipProps }">
                <h6
                  v-bind="tooltipProps"
                  class="text-h6 mb-1 text-truncate"
                >
                  {{ document.name }}
                </h6>
              </template>
              {{ document.name }}
            </VTooltip>

            <p class="text-caption text-medium-emphasis mb-3 line-clamp-2">
              {{ document.description || 'Sin descripción' }}
            </p>

            <VDivider class="mb-3" />

            <div class="document-meta">
              <div class="d-flex align-center gap-2 mb-2">
                <VIcon
                  icon="tabler-file"
                  size="16"
                  class="text-medium-emphasis"
                />
                <span class="text-caption">{{ formatFileSize(document.file_size) }}</span>
              </div>
              <div class="d-flex align-center gap-2 mb-2">
                <VIcon
                  icon="tabler-user"
                  size="16"
                  class="text-medium-emphasis"
                />
                <span class="text-caption">{{ document.uploaded_by_name }}</span>
              </div>
              <div class="d-flex align-center gap-2">
                <VIcon
                  icon="tabler-calendar"
                  size="16"
                  class="text-medium-emphasis"
                />
                <span class="text-caption">{{ formatDate(document.created_at) }}</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Empty State -->
    <VCard
      v-else
      variant="outlined"
      class="text-center pa-12"
    >
      <VIcon
        icon="tabler-files-off"
        size="64"
        class="text-medium-emphasis mb-4"
      />
      <h5 class="text-h5 mb-2">
        No hay documentos
      </h5>
      <p class="text-body-2 text-medium-emphasis mb-6">
        {{ filters.search || filters.documentType ? 'No se encontraron documentos con los filtros aplicados' : 'Comienza subiendo tu primer documento' }}
      </p>
      <VBtn
        v-if="!filters.search && !filters.documentType"
        color="primary"
        prepend-icon="tabler-upload"
        @click="openUploadDialog"
      >
        Subir Primer Documento
      </VBtn>
      <VBtn
        v-else
        variant="tonal"
        @click="clearFilters"
      >
        Limpiar Filtros
      </VBtn>
    </VCard>

    <!-- Pagination -->
    <div
      v-if="filteredDocuments.length > itemsPerPage"
      class="d-flex justify-center mt-6"
    >
      <VPagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="5"
      />
    </div>

    <!-- Upload Dialog -->
    <VDialog
      v-model="uploadDialog"
      max-width="600"
    >
      <VCard>
        <VCardTitle class="d-flex align-center gap-2">
          <VIcon icon="tabler-upload" />
          Subir Documento
        </VCardTitle>

        <VCardText>
          <VForm
            ref="uploadForm"
            @submit.prevent="handleUpload"
          >
            <VRow>
              <VCol cols="12">
                <VFileInput
                  v-model="uploadData.file"
                  label="Archivo"
                  prepend-icon="tabler-paperclip"
                  show-size
                  :rules="[v => !!v || 'El archivo es requerido']"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="uploadData.name"
                  label="Nombre del Documento"
                  :rules="[v => !!v || 'El nombre es requerido']"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="uploadData.description"
                  label="Descripción"
                  rows="3"
                  placeholder="Descripción opcional del documento..."
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  v-model="uploadData.documentType"
                  label="Tipo de Documento"
                  :items="documentTypes"
                  item-title="label"
                  item-value="value"
                  :rules="[v => !!v || 'El tipo es requerido']"
                  required
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="closeUploadDialog"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            :loading="uploading"
            @click="handleUpload"
          >
            Subir
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped lang="scss">
.project-documents-tab {
  padding: 1.5rem;
}

.document-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.document-meta {
  font-size: 0.75rem;
}
</style>
