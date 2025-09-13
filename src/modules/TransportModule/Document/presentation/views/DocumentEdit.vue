<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDocumentStore } from '../stores/documentStore'
import type { DocumentUpdateDto } from '../../application/dtos/DocumentDtos'
import type { DocumentEntity } from '../../domain/entities/DocumentEntity'

// Router
const router = useRouter()
const route = useRoute()
const documentId = route.params.id as string

// Stores
const documentStore = useDocumentStore()

// Form data
const formRef = ref()
const formValid = ref(false)
const loading = ref(false)
const initialLoading = ref(true)
const successDialog = ref(false)
const document = ref<DocumentEntity | null>(null)
const newFile = ref<File[]>([])

const form = ref<DocumentUpdateDto>({
  document_type: '',
  status: '',
  document_number: '',
  issuing_authority: '',
  issue_date: '',
  expiry_date: '',
  description: '',
  tags: [],
})

// Options
const documentTypes = [
  { title: 'Driver License', value: 'DRIVER_LICENSE' },
  { title: 'Vehicle Registration', value: 'VEHICLE_REGISTRATION' },
  { title: 'Insurance Certificate', value: 'INSURANCE_CERTIFICATE' },
  { title: 'Technical Inspection', value: 'TECHNICAL_INSPECTION' },
  { title: 'Route Permit', value: 'ROUTE_PERMIT' },
  { title: 'Operating License', value: 'OPERATING_LICENSE' },
  { title: 'Medical Certificate', value: 'MEDICAL_CERTIFICATE' },
  { title: 'Other', value: 'OTHER' },
]

const statusOptions = [
  { title: 'Valid', value: 'VALID' },
  { title: 'Expired', value: 'EXPIRED' },
  { title: 'Pending', value: 'PENDING' },
  { title: 'Rejected', value: 'REJECTED' },
]

// Methods
const loadDocument = async () => {
  try {
    await documentStore.fetchById(documentId)
    document.value = documentStore.currentItem

    if (document.value) {
      // Populate form with existing data
      form.value = {
        document_type: document.value.documentType,
        status: document.value.status,
        document_number: document.value.documentNumber || '',
        issuing_authority: document.value.issuingAuthority || '',
        issue_date: document.value.issueDate || '',
        expiry_date: document.value.expiryDate || '',
        description: document.value.description || '',
        tags: document.value.tags || [],
      }
    }
  }
  catch (error) {
    console.error('Error loading document:', error)
  }
  finally {
    initialLoading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value?.validate())
    return

  loading.value = true
  try {
    if (newFile.value?.length) {
      // Update with new file
      await documentStore.updateDocument(documentId, form.value, newFile.value[0])
    }
    else {
      // Update without file
      await documentStore.updateItem(documentId, form.value)
    }
    successDialog.value = true
  }
  catch (error) {
    console.error('Error updating document:', error)
  }
  finally {
    loading.value = false
  }
}

