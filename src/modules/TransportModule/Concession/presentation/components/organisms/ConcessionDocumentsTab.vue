<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  concession: any
  loading?: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// Computed
const documents = computed(() => props.concession?.documents || [])

// Methods
const formatDate = (date: string) => {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

const formatFileSize = (bytes: number) => {
  if (!bytes)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

const getDocumentTypeColor = (type: string) => {
  const colors = {
    concession_permit: 'success',
    route_authorization: 'primary',
    insurance_certificate: 'warning',
    technical_inspection: 'info',
    other: 'grey',
  }

  return colors[type?.toLowerCase()] || 'grey'
}

const getFileIcon = (fileName: string) => {
  if (!fileName)
    return 'tabler-file'
  const ext = fileName.split('.').pop()?.toLowerCase()

  const icons = {
    pdf: 'tabler-file-type-pdf',
    doc: 'tabler-file-type-doc',
    docx: 'tabler-file-type-docx',
    jpg: 'tabler-file-type-jpg',
    jpeg: 'tabler-file-type-jpg',
    png: 'tabler-file-type-png',
  }

  return icons[ext] || 'tabler-file'
}

const isExpiringSoon = (expiryDate: string, days = 30) => {
  if (!expiryDate)
    return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays <= days && diffDays >= 0
}

const downloadDocument = (document: any) => {
  // Implement download logic
  window.open(document.download_url, '_blank')
}

const openDocument = (document: any) => {
  navigateTo(`/documents/${document.id}`)
}
</script>

<template>
  <VCardText class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <h4 class="text-h6 d-flex align-center">
        <VIcon class="me-2">
          tabler-file-text
        </VIcon>
        {{ t('concession.tabs.documents') }}
        <VChip
          v-if="documents.length > 0"
          color="primary"
          size="small"
          class="ms-3"
        >
          {{ documents.length }}
        </VChip>
      </h4>

      <VBtn
        color="primary"
        variant="outlined"
        @click="navigateTo('/documents/upload')"
      >
        <VIcon start>
          tabler-upload
        </VIcon>
        {{ t('document.actions.upload_document') }}
      </VBtn>
    </div>

    <!-- No Documents -->
    <div
      v-if="documents.length === 0"
      class="text-center py-12"
    >
      <VIcon
        size="64"
        color="grey-400"
        class="mb-4"
      >
        tabler-file-off
      </VIcon>
      <h6 class="text-h6 mb-2">
        {{ t('concession.documents.no_documents') }}
      </h6>
      <p class="text-body-2 mb-4">
        {{ t('concession.documents.no_documents_description') }}
      </p>

      <VBtn
        color="primary"
        variant="tonal"
        @click="navigateTo('/documents/upload')"
      >
        <VIcon start>
          tabler-upload
        </VIcon>
        {{ t('concession.documents.upload_first') }}
      </VBtn>
    </div>

    <!-- Documents Grid -->
    <VRow v-else>
      <VCol
        v-for="document in documents"
        :key="document.id"
        cols="12"
        md="6"
        lg="4"
      >
        <VCard
          variant="outlined"
          class="document-card h-100"
        >
          <VCardText class="pa-4">
            <!-- Header -->
            <div class="d-flex align-center mb-3">
              <VIcon
                :icon="getFileIcon(document.file_name)"
                size="32"
                :color="getDocumentTypeColor(document.document_type)"
                class="me-3"
              />

              <div class="flex-grow-1 overflow-hidden">
                <h6 class="text-subtitle-1 font-weight-bold text-truncate">
                  {{ document.document_number || document.file_name }}
                </h6>
                <VChip
                  :color="getDocumentTypeColor(document.document_type)"
                  size="small"
                  variant="tonal"
                >
                  {{ document.document_type }}
                </VChip>
              </div>
            </div>

            <!-- Document Info -->
            <VList
              density="compact"
              class="mb-3"
            >
              <VListItem class="px-0">
                <VListItemTitle class="text-caption text-medium-emphasis">
                  {{ t('document.fields.file_size') }}
                </VListItemTitle>
                <VListItemSubtitle>{{ formatFileSize(document.file_size) }}</VListItemSubtitle>
              </VListItem>

              <VListItem class="px-0">
                <VListItemTitle class="text-caption text-medium-emphasis">
                  {{ t('document.fields.upload_date') }}
                </VListItemTitle>
                <VListItemSubtitle>{{ formatDate(document.upload_date) }}</VListItemSubtitle>
              </VListItem>

              <VListItem
                v-if="document.expiry_date"
                class="px-0"
              >
                <VListItemTitle class="text-caption text-medium-emphasis">
                  {{ t('document.fields.expiry_date') }}
                </VListItemTitle>
                <VListItemSubtitle
                  :class="{
                    'text-error font-weight-medium': isExpiringSoon(document.expiry_date),
                  }"
                >
                  {{ formatDate(document.expiry_date) }}
                  <VIcon
                    v-if="isExpiringSoon(document.expiry_date)"
                    color="warning"
                    size="14"
                    class="ms-1"
                  >
                    tabler-clock-exclamation
                  </VIcon>
                </VListItemSubtitle>
              </VListItem>
            </VList>

            <!-- Actions -->
            <div class="d-flex gap-2">
              <VBtn
                variant="outlined"
                size="small"
                @click="openDocument(document)"
              >
                <VIcon start>
                  tabler-eye
                </VIcon>
                {{ t('common.view') }}
              </VBtn>

              <VBtn
                variant="text"
                size="small"
                @click="downloadDocument(document)"
              >
                <VIcon start>
                  tabler-download
                </VIcon>
                {{ t('common.download') }}
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VCardText>
</template>

<style scoped>
.document-card {
  transition: all 0.3s ease;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
}
</style>
