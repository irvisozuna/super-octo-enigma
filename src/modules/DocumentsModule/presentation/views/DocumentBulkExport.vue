<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'
import type { DocumentEntity } from '../../domain/entities/DocumentEntity'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// State
const selectedDocuments = ref<string[]>([])
const documents = ref<DocumentEntity[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const exporting = ref(false)
const exportProgress = ref(0)

// Export options
const exportOptions = ref({
  format: 'zip',
  include_metadata: true,
  include_versions: false,
  include_share_links: false,
  compression_level: 'medium',
})

// Computed
const hasSelection = computed(() => selectedDocuments.value.length > 0)
const selectedCount = computed(() => selectedDocuments.value.length)
const allSelected = computed(() => selectedDocuments.value.length === documents.value.length)
const someSelected = computed(() => selectedDocuments.value.length > 0 && selectedDocuments.value.length < documents.value.length)

// Methods
const loadDocuments = async () => {
  try {
    loading.value = true
    error.value = null

    documents.value = await documentStore.fetchDocuments()
  }
  catch (err) {
    error.value = 'Error al cargar los documentos'
    console.error('Error loading documents:', err)
  }
  finally {
    loading.value = false
  }
}

const handleSelectAll = () => {
  if (allSelected.value)
    selectedDocuments.value = []
  else
    selectedDocuments.value = documents.value.map(doc => doc.id)
}

const handleSelectDocument = (documentId: string) => {
  const index = selectedDocuments.value.indexOf(documentId)
  if (index > -1)
    selectedDocuments.value.splice(index, 1)
  else
    selectedDocuments.value.push(documentId)
}

const exportSelected = async () => {
  if (!hasSelection.value)
    return

  try {
    exporting.value = true
    exportProgress.value = 0

    // Simulate progress
    for (let progress = 0; progress <= 100; progress += 10) {
      exportProgress.value = progress
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Export the selected documents
    const blob = await documentStore.bulkExportDocuments(selectedDocuments.value, exportOptions.value)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `documents-export-${new Date().toISOString().split('T')[0]}.${exportOptions.value.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Reset selection
    selectedDocuments.value = []
  }
  catch (err) {
    console.error('Error exporting documents:', err)
  }
  finally {
    exporting.value = false
    exportProgress.value = 0
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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

// Lifecycle
onMounted(() => {
  loadDocuments()
})
</script>

<template>
  <div class="document-bulk-export">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.bulk_export') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.bulk_export_subtitle') }}
        </p>
      </div>

      <VBtn
        variant="outlined"
        prepend-icon="tabler-arrow-left"
        @click="router.push({ name: 'documents-list' })"
      >
        {{ t('DocumentsModule.common.back') }}
      </VBtn>
    </div>

    <VRow>
      <!-- Documents List -->
      <VCol
        cols="12"
        lg="8"
      >
        <!-- Selection Summary -->
        <VCard
          v-if="hasSelection"
          class="mb-6"
        >
          <VCardText>
            <div class="d-flex justify-space-between align-center">
              <div class="d-flex align-center gap-3">
                <VIcon
                  icon="tabler-check-circle"
                  color="primary"
                  size="24"
                />
                <div>
                  <div class="font-weight-medium">
                    {{ selectedCount }} {{ t('DocumentsModule.document.selected_documents') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ t('DocumentsModule.document.selected_documents_subtitle') }}
                  </div>
                </div>
              </div>

              <div class="d-flex gap-2">
                <VBtn
                  color="primary"
                  prepend-icon="tabler-download"
                  :loading="exporting"
                  :disabled="!hasSelection"
                  @click="exportSelected"
                >
                  {{ t('DocumentsModule.document.export_selected') }}
                </VBtn>

                <VBtn
                  variant="outlined"
                  prepend-icon="tabler-x"
                  @click="selectedDocuments = []"
                >
                  {{ t('DocumentsModule.common.clear_selection') }}
                </VBtn>
              </div>
            </div>

            <!-- Export Progress -->
            <div
              v-if="exporting"
              class="mt-4"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2">{{ t('DocumentsModule.document.exporting') }}...</span>
                <span class="text-body-2 font-weight-medium">{{ exportProgress }}%</span>
              </div>
              <VProgressLinear
                :model-value="exportProgress"
                color="primary"
                height="8"
                rounded
              />
            </div>
          </VCardText>
        </VCard>

        <!-- Loading State -->
        <div
          v-if="loading"
          class="text-center py-8"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="64"
          />
          <div class="text-h6 mt-4">
            {{ t('DocumentsModule.common.loading') }}
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="text-center py-8"
        >
          <VIcon
            icon="tabler-alert-circle"
            size="64"
            color="error"
            class="mb-4"
          />
          <div class="text-h6 mb-2">
            {{ t('DocumentsModule.common.error') }}
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            {{ error }}
          </div>
          <VBtn
            color="primary"
            @click="loadDocuments"
          >
            {{ t('DocumentsModule.common.refresh') }}
          </VBtn>
        </div>

        <!-- Documents List -->
        <div v-else>
          <VCard v-if="documents.length === 0">
            <VCardText class="text-center py-8">
              <VIcon
                icon="tabler-file-off"
                size="48"
                class="text-medium-emphasis mb-4"
              />
              <div class="text-h6 mb-2">
                {{ t('DocumentsModule.common.no_data') }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                {{ t('DocumentsModule.document.no_documents') }}
              </div>
            </VCardText>
          </VCard>

          <div v-else>
            <!-- Select All -->
            <VCard class="mb-4">
              <VCardText>
                <div class="d-flex align-center gap-3">
                  <VCheckbox
                    :model-value="allSelected"
                    :indeterminate="someSelected"
                    @click="handleSelectAll"
                  />

                  <div class="flex-grow-1">
                    <div class="font-weight-medium">
                      {{ t('DocumentsModule.document.select_all_documents') }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ t('DocumentsModule.document.select_all_subtitle') }}
                    </div>
                  </div>

                  <div class="text-body-2 text-medium-emphasis">
                    {{ documents.length }} {{ t('DocumentsModule.document.total_documents') }}
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- Documents List -->
            <div class="d-flex flex-column gap-4">
              <VCard
                v-for="document in documents"
                :key="document.id"
                :class="{ 'border-primary': selectedDocuments.includes(document.id) }"
              >
                <VCardText>
                  <div class="d-flex align-center gap-4">
                    <VCheckbox
                      :model-value="selectedDocuments.includes(document.id)"
                      @click="handleSelectDocument(document.id)"
                    />

                    <VIcon
                      :icon="getDocumentIcon(document)"
                      size="32"
                    />

                    <div class="flex-grow-1">
                      <div class="d-flex justify-space-between align-start mb-2">
                        <div>
                          <h3 class="text-h6 font-weight-medium mb-1">
                            {{ document.title }}
                          </h3>

                          <div class="text-body-2 text-medium-emphasis mb-2">
                            {{ document.file_name }} • {{ document.file_size_formatted }}
                          </div>

                          <div class="d-flex flex-wrap gap-3 text-caption text-medium-emphasis">
                            <div class="d-flex align-center gap-1">
                              <VIcon
                                icon="tabler-file"
                                size="16"
                              />
                              {{ getDocumentTypeLabel(document.document_type) }}
                            </div>

                            <div class="d-flex align-center gap-1">
                              <VIcon
                                icon="tabler-folder"
                                size="16"
                              />
                              {{ getCategoryLabel(document.category) }}
                            </div>

                            <div class="d-flex align-center gap-1">
                              <VIcon
                                icon="tabler-calendar"
                                size="16"
                              />
                              {{ formatDate(document.created_at) }}
                            </div>

                            <div class="d-flex align-center gap-1">
                              <VIcon
                                icon="tabler-user"
                                size="16"
                              />
                              {{ document.uploaded_by_user?.name || document.uploaded_by }}
                            </div>
                          </div>
                        </div>

                        <VChip
                          :color="getStatusColor(document.status)"
                          size="small"
                          variant="tonal"
                        >
                          {{ getStatusLabel(document.status) }}
                        </VChip>
                      </div>

                      <div
                        v-if="document.description"
                        class="text-body-2 mt-2"
                      >
                        {{ document.description }}
                      </div>

                      <div
                        v-if="document.tags && document.tags.length > 0"
                        class="d-flex flex-wrap gap-2 mt-3"
                      >
                        <VChip
                          v-for="tag in document.tags"
                          :key="tag"
                          size="small"
                          variant="outlined"
                        >
                          {{ tag }}
                        </VChip>
                      </div>
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </div>
          </div>
        </div>
      </VCol>

      <!-- Export Options -->
      <VCol
        cols="12"
        lg="4"
      >
        <VCard>
          <VCardTitle>
            {{ t('DocumentsModule.document.export_options') }}
          </VCardTitle>

          <VCardText>
            <VForm>
              <VRow>
                <VCol cols="12">
                  <VSelect
                    v-model="exportOptions.format"
                    :items="[
                      { value: 'zip', title: 'ZIP Archive' },
                      { value: 'tar', title: 'TAR Archive' },
                      { value: '7z', title: '7-Zip Archive' },
                    ]"
                    :label="t('DocumentsModule.document.export_format')"
                    variant="outlined"
                  />
                </VCol>

                <VCol cols="12">
                  <VSelect
                    v-model="exportOptions.compression_level"
                    :items="[
                      { value: 'low', title: 'Low Compression' },
                      { value: 'medium', title: 'Medium Compression' },
                      { value: 'high', title: 'High Compression' },
                    ]"
                    :label="t('DocumentsModule.document.compression_level')"
                    variant="outlined"
                  />
                </VCol>

                <VCol cols="12">
                  <VSwitch
                    v-model="exportOptions.include_metadata"
                    :label="t('DocumentsModule.document.include_metadata')"
                    color="primary"
                  />
                </VCol>

                <VCol cols="12">
                  <VSwitch
                    v-model="exportOptions.include_versions"
                    :label="t('DocumentsModule.document.include_versions')"
                    color="primary"
                  />
                </VCol>

                <VCol cols="12">
                  <VSwitch
                    v-model="exportOptions.include_share_links"
                    :label="t('DocumentsModule.document.include_share_links')"
                    color="primary"
                  />
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>

        <!-- Export Summary -->
        <VCard
          v-if="hasSelection"
          class="mt-6"
        >
          <VCardTitle>
            {{ t('DocumentsModule.document.export_summary') }}
          </VCardTitle>

          <VCardText>
            <div class="d-flex flex-column gap-3">
              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ t('DocumentsModule.document.files_selected') }}:</span>
                <span class="text-body-2 font-weight-medium">{{ selectedCount }}</span>
              </div>

              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ t('DocumentsModule.document.export_format') }}:</span>
                <span class="text-body-2 font-weight-medium">{{ exportOptions.format.toUpperCase() }}</span>
              </div>

              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ t('DocumentsModule.document.compression_level') }}:</span>
                <span class="text-body-2 font-weight-medium">{{ exportOptions.compression_level }}</span>
              </div>

              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ t('DocumentsModule.document.include_metadata') }}:</span>
                <span class="text-body-2 font-weight-medium">
                  {{ exportOptions.include_metadata ? t('DocumentsModule.common.yes') : t('DocumentsModule.common.no') }}
                </span>
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Export Tips -->
        <VCard class="mt-6">
          <VCardTitle>
            {{ t('DocumentsModule.document.export_tips') }}
          </VCardTitle>

          <VCardText>
            <div class="d-flex flex-column gap-3">
              <div class="d-flex align-start gap-3">
                <VIcon
                  icon="tabler-info-circle"
                  size="20"
                  color="info"
                  class="mt-1"
                />
                <div class="text-body-2">
                  {{ t('DocumentsModule.document.tip_export_format') }}
                </div>
              </div>

              <div class="d-flex align-start gap-3">
                <VIcon
                  icon="tabler-info-circle"
                  size="20"
                  color="info"
                  class="mt-1"
                />
                <div class="text-body-2">
                  {{ t('DocumentsModule.document.tip_compression') }}
                </div>
              </div>

              <div class="d-flex align-start gap-3">
                <VIcon
                  icon="tabler-info-circle"
                  size="20"
                  color="info"
                  class="mt-1"
                />
                <div class="text-body-2">
                  {{ t('DocumentsModule.document.tip_metadata') }}
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.document-bulk-export {
  padding: 24px;
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
