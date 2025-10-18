<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'
import type { DocumentEntity } from '../../domain/entities/DocumentEntity'

// Composables
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// State
const document = ref<DocumentEntity | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

// Computed
const documentId = computed(() => route.params.id as string)

// Methods
const loadDocument = async () => {
  try {
    loading.value = true
    error.value = null

    document.value = await documentStore.fetchDocumentById(documentId.value)
  }
  catch (err) {
    error.value = 'Error al cargar el documento'
    console.error('Error loading document:', err)
  }
  finally {
    loading.value = false
  }
}

const handleEdit = () => {
  router.push({ name: 'documents-edit', params: { id: documentId.value } })
}

const handleDelete = async () => {
  if (confirm(t('DocumentsModule.messages.confirm_delete', { title: document.value?.title }))) {
    try {
      await documentStore.deleteDocument(documentId.value)
      router.push({ name: 'documents-list' })
    }
    catch (err) {
      console.error('Error deleting document:', err)
    }
  }
}

const handleDownload = async () => {
  try {
    const blob = await documentStore.downloadDocument(documentId.value)

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.value.createElement('a')

    link.href = url
    link.download = document.value?.file_name || 'document'
    document.value.body.appendChild(link)
    link.click()
    document.value.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
  catch (err) {
    console.error('Error downloading document:', err)
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

// Lifecycle
onMounted(() => {
  loadDocument()
})
</script>

<template>
  <div class="document-detail">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ document?.title || t('DocumentsModule.document.detail_title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.detail_subtitle') }}
        </p>
      </div>

      <div class="d-flex gap-3">
        <VBtn
          variant="outlined"
          prepend-icon="tabler-edit"
          @click="handleEdit"
        >
          {{ t('DocumentsModule.common.edit') }}
        </VBtn>

        <VBtn
          color="primary"
          prepend-icon="tabler-download"
          @click="handleDownload"
        >
          {{ t('DocumentsModule.common.download') }}
        </VBtn>

        <VBtn
          color="error"
          variant="outlined"
          prepend-icon="tabler-trash"
          @click="handleDelete"
        >
          {{ t('DocumentsModule.common.delete') }}
        </VBtn>
      </div>
    </div>

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
        @click="loadDocument"
      >
        {{ t('DocumentsModule.common.refresh') }}
      </VBtn>
    </div>

    <!-- Document Content -->
    <div
      v-else-if="document"
      class="document-content"
    >
      <VRow>
        <!-- Document Info -->
        <VCol
          cols="12"
          lg="8"
        >
          <VCard>
            <VCardTitle>
              {{ t('DocumentsModule.document.basic_information') }}
            </VCardTitle>

            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="d-flex align-center gap-3 mb-4">
                    <VIcon
                      :icon="getDocumentIcon(document)"
                      size="32"
                    />
                    <div>
                      <div class="font-weight-medium">
                        {{ document.title }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ document.file_name }} ({{ document.file_size_formatted }})
                      </div>
                    </div>
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="d-flex justify-end">
                    <VChip
                      :color="getStatusColor(document.status)"
                      size="large"
                      variant="tonal"
                    >
                      {{ getStatusLabel(document.status) }}
                    </VChip>
                  </div>
                </VCol>
              </VRow>

              <VDivider class="my-4" />

              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      {{ t('DocumentsModule.document.fields.document_type') }}
                    </div>
                    <div class="font-weight-medium">
                      {{ getDocumentTypeLabel(document.document_type) }}
                    </div>
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      {{ t('DocumentsModule.document.fields.category') }}
                    </div>
                    <div class="font-weight-medium">
                      {{ getCategoryLabel(document.category) }}
                    </div>
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      {{ t('DocumentsModule.document.fields.resource_type') }}
                    </div>
                    <div class="font-weight-medium">
                      {{ document.resource_type }}
                    </div>
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      {{ t('DocumentsModule.document.fields.resource_id') }}
                    </div>
                    <div class="font-weight-medium">
                      {{ document.resource_id }}
                    </div>
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      {{ t('DocumentsModule.document.fields.version') }}
                    </div>
                    <div class="font-weight-medium">
                      {{ document.version }}
                    </div>
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      {{ t('DocumentsModule.document.fields.uploaded_by') }}
                    </div>
                    <div class="font-weight-medium">
                      {{ document.uploaded_by_user?.name || document.uploaded_by }}
                    </div>
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      {{ t('DocumentsModule.common.created_at') }}
                    </div>
                    <div class="font-weight-medium">
                      {{ new Date(document.created_at).toLocaleDateString() }}
                    </div>
                  </div>
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="mb-3">
                    <div class="text-caption text-medium-emphasis">
                      {{ t('DocumentsModule.common.updated_at') }}
                    </div>
                    <div class="font-weight-medium">
                      {{ new Date(document.updated_at).toLocaleDateString() }}
                    </div>
                  </div>
                </VCol>
              </VRow>

              <!-- Description -->
              <div
                v-if="document.description"
                class="mt-4"
              >
                <div class="text-caption text-medium-emphasis mb-2">
                  {{ t('DocumentsModule.document.fields.description') }}
                </div>
                <div class="text-body-1">
                  {{ document.description }}
                </div>
              </div>

              <!-- Tags -->
              <div
                v-if="document.tags && document.tags.length > 0"
                class="mt-4"
              >
                <div class="text-caption text-medium-emphasis mb-2">
                  {{ t('DocumentsModule.document.fields.tags') }}
                </div>
                <div class="d-flex flex-wrap gap-2">
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
            </VCardText>
          </VCard>

          <!-- Metadata -->
          <VCard
            v-if="documentStore.hasMetadata(document)"
            class="mt-6"
          >
            <VCardTitle>
              {{ t('DocumentsModule.document.metadata') }}
            </VCardTitle>

            <VCardText>
              <div class="d-flex flex-column gap-3">
                <div
                  v-for="(value, key) in document.metadata"
                  :key="key"
                  class="d-flex justify-space-between align-center"
                >
                  <span class="text-body-2 font-weight-medium">{{ key }}:</span>
                  <span class="text-body-2">{{ value }}</span>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Sidebar -->
        <VCol
          cols="12"
          lg="4"
        >
          <!-- Document Actions -->
          <VCard>
            <VCardTitle>
              {{ t('DocumentsModule.common.actions') }}
            </VCardTitle>

            <VCardText>
              <div class="d-flex flex-column gap-3">
                <VBtn
                  color="primary"
                  prepend-icon="tabler-download"
                  block
                  @click="handleDownload"
                >
                  {{ t('DocumentsModule.common.download') }}
                </VBtn>

                <VBtn
                  variant="outlined"
                  prepend-icon="tabler-edit"
                  block
                  @click="handleEdit"
                >
                  {{ t('DocumentsModule.common.edit') }}
                </VBtn>

                <VBtn
                  variant="outlined"
                  prepend-icon="tabler-share"
                  block
                >
                  {{ t('DocumentsModule.common.share') }}
                </VBtn>

                <VBtn
                  variant="outlined"
                  prepend-icon="tabler-history"
                  block
                >
                  {{ t('DocumentsModule.document.versions') }}
                </VBtn>
              </div>
            </VCardText>
          </VCard>

          <!-- Document Stats -->
          <VCard class="mt-6">
            <VCardTitle>
              {{ t('DocumentsModule.document.statistics') }}
            </VCardTitle>

            <VCardText>
              <div class="d-flex flex-column gap-3">
                <div class="d-flex justify-space-between">
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.file_size') }}:</span>
                  <span class="text-body-2 font-weight-medium">{{ document.file_size_formatted }}</span>
                </div>

                <div class="d-flex justify-space-between">
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.mime_type') }}:</span>
                  <span class="text-body-2 font-weight-medium">{{ document.mime_type }}</span>
                </div>

                <div class="d-flex justify-space-between">
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.version') }}:</span>
                  <span class="text-body-2 font-weight-medium">{{ document.version }}</span>
                </div>

                <div class="d-flex justify-space-between">
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.access_level') }}:</span>
                  <span class="text-body-2 font-weight-medium">{{ document.access_level }}</span>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </div>
</template>

<style scoped>
.document-detail {
  padding: 24px;
}

.document-content {
  min-block-size: 400px;
}
</style>
