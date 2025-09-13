<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocumentStore } from '../stores/documentStore'
import type { DocumentEntity } from '../../domain/entities/DocumentEntity'

// Router
const router = useRouter()
const route = useRoute()
const documentId = route.params.id as string

// Stores
const documentStore = useDocumentStore()

// Data
const loading = ref(true)
const showPreview = ref(false)
const previewUrl = ref('')

// Computed
const document = computed<DocumentEntity | null>(() => documentStore.currentItem)

const canPreview = computed(() => {
  if (!document.value)
    return false
  const previewableTypes = ['.pdf', '.jpg', '.jpeg', '.png']

  return previewableTypes.some(type =>
    document.value!.fileName.toLowerCase().endsWith(type),
  )
})

// Methods
const loadDocument = async () => {
  try {
    loading.value = true
    await documentStore.fetchById(documentId)
  }
  catch (error) {
    console.error('Error loading document:', error)
  }
  finally {
    loading.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    VALID: 'success',
    EXPIRED: 'error',
    PENDING: 'warning',
    REJECTED: 'error',
  }

  return colors[status] || 'grey'
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0)
    return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

const formatDate = (dateString: string) => {
  if (!dateString)
    return '-'

  return new Date(dateString).toLocaleDateString()
}

const isExpiringSoon = (expiryDate: string, days: number = 30) => {
  if (!expiryDate)
    return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const warningDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

  return expiry <= warningDate && expiry > today
}

const getOwnerDisplay = () => {
  if (!document.value)
    return ''

  return `${document.value.ownerType}: ${document.value.ownerId}`
}

const getFileType = () => {
  if (!document.value)
    return ''
  const extension = document.value.fileName.split('.').pop()?.toUpperCase()

  return extension || 'Unknown'
}

const downloadDocument = async () => {
  if (!document.value)
    return

  try {
    await documentStore.downloadDocument(document.value.id, document.value.fileName)
  }
  catch (error) {
    console.error('Error downloading document:', error)
  }
}

