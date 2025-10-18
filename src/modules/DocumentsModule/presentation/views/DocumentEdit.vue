<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDocumentStore } from '../stores/documentStore'
import type { DocumentEntity, UpdateDocumentRequest } from '../../domain/entities/DocumentEntity'

// Composables
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Store
const documentStore = useDocumentStore()

// Form state
const form = ref<UpdateDocumentRequest>({
  id: '',
  title: '',
  description: '',
  document_type: 'other',
  category: 'general',
  tags: [],
  metadata: {},
  is_public: false,
  access_level: 'internal',
  change_description: '',
})

const formRef = ref()
const loading = ref(false)
const errors = ref<Record<string, string[]>>({})

// Metadata
const showMetadata = ref(false)
const metadataFields = ref<Array<{ key: string; value: any; type: string }>>([])

// Computed
const documentId = computed(() => route.params.id as string)

const isFormValid = computed(() => {
  return form.value.title && form.value.document_type && form.value.category
})

const canSubmit = computed(() => {
  return isFormValid.value && !loading.value
})

// Methods
const loadDocument = async () => {
  try {
    loading.value = true

    const document = await documentStore.fetchDocumentById(documentId.value)

    // Populate form
    form.value = {
      id: document.id,
      title: document.title,
      description: document.description || '',
      document_type: document.document_type,
      category: document.category,
      tags: document.tags || [],
      metadata: document.metadata || {},
      is_public: document.is_public,
      access_level: document.access_level,
    }

    // Initialize metadata fields
    if (document.metadata && Object.keys(document.metadata).length > 0) {
      showMetadata.value = true
      metadataFields.value = Object.entries(document.metadata).map(([key, value]) => ({
        key,
        value,
        type: typeof value === 'number' ? 'number' : 'text',
      }))
    }
  }
  catch (err) {
    console.error('Error loading document:', err)
  }
  finally {
    loading.value = false
  }
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

  if (!form.value.title)
    errors.value.title = [t('DocumentsModule.validation.title_required')]

  if (!form.value.document_type)
    errors.value.document_type = [t('DocumentsModule.validation.invalid_document_type')]

  if (!form.value.category)
    errors.value.category = [t('DocumentsModule.validation.invalid_category')]

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

    await documentStore.updateDocument(documentId.value, form.value)

    // Redirect to document detail
    router.push({ name: 'documents-detail', params: { id: documentId.value } })
  }
  catch (error) {
    console.error('Error updating document:', error)
  }
  finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push({ name: 'documents-detail', params: { id: documentId.value } })
}

// Lifecycle
onMounted(() => {
  loadDocument()
})
</script>

<template>
  <div class="document-edit">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          {{ t('DocumentsModule.document.edit_title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-1">
          {{ t('DocumentsModule.document.edit_subtitle') }}
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

                <!-- Document Type -->
                <VCol
                  cols="12"
                  md="6"
                >
                  <VSelect
                    v-model="form.document_type"
                    :items="documentStore.documentTypeOptions"
                    :label="t('DocumentsModule.document.fields.document_type')"
                    :error-messages="errors.document_type"
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
                    :error-messages="errors.category"
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

                <!-- Change Description -->
                <VCol cols="12">
                  <VTextField
                    v-model="form.change_description"
                    :label="t('DocumentsModule.document.fields.change_description')"
                    variant="outlined"
                    hint="Describe what changes you made"
                    persistent-hint
                  />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Metadata Section -->
          <VCard class="mt-6">
            <VCardTitle>
              <div class="d-flex justify-space-between align-center">
                <span>{{ t('DocumentsModule.document.metadata') }}</span>
                <VBtn
                  size="small"
                  prepend-icon="tabler-plus"
                  @click="addMetadataField"
                >
                  {{ t('DocumentsModule.common.add') }}
                </VBtn>
              </div>
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
                  {{ t('DocumentsModule.document.no_metadata') }}
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
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-if="field.type === 'text'"
                      v-model="field.value"
                      :label="t('DocumentsModule.document.metadata_value')"
                      variant="outlined"
                      density="compact"
                    />
                    <VTextField
                      v-else-if="field.type === 'number'"
                      v-model.number="field.value"
                      :label="t('DocumentsModule.document.metadata_value')"
                      type="number"
                      variant="outlined"
                      density="compact"
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
                  {{ t('DocumentsModule.common.save') }}
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
                  <span class="text-body-2">{{ t('DocumentsModule.document.fields.access_level') }}:</span>
                  <span class="text-body-2 font-weight-medium">
                    {{ documentStore.accessLevelOptions.find(opt => opt.value === form.access_level)?.label || '-' }}
                  </span>
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
.document-edit {
  padding: 24px;
}
</style>
