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
const files = ref<File[]>([])
const uploadProgress = ref<Record<string, number>>({})
const uploadStatus = ref<Record<string, string>>({})
const uploading = ref(false)
const error = ref<string | null>(null)

// Form for bulk upload
const bulkForm = ref({
  document_type: 'other',
  category: 'general',
  tags: '',
  access_level: 'internal',
  is_public: false,
  description: '',
})

// Computed
const hasFiles = computed(() => files.value.length > 0)
const canUpload = computed(() => hasFiles.value && !uploading.value)

const uploadComplete = computed(() => {
  return Object.values(uploadStatus.value).every(status => status === 'completed' || status === 'error')
})

// Methods
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files)
    files.value = Array.from(target.files)
}

const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files)
    files.value = Array.from(event.dataTransfer.files)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const removeFile = (index: number) => {
  files.value.splice(index, 1)
}

const clearFiles = () => {
  files.value = []
  uploadProgress.value = {}
  uploadStatus.value = {}
  error.value = null
}

const uploadFiles = async () => {
  if (!hasFiles.value)
    return

  try {
    uploading.value = true
    error.value = null

    // Initialize progress and status
    files.value.forEach(file => {
      uploadProgress.value[file.name] = 0
      uploadStatus.value[file.name] = 'uploading'
    })

    // Upload files one by one
    for (const file of files.value) {
      try {
        const formData = new FormData()

        formData.append('file', file)
        formData.append('title', file.name)
        formData.append('document_type', bulkForm.value.document_type)
        formData.append('category', bulkForm.value.category)
        formData.append('access_level', bulkForm.value.access_level)
        formData.append('is_public', bulkForm.value.is_public.toString())

        if (bulkForm.value.tags)
          formData.append('tags', bulkForm.value.tags)

        if (bulkForm.value.description)
          formData.append('description', bulkForm.value.description)

        // Simulate progress (in real implementation, you'd track actual progress)
        for (let progress = 0; progress <= 100; progress += 10) {
          uploadProgress.value[file.name] = progress
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Upload the file
        await documentStore.uploadDocument(formData)

        uploadStatus.value[file.name] = 'completed'
      }
      catch (err) {
        uploadStatus.value[file.name] = 'error'
        console.error(`Error uploading ${file.name}:`, err)
      }
    }
  }
  catch (err) {
    error.value = 'Error al subir los archivos'
    console.error('Error uploading files:', err)
  }
  finally {
    uploading.value = false
  }
}

const getFileIcon = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase()

  const iconMap: Record<string, string> = {
    pdf: 'tabler-file-text',
    doc: 'tabler-file-text',
    docx: 'tabler-file-text',
    xls: 'tabler-file-spreadsheet',
    xlsx: 'tabler-file-spreadsheet',
    ppt: 'tabler-file-presentation',
    pptx: 'tabler-file-presentation',
    txt: 'tabler-file-text',
    jpg: 'tabler-file-image',
    jpeg: 'tabler-file-image',
    png: 'tabler-file-image',
    gif: 'tabler-file-image',
    zip: 'tabler-file-zip',
    rar: 'tabler-file-zip',
  }

  return iconMap[extension || ''] || 'tabler-file'
}

const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    uploading: 'tabler-upload',
    completed: 'tabler-check-circle',
    error: 'tabler-x-circle',
  }

  return icons[status] || 'tabler-file'
}

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    uploading: 'primary',
    completed: 'success',
    error: 'error',
  }

  return colors[status] || 'default'
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
  // Initialize form with default values
})
</script>

