<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentStore } from '../stores/documentStore'
import { useVehicleStore } from '../../../Vehicle/presentation/stores/vehicleStore'
import { useConcessionHolderStore } from '../../../ConcessionHolder/presentation/stores/concessionholderStore'
import type { DocumentCreateDto } from '../../application/dtos/DocumentDtos'

// Router
const router = useRouter()

// Stores
const documentStore = useDocumentStore()
const vehicleStore = useVehicleStore()
const concessionHolderStore = useConcessionHolderStore()

// Form data
const formRef = ref()
const formValid = ref(false)
const loading = ref(false)
const loadingOwners = ref(false)
const successDialog = ref(false)
const showProgress = ref(false)
const uploadProgress = ref(0)
const selectedFiles = ref<File[]>([])

const form = ref<DocumentCreateDto>({
  document_type: '',
  owner_type: '',
  owner_id: '',
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

const ownerTypes = [
  { title: 'Vehicle', value: 'VEHICLE' },
  { title: 'Concession Holder', value: 'CONCESSION_HOLDER' },
]

// Computed
const ownerOptions = computed(() => {
  if (form.value.owner_type === 'VEHICLE') {
    return vehicleStore.items.map(vehicle => ({
      id: vehicle.id,
      display_name: `${vehicle.make} ${vehicle.model} - ${vehicle.plateNumber}`,
      name: `${vehicle.make} ${vehicle.model}`,
      subtitle: `Plate: ${vehicle.plateNumber} - Year: ${vehicle.year}`,
    }))
  }
  else if (form.value.owner_type === 'CONCESSION_HOLDER') {
    return concessionHolderStore.items.map(holder => ({
      id: holder.id,
      display_name: `${holder.fullName} (${holder.holderType})`,
      name: holder.fullName,
      subtitle: `${holder.holderType} - ID: ${holder.identificationNumber}`,
    }))
  }

  return []
})

// Methods
const onOwnerTypeChange = async () => {
  form.value.owner_id = ''
  loadingOwners.value = true

  try {
    if (form.value.owner_type === 'VEHICLE')
      await vehicleStore.fetchList()
    else if (form.value.owner_type === 'CONCESSION_HOLDER')
      await concessionHolderStore.fetchList()
  }
  catch (error) {
    console.error('Error loading owners:', error)
  }
  finally {
    loadingOwners.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value?.validate() || !selectedFiles.value?.length)
    return

  loading.value = true
  showProgress.value = true
  uploadProgress.value = 0

  try {
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90)
        uploadProgress.value += Math.random() * 15
    }, 200)

    const result = await documentStore.uploadDocument(form.value, selectedFiles.value[0])

    clearInterval(progressInterval)
    uploadProgress.value = 100

    setTimeout(() => {
      showProgress.value = false
      successDialog.value = true
    }, 500)
  }
  catch (error) {
    console.error('Error uploading document:', error)
    showProgress.value = false
  }
  finally {
    loading.value = false
  }
}

const goToList = () => {
  router.push({ name: 'documentsList' })
}

const uploadAnother = () => {
  successDialog.value = false

  // Reset form
  form.value = {
    document_type: '',
    owner_type: '',
    owner_id: '',
    document_number: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
    description: '',
    tags: [],
  }
  selectedFiles.value = []
  formRef.value?.resetValidation()
}

// Lifecycle
onMounted(() => {
  // Initial setup if needed
})
</script>

<template>
  <div class="document-upload">
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
              Upload Document
            </h1>
          </div>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <VIcon class="mr-2">
                tabler-upload
              </VIcon>
              Document Information
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

                  <!-- Owner Type -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="form.owner_type"
                      label="Owner Type *"
                      :items="ownerTypes"
                      :rules="[v => !!v || 'Owner type is required']"
                      required
                      @update:model-value="onOwnerTypeChange"
                    />
                  </VCol>

                  <!-- Owner Selection -->
                  <VCol
                    v-if="form.owner_type"
                    cols="12"
                  >
                    <VAutocomplete
                      v-model="form.owner_id"
                      :label="`${form.owner_type} *`"
                      :items="ownerOptions"
                      item-title="display_name"
                      item-value="id"
                      :loading="loadingOwners"
                      :rules="[v => !!v || 'Owner selection is required']"
                      placeholder="Search and select owner..."
                      clearable
                      required
                    >
                      <template #item="{ props, item }">
                        <VListItem v-bind="props">
                          <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
                          <VListItemSubtitle>
                            {{ item.raw.subtitle }}
                          </VListItemSubtitle>
                        </VListItem>
                      </template>
                    </VAutocomplete>
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

                  <!-- File Upload -->
                  <VCol cols="12">
                    <VFileInput
                      v-model="selectedFiles"
                      label="Document File *"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      :rules="[v => !!v && v.length > 0 || 'Document file is required']"
                      prepend-icon="tabler-upload"
                      show-size
                      required
                    >
                      <template #selection="{ fileNames }">
                        <template
                          v-for="fileName in fileNames"
                          :key="fileName"
                        >
                          <VChip
                            color="primary"
                            size="small"
                            class="me-2"
                          >
                            {{ fileName }}
                          </VChip>
                        </template>
                      </template>
                    </VFileInput>
                    <VAlert
                      type="info"
                      variant="tonal"
                      class="mt-2"
                    >
                      Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                    </VAlert>
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
                      :disabled="!formValid || !selectedFiles?.length"
                      size="large"
                    >
                      <VIcon start>
                        tabler-upload
                      </VIcon>
                      Upload Document
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
                  </VCol>
                </VRow>
              </VForm>
            </VCardText>
          </VCard>
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
            Document Uploaded Successfully!
          </h3>
          <p>The document has been uploaded and saved to the system.</p>
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
            @click="uploadAnother"
          >
            Upload Another
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Upload Progress -->
    <VDialog
      v-model="showProgress"
      persistent
      max-width="300"
    >
      <VCard>
        <VCardText class="text-center py-6">
          <VProgressCircular
            :model-value="uploadProgress"
            size="64"
            width="8"
            color="primary"
          >
            {{ Math.round(uploadProgress) }}%
          </VProgressCircular>
          <p class="mt-4">
            Uploading document...
          </p>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.document-upload {
  padding: 20px;
}
</style>
