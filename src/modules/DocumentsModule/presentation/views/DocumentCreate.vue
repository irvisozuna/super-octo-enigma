<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'
import type { CreateDocumentRequest } from '../../domain/entities/DocumentEntity'

// Composables
const { t } = useI18n()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// Form state
const form = ref<CreateDocumentRequest>({
  title: '',
  description: '',
  resource_type: '',
  resource_id: '',
  resource_subtype: '',
  document_type: 'other',
  category: 'general',
  tags: [],
  metadata: {},
  is_public: false,
  access_level: 'internal',
  file: null as any,
})

const formRef = ref()
const loading = ref(false)
const errors = ref<Record<string, string[]>>({})

// File upload
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const uploadProgress = ref(0)

// Metadata
const showMetadata = ref(false)
const metadataFields = ref<Array<{ key: string; value: any; type: string }>>([])

// Computed
const isFormValid = computed(() => {
  return form.value.title
         && form.value.resource_type
         && form.value.resource_id
         && form.value.document_type
         && form.value.category
         && form.value.file
})

const canSubmit = computed(() => {
  return isFormValid.value && !loading.value
})

const fileSizeFormatted = computed(() => {
  if (!selectedFile.value)
    return ''

  return documentStore.formatMetadataForDisplay({ size: selectedFile.value.size })[0]?.formatted || ''
})

// Watchers
watch(() => form.value.resource_type, async newType => {
  if (newType && form.value.resource_subtype) {
    try {
      const template = await documentStore.fetchMetadataTemplate(newType, form.value.resource_subtype)
      if (template) {
        showMetadata.value = true

        // Initialize metadata fields based on template
        metadataFields.value = Object.entries(template.fields || {}).map(([key, field]) => ({
          key,
          value: field.default || '',
          type: field.type || 'text',
        }))
      }
    }
    catch (error) {
      console.error('Error fetching metadata template:', error)
    }
  }
})

watch(() => form.value.resource_subtype, async newSubtype => {
  if (form.value.resource_type && newSubtype) {
    try {
      const template = await documentStore.fetchMetadataTemplate(form.value.resource_type, newSubtype)
      if (template) {
        showMetadata.value = true

        // Initialize metadata fields based on template
        metadataFields.value = Object.entries(template.fields || {}).map(([key, field]) => ({
          key,
          value: field.default || '',
          type: field.type || 'text',
        }))
      }
    }
    catch (error) {
      console.error('Error fetching metadata template:', error)
    }
  }
})

// Methods
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    form.value.file = target.files[0]

    // Auto-fill some fields based on file
    if (!form.value.title)
      form.value.title = selectedFile.value.name.replace(/\.[^/.]+$/, '')

    if (!form.value.document_type) {
      const extension = selectedFile.value.name.split('.').pop()?.toLowerCase()
      if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || ''))
        form.value.document_type = 'image'
      else if (extension === 'pdf')
        form.value.document_type = 'report'
    }
  }
}

const removeFile = () => {
  selectedFile.value = null
  form.value.file = null as any
  if (fileInput.value)
    fileInput.value.value = ''
}

const addMetadataField = () => {
  metadataFields.value.push({
    key: '',
    value: '',
    type: 'text',
  })
}

const removeMetadataField = (index: number) => {
  metadataFields.value.splice(index, 1)
}

const updateMetadata = () => {
  const metadata: Record<string, any> = {}

  metadataFields.value.forEach(field => {
    if (field.key && field.value !== '')
      metadata[field.key] = field.value
  })
  form.value.metadata = metadata
}

const validateForm = (): boolean => {
  errors.value = {}

  // Validate required fields
  if (!form.value.title)
    errors.value.title = [t('DocumentsModule.validation.title_required')]

  if (!form.value.resource_type)
    errors.value.resource_type = [t('DocumentsModule.validation.resource_type_required')]

  if (!form.value.resource_id)
    errors.value.resource_id = [t('DocumentsModule.validation.resource_id_required')]

  if (!form.value.file)
    errors.value.file = [t('DocumentsModule.validation.file_required')]

  // Validate file size
  if (form.value.file && form.value.file.size > 100 * 1024 * 1024) { // 100MB
    errors.value.file = [t('DocumentsModule.validation.file_too_large')]
  }

  // Validate metadata
  updateMetadata()

  const metadataValidation = documentStore.validateDocumentData(form.value)
  if (metadataValidation.length > 0)
    errors.value.metadata = metadataValidation

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm())
    return

  try {
    loading.value = true

    // Update metadata before submitting
    updateMetadata()

    const document = await documentStore.createDocument(form.value)

    // Redirect to document detail
    router.push({ name: 'documents-detail', params: { id: document.id } })
  }
  catch (error) {
    console.error('Error creating document:', error)
  }
  finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'documents-list' })
}