const previewDocument = async () => {
  if (!document.value || !canPreview.value)
    return

  try {
    // Get preview URL from store
    previewUrl.value = await documentStore.getPreviewUrl(document.value.id)
    showPreview.value = true
  }
  catch (error) {
    console.error('Error getting preview:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadDocument()
})
</script>

<template>
  <div class="document-view">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center mb-6">
            <VBtn
              icon
              variant="text"
              :to="{ name: 'documentsList' }"
            >
              <VIcon>tabler-arrow-left</VIcon>
            </VBtn>
            <h1 class="text-h4 ml-4">
              Document Details
            </h1>
          </div>
        </VCol>
      </VRow>

      <!-- Loading State -->
      <VRow v-if="loading">
        <VCol
          cols="12"
          class="text-center py-8"
        >
          <VProgressCircular
            size="64"
            indeterminate
          />
          <p class="mt-4">
            Loading document details...
          </p>
        </VCol>
      </VRow>

      <!-- Document Details -->
      <VRow v-else-if="document">
        <VCol cols="12">
          <!-- Header Card -->
          <VCard class="mb-4">
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="8"
                >
                  <div class="d-flex align-center mb-4">
                    <VIcon
                      size="48"
                      color="primary"
                      class="mr-4"
                    >
                      tabler-file
                    </VIcon>
                    <div>
                      <h2 class="text-h5">
                        {{ document.fileName }}
                      </h2>
                      <p class="text-body-2 text-medium-emphasis">
                        {{ document.documentType }} Document
                      </p>
                    </div>
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                  class="text-md-right"
                >
                  <VChip
                    :color="getStatusColor(document.status)"
                    size="large"
                    class="mb-2"
                  >
                    <VIcon start>
                      tabler-circle-filled
                    </VIcon>
                    {{ document.status }}
                  </VChip>
                  <div class="mt-2">
                    <VBtn
                      color="primary"
                      variant="outlined"
                      class="mr-2"
                      @click="downloadDocument"
                    >
                      <VIcon start>
                        tabler-download
                      </VIcon>
                      Download
                    </VBtn>
                    <VBtn
                      color="info"
                      variant="outlined"
                      :to="{ name: 'documentsEdit', params: { id: documentId } }"
                    >
                      <VIcon start>
                        tabler-edit
                      </VIcon>
                      Edit
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Main Information -->
          <VRow>
            <!-- Document Information -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-info-circle
                  </VIcon>
                  Document Information
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Document Type"
                        :model-value="document.documentType"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="document.documentNumber"
                      cols="12"
                    >
                      <VTextField
                        label="Document Number"
                        :model-value="document.documentNumber"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="document.issuingAuthority"
                      cols="12"
                    >
                      <VTextField
                        label="Issuing Authority"
                        :model-value="document.issuingAuthority"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Owner"
                        :model-value="getOwnerDisplay()"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- File and Dates Information -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-calendar
                  </VIcon>
                  Dates & File Info
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="File Size"
                        :model-value="formatFileSize(document.fileSize)"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Upload Date"
                        :model-value="formatDate(document.uploadDate)"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="document.issueDate"
                      cols="12"
                    >
                      <VTextField
                        label="Issue Date"
                        :model-value="formatDate(document.issueDate)"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="document.expiryDate"
                      cols="12"
                    >
                      <VTextField
                        label="Expiry Date"
                        :model-value="formatDate(document.expiryDate)"
                        readonly
                        variant="outlined"
                        :class="{ 'text-error': isExpiringSoon(document.expiryDate) }"
                      />
                    </VCol>
                    <VCol
                      v-if="document.expiryDate && isExpiringSoon(document.expiryDate)"
                      cols="12"
                    >
                      <VAlert
                        type="warning"
                        variant="tonal"
                      >
                        <VIcon start>
                          tabler-alert-triangle
                        </VIcon>
                        This document is expiring soon!
                      </VAlert>
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Description and Tags -->
          <VRow
            v-if="document.description || document.tags?.length"
            class="mt-4"
          >
            <VCol
              v-if="document.description"
              cols="12"
              :md="document.description && document.tags?.length ? 6 : 12"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-file-text
                  </VIcon>
                  Description
                </VCardTitle>
                <VCardText>
                  <VTextarea
                    :model-value="document.description"
                    readonly
                    variant="outlined"
                    rows="4"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              v-if="document.tags?.length"
              cols="12"
              :md="document.description && document.tags?.length ? 6 : 12"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-tags
                  </VIcon>
                  Tags
                </VCardTitle>
                <VCardText>
                  <div class="d-flex flex-wrap gap-2">
                    <VChip
                      v-for="tag in document.tags"
                      :key="tag"
                      color="primary"
                      variant="tonal"
                      size="small"
                    >
                      {{ tag }}
                    </VChip>
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- File Preview/Actions -->
          <VRow class="mt-4">
            <VCol cols="12">
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-eye
                  </VIcon>
                  File Actions
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <VBtn
                        color="primary"
                        size="large"
                        block
                        @click="downloadDocument"
                      >
                        <VIcon start>
                          tabler-download
                        </VIcon>
                        Download Document
                      </VBtn>
                    </VCol>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <VBtn
                        v-if="canPreview"
                        color="info"
                        variant="outlined"
                        size="large"
                        block
                        @click="previewDocument"
                      >
                        <VIcon start>
                          tabler-eye
                        </VIcon>
                        Preview Document
                      </VBtn>
                    </VCol>
                  </VRow>

                  <VAlert
                    type="info"
                    variant="tonal"
                    class="mt-4"
                  >
                    <VIcon start>
                      tabler-info-circle
                    </VIcon>
                    <strong>File:</strong> {{ document.fileName }}
                    <br>
                    <strong>Type:</strong> {{ getFileType() }}
                    <br>
                    <strong>Last Modified:</strong> {{ formatDate(document.lastModified || document.uploadDate) }}
                  </VAlert>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Activity Timeline -->
          <VRow class="mt-4">
            <VCol cols="12">
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-timeline
                  </VIcon>
                  Document History
                </VCardTitle>
                <VCardText>
                  <VTimeline
                    side="end"
                    density="compact"
                  >
                    <VTimelineItem
                      icon="tabler-upload"
                      dot-color="primary"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(document.uploadDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>Document Uploaded</strong>
                          <p class="text-body-2 mt-1">
                            {{ document.fileName }} was uploaded to the system
                          </p>
                        </VCardText>
                      </VCard>
                    </VTimelineItem>

                    <VTimelineItem
                      v-if="document.issueDate"
                      icon="tabler-certificate"
                      dot-color="info"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(document.issueDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>Document Issued</strong>
                          <p class="text-body-2 mt-1">
                            {{ document.documentType }} was officially issued
                          </p>
                        </VCardText>
                      </VCard>
                    </VTimelineItem>

                    <VTimelineItem
                      v-if="document.expiryDate"
                      icon="tabler-calendar-event"
                      :dot-color="isExpiringSoon(document.expiryDate) ? 'warning' : 'grey'"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(document.expiryDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>{{ isExpiringSoon(document.expiryDate) ? 'Expires Soon' : 'Expiry Date' }}</strong>
                          <p class="text-body-2 mt-1">
                            {{ isExpiringSoon(document.expiryDate) ? 'Document expires soon - renewal may be required' : 'Scheduled expiry date' }}
                          </p>
                        </VCardText>
                      </VCard>
                    </VTimelineItem>
                  </VTimeline>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCol>
      </VRow>

      <!-- Error State -->
      <VRow v-else>
        <VCol
          cols="12"
          class="text-center py-8"
        >
          <VIcon
            size="64"
            color="error"
          >
            tabler-alert-circle
          </VIcon>
          <h3 class="text-h6 mt-4">
            Document Not Found
          </h3>
          <p class="text-body-2 mt-2">
            The document you're looking for doesn't exist or has been deleted.
          </p>
          <VBtn
            color="primary"
            class="mt-4"
            :to="{ name: 'documentsList' }"
          >
            Back to Documents
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>

    <!-- Preview Dialog -->
    <VDialog
      v-model="showPreview"
      fullscreen
    >
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon class="mr-2">
            tabler-eye
          </VIcon>
          Document Preview - {{ document?.fileName }}
          <VSpacer />
          <VBtn
            icon
            variant="text"
            @click="showPreview = false"
          >
            <VIcon>tabler-x</VIcon>
          </VBtn>
        </VCardTitle>
        <VCardText
          class="pa-0"
          style="height: calc(100vh - 80px);"
        >
          <iframe
            v-if="previewUrl"
            :src="previewUrl"
            style="width: 100%; height: 100%; border: none;"
          />
          <div
            v-else
            class="d-flex align-center justify-center"
            style="height: 100%;"
          >
            <VAlert
              type="info"
              variant="tonal"
            >
              <VIcon start>
                tabler-info-circle
              </VIcon>
              Preview not available for this file type. Please download to view.
            </VAlert>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.document-view {
  padding: 20px;
}

.text-error {
  color: rgb(var(--v-theme-error)) !important;
}
</style>