<template>
  <div class="document-bulk-upload">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.bulk_upload') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.bulk_upload_subtitle') }}
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
      <!-- Upload Form -->
      <VCol
        cols="12"
        lg="8"
      >
        <!-- File Drop Zone -->
        <VCard class="mb-6">
          <VCardTitle>
            {{ t('DocumentsModule.document.select_files') }}
          </VCardTitle>

          <VCardText>
            <div
              class="file-drop-zone"
              @drop="handleFileDrop"
              @dragover="handleDragOver"
              @dragenter="handleDragOver"
            >
              <div
                v-if="!hasFiles"
                class="text-center py-8"
              >
                <VIcon
                  icon="tabler-upload"
                  size="64"
                  class="text-medium-emphasis mb-4"
                />
                <div class="text-h6 mb-2">
                  {{ t('DocumentsModule.document.drag_drop_files') }}
                </div>
                <div class="text-body-2 text-medium-emphasis mb-4">
                  {{ t('DocumentsModule.document.drag_drop_subtitle') }}
                </div>
                <VBtn
                  color="primary"
                  prepend-icon="tabler-folder-open"
                  @click="document.querySelector('input[type=file]')?.click()"
                >
                  {{ t('DocumentsModule.document.browse_files') }}
                </VBtn>
              </div>

              <div
                v-else
                class="d-flex flex-column gap-3"
              >
                <div
                  v-for="(file, index) in files"
                  :key="index"
                  class="d-flex align-center justify-space-between p-3 border rounded"
                >
                  <div class="d-flex align-center gap-3">
                    <VIcon
                      :icon="getFileIcon(file)"
                      size="24"
                      :color="getStatusColor(uploadStatus[file.name] || 'pending')"
                    />

                    <div>
                      <div class="font-weight-medium">
                        {{ file.name }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ formatFileSize(file.size) }}
                      </div>
                    </div>
                  </div>

                  <div class="d-flex align-center gap-3">
                    <div
                      v-if="uploadStatus[file.name] === 'uploading'"
                      class="d-flex align-center gap-2"
                    >
                      <VProgressCircular
                        :model-value="uploadProgress[file.name]"
                        size="24"
                        width="2"
                      />
                      <span class="text-caption">{{ uploadProgress[file.name] }}%</span>
                    </div>

                    <VIcon
                      v-else
                      :icon="getStatusIcon(uploadStatus[file.name] || 'pending')"
                      :color="getStatusColor(uploadStatus[file.name] || 'pending')"
                      size="24"
                    />

                    <VBtn
                      v-if="!uploading"
                      size="small"
                      variant="text"
                      color="error"
                      icon="tabler-x"
                      @click="removeFile(index)"
                    />
                  </div>
                </div>
              </div>

              <input
                type="file"
                multiple
                style="display: none;"
                @change="handleFileSelect"
              >
            </div>
          </VCardText>
        </VCard>

        <!-- Upload Options -->
        <VCard v-if="hasFiles">
          <VCardTitle>
            {{ t('DocumentsModule.document.upload_options') }}
          </VCardTitle>

          <VCardText>
            <VForm @submit.prevent="uploadFiles">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="bulkForm.document_type"
                    :items="documentStore.documentTypeOptions"
                    :label="t('DocumentsModule.document.fields.document_type')"
                    variant="outlined"
                    required
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="bulkForm.category"
                    :items="documentStore.categoryOptions"
                    :label="t('DocumentsModule.document.fields.category')"
                    variant="outlined"
                    required
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="bulkForm.access_level"
                    :items="documentStore.accessLevelOptions"
                    :label="t('DocumentsModule.document.fields.access_level')"
                    variant="outlined"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="bulkForm.is_public"
                    :label="t('DocumentsModule.document.fields.is_public')"
                    color="primary"
                  />
                </VCol>

                <VCol cols="12">
                  <VTextField
                    v-model="bulkForm.tags"
                    :label="t('DocumentsModule.document.fields.tags')"
                    variant="outlined"
                    placeholder="tag1, tag2, tag3"
                    hint="Separate tags with commas"
                    persistent-hint
                  />
                </VCol>

                <VCol cols="12">
                  <VTextarea
                    v-model="bulkForm.description"
                    :label="t('DocumentsModule.document.fields.description')"
                    variant="outlined"
                    rows="3"
                    hint="Description will be applied to all files"
                    persistent-hint
                  />
                </VCol>
              </VRow>

              <div class="d-flex gap-3 mt-4">
                <VBtn
                  type="submit"
                  color="primary"
                  size="large"
                  :disabled="!canUpload"
                  :loading="uploading"
                >
                  {{ t('DocumentsModule.document.upload_files') }}
                </VBtn>

                <VBtn
                  variant="outlined"
                  size="large"
                  @click="clearFiles"
                >
                  {{ t('DocumentsModule.common.clear') }}
                </VBtn>
              </div>
            </VForm>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Sidebar -->
      <VCol
        cols="12"
        lg="4"
      >
        <!-- Upload Summary -->
        <VCard v-if="hasFiles">
          <VCardTitle>
            {{ t('DocumentsModule.document.upload_summary') }}
          </VCardTitle>

          <VCardText>
            <div class="d-flex flex-column gap-3">
              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ t('DocumentsModule.document.files_selected') }}:</span>
                <span class="text-body-2 font-weight-medium">{{ files.length }}</span>
              </div>

              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ t('DocumentsModule.document.total_size') }}:</span>
                <span class="text-body-2 font-weight-medium">
                  {{ formatFileSize(files.reduce((total, file) => total + file.size, 0)) }}
                </span>
              </div>

              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ t('DocumentsModule.document.fields.document_type') }}:</span>
                <span class="text-body-2 font-weight-medium">
                  {{ documentStore.documentTypeOptions.find(opt => opt.value === bulkForm.document_type)?.label || '-' }}
                </span>
              </div>

              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ t('DocumentsModule.document.fields.category') }}:</span>
                <span class="text-body-2 font-weight-medium">
                  {{ documentStore.categoryOptions.find(opt => opt.value === bulkForm.category)?.label || '-' }}
                </span>
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Upload Tips -->
        <VCard class="mt-6">
          <VCardTitle>
            {{ t('DocumentsModule.document.upload_tips') }}
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
                  {{ t('DocumentsModule.document.tip_file_size') }}
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
                  {{ t('DocumentsModule.document.tip_file_types') }}
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
.document-bulk-upload {
  padding: 24px;
}

.file-drop-zone {
  border: 2px dashed rgb(var(--v-theme-outline));
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-drop-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.file-drop-zone.dragover {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>