const getFieldType = (type: string): string => {
  const typeMap: Record<string, string> = {
    text: 'text',
    number: 'number',
    date: 'date',
    email: 'email',
    url: 'url',
    textarea: 'textarea',
  }

  return typeMap[type] || 'text'
}

const isFieldRequired = (field: any): boolean => {
  return field.required || false
}
</script>

<template>
  <div class="document-create">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.create_title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.create_subtitle') }}
        </p>
      </div>
    </div>

    <VForm
      ref="formRef"
      @submit.prevent="handleSubmit"
    >
      <VRow>
        <!-- Main Form -->
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
                <!-- Title -->
                <VCol cols="12">
                  <VTextField
                    v-model="form.title"
                    :label="t('DocumentsModule.document.fields.title')"
                    :error-messages="errors.title"
                    variant="outlined"
                    required
                  />
                </VCol>

                <!-- Description -->
                <VCol cols="12">
                  <VTextarea
                    v-model="form.description"
                    :label="t('DocumentsModule.document.fields.description')"
                    variant="outlined"
                    rows="3"
                  />
                </VCol>

                <!-- Resource Type and ID -->
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.resource_type"
                    :label="t('DocumentsModule.document.fields.resource_type')"
                    :error-messages="errors.resource_type"
                    variant="outlined"
                    required
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.resource_id"
                    :label="t('DocumentsModule.document.fields.resource_id')"
                    :error-messages="errors.resource_id"
                    variant="outlined"
                    required
                  />
                </VCol>

                <!-- Resource Subtype -->
                <VCol
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="form.resource_subtype"
                    :label="t('DocumentsModule.document.fields.resource_subtype')"
                    variant="outlined"
                  />
                </VCol>

                <!-- Document Type -->
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="form.document_type"
                    :items="documentStore.documentTypeOptions"
                    :label="t('DocumentsModule.document.fields.document_type')"
                    variant="outlined"
                    required
                  />
                </VCol>

                <!-- Category -->
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="form.category"
                    :items="documentStore.categoryOptions"
                    :label="t('DocumentsModule.document.fields.category')"
                    variant="outlined"
                    required
                  />
                </VCol>

                <!-- Access Level -->
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="form.access_level"
                    :items="documentStore.accessLevelOptions"
                    :label="t('DocumentsModule.document.fields.access_level')"
                    variant="outlined"
                  />
                </VCol>

                <!-- Tags -->
                <VCol cols="12">
                  <VTextField
                    v-model="form.tags"
                    :label="t('DocumentsModule.document.fields.tags')"
                    variant="outlined"
                    placeholder="tag1, tag2, tag3"
                    hint="Separate tags with commas"
                    persistent-hint
                  />
                </VCol>

                <!-- Public Access -->
                <VCol cols="12">
                  <VSwitch
                    v-model="form.is_public"
                    :label="t('DocumentsModule.document.fields.is_public')"
                    color="primary"
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- File Upload -->
          <VCard class="mt-6">
            <VCardTitle>
              {{ t('DocumentsModule.document.file_upload') }}
            </VCardTitle>

            <VCardText>
              <div
                v-if="!selectedFile"
                class="file-upload-area"
              >
                <VFileInput
                  ref="fileInput"
                  :label="t('DocumentsModule.document.select_file')"
                  :error-messages="errors.file"
                  variant="outlined"
                  accept="*/*"
                  @change="handleFileSelect"
                />
              </div>

              <div
                v-else
                class="file-selected"
              >
                <div class="d-flex align-center gap-3 pa-4 border rounded">
                  <VIcon
                    :icon="documentStore.getDocumentIcon({ mime_type: selectedFile.type } as any)"
                    size="32"
                  />
                  <div class="flex-grow-1">
                    <div class="font-weight-medium">
                      {{ selectedFile.name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ fileSizeFormatted }}
                    </div>
                  </div>
                  <VBtn
                    icon="tabler-x"
                    size="small"
                    variant="text"
                    @click="removeFile"
                  />
                </div>
              </div>
            </VCardText>
          </VCard>

          <!-- Metadata Section -->
          <VCard
            v-if="showMetadata"
            class="mt-6"
          >
            <VCardTitle>
              {{ t('DocumentsModule.document.metadata') }}
            </VCardTitle>

            <VCardText>
              <div
                v-if="metadataFields.length === 0"
                class="text-center py-4"
              >
                <VIcon
                  icon="tabler-info-circle"
                  size="24"
                  class="text-medium-emphasis mb-2"
                />
                <div class="text-body-2 text-medium-emphasis">
                  {{ t('DocumentsModule.document.no_metadata_template') }}
                </div>
              </div>

              <div v-else>
                <VRow
                  v-for="(field, index) in metadataFields"
                  :key="index"
                  class="mb-3"
                >
                  <VCol
                    cols="12"
                    md="4"
                  >
                    <VTextField
                      v-model="field.key"
                      :label="t('DocumentsModule.document.metadata_key')"
                      variant="outlined"
                      density="compact"
                      readonly
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-if="getFieldType(field.type) === 'text'"
                      v-model="field.value"
                      :label="t('DocumentsModule.document.metadata_value')"
                      variant="outlined"
                      density="compact"
                    />
                    <VTextField
                      v-else-if="getFieldType(field.type) === 'number'"
                      v-model.number="field.value"
                      :label="t('DocumentsModule.document.metadata_value')"
                      type="number"
                      variant="outlined"
                      density="compact"
                    />
                    <VTextField
                      v-else-if="getFieldType(field.type) === 'date'"
                      v-model="field.value"
                      :label="t('DocumentsModule.document.metadata_value')"
                      type="date"
                      variant="outlined"
                      density="compact"
                    />
                    <VTextarea
                      v-else-if="getFieldType(field.type) === 'textarea'"
                      v-model="field.value"
                      :label="t('DocumentsModule.document.metadata_value')"
                      variant="outlined"
                      density="compact"
                      rows="2"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="2"
                  >
                    <VBtn
                      icon="tabler-trash"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeMetadataField(index)"
                    />
                  </VCol>
                </VRow>
              </div>

              <div
                v-if="errors.metadata"
                class="text-error text-caption mt-2"
              >
                {{ errors.metadata.join(', ') }}
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Sidebar -->
        <VCol
          cols="12"
          lg="4"
        >
          <VCard>
            <VCardTitle>
              {{ t('DocumentsModule.common.actions') }}
            </VCardTitle>

            <VCardText>
              <div class="d-flex flex-column gap-3">
                <VBtn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :disabled="!canSubmit"
                  :loading="loading"
                >
                  {{ t('DocumentsModule.common.create') }}
                </VBtn>

                <VBtn
                  variant="outlined"
                  size="large"
                  block
                  @click="handleCancel"
                >
                  {{ t('DocumentsModule.common.cancel') }}
                </VBtn>
              </div>
            </VCardText>
          </VCard>

          <!-- Form Summary -->
          <VCard class="mt-6">
            <VCardTitle>
              {{ t('DocumentsModule.document.form_summary') }}
            </VCardTitle>

            <VCardText>
              <div class="d-flex flex-column gap-2">
                <div class="d-flex justify-space-between">
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.title') }}:</span>
                  <span class="text-body-2 font-weight-medium">{{ form.title || '-' }}</span>
                </div>

                <div class="d-flex justify-space-between">
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.document_type') }}:</span>
                  <span class="text-body-2 font-weight-medium">
                    {{ documentStore.documentTypeOptions.find(opt => opt.value === form.document_type)?.label || '-' }}
                  </span>
                </div>

                <div class="d-flex justify-space-between">
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.category') }}:</span>
                  <span class="text-body-2 font-weight-medium">
                    {{ documentStore.categoryOptions.find(opt => opt.value === form.category)?.label || '-' }}
                  </span>
                </div>

                <div class="d-flex justify-space-between">
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.resource_type') }}:</span>
                  <span class="text-body-2 font-weight-medium">{{ form.resource_type || '-' }}</span>
                </div>

                <div class="d-flex justify-space-between">
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.resource_id') }}:</span>
                  <span class="text-body-2 font-weight-medium">{{ form.resource_id || '-' }}</span>
                </div>

                <div
                  v-if="selectedFile"
                  class="d-flex justify-space-between"
                >
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.file') }}:</span>
                  <span class="text-body-2 font-weight-medium">{{ selectedFile.name }}</span>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>

<style scoped>
.document-create {
  padding: 24px;
}

.file-upload-area {
  padding: 24px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  text-align: center;
  transition: border-color 0.2s;
}

.file-upload-area:hover {
  border-color: #1976d2;
}

.file-selected {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f5f5f5;
}
</style>
