<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  formatDocumentSize,
  getDocumentCategoryColor,
  getDocumentFileExtension,
  getDocumentFileTypeIcon,
  getDocumentStatusColor,
  getDocumentStatusLabel,
  getDocumentTypeCategory,
  getDocumentTypeLabel,
} from '../../shared/utils/DocumentUtils'

interface Props {
  entityType: string
  entityId: string
  documents: any[]
  loading?: boolean
}

interface Emits {
  (e: 'upload'): void
  (e: 'download', document: any): void
  (e: 'view', document: any): void
  (e: 'delete', document: any): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

const headers = computed(() => [
  { title: t('DrillingReportsModule.documents.name'), key: 'name' },
  { title: t('DrillingReportsModule.documents.type'), key: 'type' },
  { title: t('DrillingReportsModule.documents.status'), key: 'status' },
  { title: t('DrillingReportsModule.documents.fileSize'), key: 'file_size' },
  { title: t('DrillingReportsModule.documents.uploadedAt'), key: 'uploaded_at' },
  { title: t('DrillingReportsModule.common.actions'), key: 'actions', sortable: false },
])

const handleUpload = () => {
  emit('upload')
}

const handleDownload = (document: any) => {
  emit('download', document)
}

const handleView = (document: any) => {
  emit('view', document)
}

const handleDelete = (document: any) => {
  emit('delete', document)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="document-list">
    <div class="d-flex justify-space-between align-center mb-4">
      <h3 class="text-h6">
        {{ $t('DrillingReportsModule.documents.title') }}
      </h3>
      <VBtn
        color="primary"
        prepend-icon="mdi-plus"
        @click="handleUpload"
      >
        {{ $t('DrillingReportsModule.documents.uploadDocument') }}
      </VBtn>
    </div>

    <VDataTable
      :headers="headers"
      :items="documents"
      :loading="loading"
      :items-per-page="10"
      class="elevation-1"
    >
      <template #item.name="{ item }">
        <div class="d-flex align-center">
          <VIcon
            :icon="getDocumentFileTypeIcon(getDocumentFileExtension(item.file_name))"
            class="me-2"
          />
          <span>{{ item.name }}</span>
        </div>
      </template>

      <template #item.type="{ item }">
        <VChip
          :color="getDocumentCategoryColor(getDocumentTypeCategory(item.document_type))"
          size="small"
        >
          {{ getDocumentTypeLabel(item.document_type) }}
        </VChip>
      </template>

      <template #item.status="{ item }">
        <VChip
          :color="getDocumentStatusColor(item.status)"
          size="small"
        >
          {{ getDocumentStatusLabel(item.status) }}
        </VChip>
      </template>

      <template #item.file_size="{ item }">
        {{ formatDocumentSize(item.file_size_bytes) }}
      </template>

      <template #item.uploaded_at="{ item }">
        {{ formatDate(item.uploaded_at) }}
      </template>

      <template #item.actions="{ item }">
        <VBtn
          icon="mdi-download"
          size="small"
          variant="text"
          @click="handleDownload(item)"
        />
        <VBtn
          icon="mdi-eye"
          size="small"
          variant="text"
          @click="handleView(item)"
        />
        <VBtn
          icon="mdi-delete"
          size="small"
          variant="text"
          color="error"
          @click="handleDelete(item)"
        />
      </template>
    </VDataTable>
  </div>
</template>

<style scoped>
.document-list {
  inline-size: 100%;
}
</style>
