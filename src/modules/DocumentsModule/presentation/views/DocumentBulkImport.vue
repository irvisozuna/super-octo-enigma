<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// State
const files = ref<File[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const importing = ref(false)
const importProgress = ref(0)

// Import options
const importOptions = ref({
  overwrite_existing: false,
  create_folders: true,
  preserve_structure: true,
  auto_categorize: false,
  default_category: 'general',
  default_access_level: 'internal',
})

// Computed
const hasFiles = computed(() => files.value.length > 0)
const canImport = computed(() => hasFiles.value && !importing.value)

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
  error.value = null
}

const importFiles = async () => {
  if (!hasFiles.value)
    return

  try {
    importing.value = true
    importProgress.value = 0

    // Simulate progress
    for (let progress = 0; progress <= 100; progress += 10) {
      importProgress.value = progress
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Import the files
    await documentStore.bulkImportDocuments(files.value, importOptions.value)

    // Clear files
    files.value = []

    // Redirect to documents list
    router.push({ name: 'documents-list' })
  }
  catch (err) {
    console.error('Error importing files:', err)
  }
  finally {
    importing.value = false
    importProgress.value = 0
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
  <div class="document-bulk-import">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.bulk_import') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.bulk_import_subtitle') }}
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
      <!-- Import Form -->
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
                      color="primary"
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

                  <VBtn
                    size="small"
                    variant="text"
                    color="error"
                    icon="tabler-x"
                    @click="removeFile(index)"
                  />
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

        <!-- Import Options -->
        <VCard v-if="hasFiles">
          <VCardTitle>
            {{ t('DocumentsModule.document.import_options') }}
          </VCardTitle>

          <VCardText>
            <VForm @submit.prevent="importFiles">
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="importOptions.overwrite_existing"
                    :label="t('DocumentsModule.document.overwrite_existing')"
                    color="primary"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="importOptions.create_folders"
                    :label="t('DocumentsModule.document.create_folders')"
                    color="primary"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="importOptions.preserve_structure"
                    :label="t('DocumentsModule.document.preserve_structure')"
                    color="primary"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSwitch
                    v-model="importOptions.auto_categorize"
                    :label="t('DocumentsModule.document.auto_categorize')"
                    color="primary"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="importOptions.default_category"
                    :items="documentStore.categoryOptions"
                    :label="t('DocumentsModule.document.default_category')"
                    variant="outlined"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="importOptions.default_access_level"
                    :items="documentStore.accessLevelOptions"
                    :label="t('DocumentsModule.document.default_access_level')"
                    variant="outlined"
                  />
                </VCol>
              </VRow>

              <div class="d-flex gap-3 mt-4">
                <VBtn
                  type="submit"
                  color="primary"
                  size="large"
                  :disabled="!canImport"
                  :loading="importing"
                >
                  {{ t('DocumentsModule.document.import_files') }}
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
        <!-- Import Summary -->
        <VCard v-if="hasFiles">
          <VCardTitle>
            {{ t('DocumentsModule.document.import_summary') }}
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
                <span class="text-body-2">{{ t('DocumentsModule.document.default_category') }}:</span>
                <span class="text-body-2 font-weight-medium">
                  {{ documentStore.categoryOptions.find(opt => opt.value === importOptions.default_category)?.label || '-' }}
                </span>
              </div>

              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ t('DocumentsModule.document.default_access_level') }}:</span>
                <span class="text-body-2 font-weight-medium">
                  {{ documentStore.accessLevelOptions.find(opt => opt.value === importOptions.default_access_level)?.label || '-' }}
                </span>
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Import Progress -->
        <VCard
          v-if="importing"
          class="mt-6"
        >
          <VCardTitle>
            {{ t('DocumentsModule.document.importing') }}
          </VCardTitle>

          <VCardText>
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-body-2">{{ t('DocumentsModule.document.progress') }}:</span>
              <span class="text-body-2 font-weight-medium">{{ importProgress }}%</span>
            </div>
            <VProgressLinear
              :model-value="importProgress"
              color="primary"
              height="8"
              rounded
            />
          </VCardText>
        </VCard>

        <!-- Import Tips -->
        <VCard class="mt-6">
          <VCardTitle>
            {{ t('DocumentsModule.document.import_tips') }}
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
                  {{ t('DocumentsModule.document.tip_structure') }}
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
.document-bulk-import {
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