const downloadFile = async () => {
  if (!document.value)
    return

  try {
    await documentStore.downloadDocument(document.value.id, document.value.fileName)
  }
  catch (error) {
    console.error('Error downloading document:', error)
  }
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

const goToList = () => {
  router.push({ name: 'documentsList' })
}

const goToView = () => {
  router.push({ name: 'documentsView', params: { id: documentId } })
}

// Lifecycle
onMounted(() => {
  loadDocument()
})
</script>

<template>
  <div class="document-edit">
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
              Edit Document
            </h1>
          </div>
        </VCol>
      </VRow>

      <!-- Loading State -->
      <VRow v-if="initialLoading">
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

      <!-- Edit Form -->
      <VRow v-else-if="document">
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <VIcon class="mr-2">
                tabler-edit
              </VIcon>
              Edit Document - {{ document.documentType }}
            </VCardTitle>
            <VCardText>
              <VForm
                ref="formRef"
                v-model="formValid"
                @submit.prevent="submitForm"
              >
                <VRow>
                  <!-- Document Type -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="form.document_type"
                      label="Document Type *"
                      :items="documentTypes"
                      :rules="[v => !!v || 'Document type is required']"
                      required
                    />
                  </VCol>

                  <!-- Status -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="form.status"
                      label="Status *"
                      :items="statusOptions"
                      :rules="[v => !!v || 'Status is required']"
                      required
                    />
                  </VCol>

                  <!-- Document Details -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.document_number"
                      label="Document Number"
                      placeholder="e.g. License number, registration number"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.issuing_authority"
                      label="Issuing Authority"
                      placeholder="e.g. DMV, Police Department"
                    />
                  </VCol>

                  <!-- Dates -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.issue_date"
                      label="Issue Date"
                      type="date"
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.expiry_date"
                      label="Expiry Date"
                      type="date"
                      :rules="[
                        v => !v || !form.issue_date || new Date(v) > new Date(form.issue_date) || 'Expiry date must be after issue date',
                      ]"
                    />
                  </VCol>

                  <!-- File Replacement -->
                  <VCol cols="12">
                    <VCard variant="outlined">
                      <VCardTitle class="text-h6">
                        <VIcon class="mr-2">
                          tabler-file
                        </VIcon>
                        Current File
                      </VCardTitle>
                      <VCardText>
                        <div class="d-flex align-center justify-space-between">
                          <div>
                            <p><strong>File:</strong> {{ document.fileName }}</p>
                            <p><strong>Size:</strong> {{ formatFileSize(document.fileSize) }}</p>
                            <p><strong>Uploaded:</strong> {{ formatDate(document.uploadDate) }}</p>
                          </div>
                          <div>
                            <VBtn
                              color="primary"
                              variant="outlined"
                              class="mr-2"
                              @click="downloadFile"
                            >
                              <VIcon start>
                                tabler-download
                              </VIcon>
                              Download
                            </VBtn>
                          </div>
                        </div>

                        <VDivider class="my-4" />

                        <p class="text-body-2 mb-3">
                          Replace with new file (optional):
                        </p>
                        <VFileInput
                          v-model="newFile"
                          label="New Document File"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          prepend-icon="tabler-upload"
                          show-size
                          clearable
                        />
                        <VAlert
                          v-if="newFile?.length"
                          type="info"
                          variant="tonal"
                          class="mt-2"
                        >
                          The current file will be replaced when you save changes.
                        </VAlert>
                      </VCardText>
                    </VCard>
                  </VCol>

                  <!-- Description -->
                  <VCol cols="12">
                    <VTextarea
                      v-model="form.description"
                      label="Description"
                      rows="3"
                      placeholder="Add any additional notes about this document..."
                    />
                  </VCol>

                  <!-- Tags -->
                  <VCol cols="12">
                    <VCombobox
                      v-model="form.tags"
                      label="Tags"
                      multiple
                      chips
                      placeholder="Add tags to categorize this document"
                    />
                  </VCol>
                </VRow>

                <!-- Action Buttons -->
                <VRow class="mt-4">
                  <VCol
                    cols="12"
                    class="d-flex gap-3"
                  >
                    <VBtn
                      type="submit"
                      color="primary"
                      :loading="loading"
                      :disabled="!formValid"
                      size="large"
                    >
                      <VIcon start>
                        tabler-check
                      </VIcon>
                      Update Document
                    </VBtn>

                    <VBtn
                      variant="outlined"
                      :to="{ name: 'documentsList' }"
                      size="large"
                    >
                      <VIcon start>
                        tabler-x
                      </VIcon>
                      Cancel
                    </VBtn>

                    <VBtn
                      variant="outlined"
                      color="info"
                      :to="{ name: 'documentsView', params: { id: documentId } }"
                      size="large"
                    >
                      <VIcon start>
                        tabler-eye
                      </VIcon>
                      View Details
                    </VBtn>
                  </VCol>
                </VRow>
              </VForm>
            </VCardText>
          </VCard>
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

    <!-- Success Dialog -->
    <VDialog
      v-model="successDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle class="text-center">
          <VIcon
            color="success"
            size="48"
          >
            tabler-check-circle
          </VIcon>
        </VCardTitle>
        <VCardText class="text-center">
          <h3 class="text-h6 mb-2">
            Document Updated Successfully!
          </h3>
          <p>The document information has been updated in the system.</p>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            @click="goToList"
          >
            View Documents
          </VBtn>
          <VBtn
            variant="outlined"
            @click="goToView"
          >
            View Details
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.document-edit {
  padding: 20px;
}
</style>
