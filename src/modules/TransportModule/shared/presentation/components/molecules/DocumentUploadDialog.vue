<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CreateDocumentRequest, EntityType } from '../../../domain/entities/DocumentEntity'
import { DocumentDomain } from '../../../domain/entities/DocumentEntity'

interface Props {
  visible: boolean
  entityId: string
  entityType: EntityType
  availableDocumentTypes?: string[]
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'upload', data: CreateDocumentRequest): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form data
const formData = ref<Partial<CreateDocumentRequest>>({
  documentable_id: props.entityId,
  entity_type: props.entityType,
  document_type: '',
  title: '',
  description: '',
  issue_date: '',
  expiration_date: '',
  issuing_authority: '',
  reference_number: '',
  notes: '',
})

const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement>()
const errors = ref<string[]>([])

// Computed
const documentTypes = computed(() => {
  return props.availableDocumentTypes || []
})

const isValid = computed(() => {
  return formData.value.document_type
         && formData.value.title
         && selectedFile.value
         && errors.value.length === 0
})

const fileSize = computed(() => {
  if (!selectedFile.value)
    return ''

  return DocumentDomain.formatFileSize(selectedFile.value.size)
})

const fileIcon = computed(() => {
  if (!selectedFile.value)
    return 'tabler-file'

  return DocumentDomain.getFileTypeIcon(selectedFile.value.type)
})

// Methods
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    selectedFile.value = file

    // Auto-generate title from filename if not set
    if (!formData.value.title)
      formData.value.title = file.name.split('.')[0]

    validateForm()
  }
}

function removeFile() {
  selectedFile.value = null
  if (fileInput.value)
    fileInput.value.value = ''

  validateForm()
}

function validateForm() {
  const data = {
    ...formData.value,
    file: selectedFile.value!,
  } as CreateDocumentRequest

  errors.value = DocumentDomain.validate(data)
}

function handleSubmit() {
  if (!isValid.value || !selectedFile.value)
    return

  const data: CreateDocumentRequest = {
    documentable_id: props.entityId,
    entity_type: props.entityType,
    document_type: formData.value.document_type!,
    title: formData.value.title!,
    description: formData.value.description || undefined,
    file: selectedFile.value,
    issue_date: formData.value.issue_date || undefined,
    expiration_date: formData.value.expiration_date || undefined,
    issuing_authority: formData.value.issuing_authority || undefined,
    reference_number: formData.value.reference_number || undefined,
    notes: formData.value.notes || undefined,
  }

  emit('upload', data)
}

function resetForm() {
  // Reset form data
  formData.value = {
    documentable_id: props.entityId,
    entity_type: props.entityType,
    document_type: '',
    title: '',
    description: '',
    issue_date: '',
    expiration_date: '',
    issuing_authority: '',
    reference_number: '',
    notes: '',
  }
  selectedFile.value = null
  errors.value = []

  // Reset file input
  if (fileInput.value)
    fileInput.value.value = ''
}

function handleClose() {
  resetForm()
  emit('close')
}

// Watch for changes
watch(() => formData.value, validateForm, { deep: true })
watch(() => props.entityId, newId => {
  formData.value.documentable_id = newId
})
watch(() => props.visible, (newVisible, oldVisible) => {
  console.log('DocumentUploadDialog visibility changed:', newVisible)
  console.log('Available document types in dialog:', props.availableDocumentTypes)

  // Reset form when dialog is opened
  if (newVisible && !oldVisible)
    resetForm()
})
</script>

<template>
  <VDialog
    :model-value="visible"
    max-width="600"
    persistent
    @update:model-value="handleClose"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>
          <VIcon class="me-2">tabler-upload</VIcon>
          Subir Documento
        </span>
        <VBtn
          icon
          variant="text"
          @click="handleClose"
        >
          <VIcon>tabler-x</VIcon>
        </VBtn>
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSubmit">
          <VRow>
            <!-- Document Type -->
            <VCol cols="12">
              <VSelect
                v-if="documentTypes.length > 0"
                v-model="formData.document_type"
                :items="documentTypes"
                label="Tipo de Documento *"
                variant="outlined"
                :error-messages="errors.filter(e => e.includes('tipo de documento'))"
              />
              <VTextField
                v-else
                model-value="Cargando tipos de documento..."
                label="Tipo de Documento *"
                variant="outlined"
                readonly
                loading
              />
            </VCol>

            <!-- Title -->
            <VCol cols="12">
              <VTextField
                v-model="formData.title"
                label="Título del Documento *"
                variant="outlined"
                :error-messages="errors.filter(e => e.includes('título'))"
              />
            </VCol>

            <!-- Description -->
            <VCol cols="12">
              <VTextarea
                v-model="formData.description"
                label="Descripción"
                variant="outlined"
                rows="2"
              />
            </VCol>

            <!-- File Upload -->
            <VCol cols="12">
              <VFileInput
                ref="fileInput"
                label="Archivo *"
                variant="outlined"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                :error-messages="errors.filter(e => e.includes('archivo'))"
                @change="handleFileSelect"
              />

              <div
                v-if="selectedFile"
                class="mt-2 pa-3 border rounded d-flex align-center justify-space-between"
              >
                <div class="d-flex align-center">
                  <VIcon
                    :icon="fileIcon"
                    class="me-2"
                  />
                  <div>
                    <div class="text-body-2 font-weight-medium">
                      {{ selectedFile.name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ fileSize }}
                    </div>
                  </div>
                </div>
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click="removeFile"
                >
                  <VIcon>tabler-x</VIcon>
                </VBtn>
              </div>
            </VCol>

            <!-- Dates -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.issue_date"
                label="Fecha de Emisión"
                type="date"
                variant="outlined"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.expiration_date"
                label="Fecha de Vencimiento"
                type="date"
                variant="outlined"
                :error-messages="errors.filter(e => e.includes('vencimiento'))"
              />
            </VCol>

            <!-- Additional Info -->
            <VCol cols="12">
              <VTextField
                v-model="formData.issuing_authority"
                label="Autoridad Emisora"
                variant="outlined"
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="formData.reference_number"
                label="Número de Referencia"
                variant="outlined"
              />
            </VCol>

            <!-- Notes -->
            <VCol cols="12">
              <VTextarea
                v-model="formData.notes"
                label="Notas"
                variant="outlined"
                rows="2"
              />
            </VCol>
          </VRow>

          <!-- Error Messages -->
          <VAlert
            v-if="errors.length > 0"
            type="error"
            variant="tonal"
            class="mt-4"
          >
            <div class="text-body-2">
              Por favor corrige los siguientes errores:
            </div>
            <ul class="mt-2">
              <li
                v-for="error in errors"
                :key="error"
                class="text-caption"
              >
                {{ error }}
              </li>
            </ul>
          </VAlert>
        </VForm>
      </VCardText>

      <VCardActions class="justify-space-between">
        <VBtn
          variant="outlined"
          @click="handleClose"
        >
          Cancelar
        </VBtn>

        <VBtn
          color="primary"
          :disabled="!isValid || loading"
          :loading="loading"
          @click="handleSubmit"
        >
          <VIcon start>
            tabler-upload
          </VIcon>
          Subir Documento
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
