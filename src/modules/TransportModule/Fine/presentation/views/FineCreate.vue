<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFineStore } from '../stores/fineStore'
import type { FineCreateDto } from '../../application/dtos/FineDtos'

// Router
const router = useRouter()

// Stores
const fineStore = useFineStore()

// Form data
const formRef = ref()
const formValid = ref(false)
const loading = ref(false)
const successDialog = ref(false)
const issuedFineNumber = ref('')

const form = ref<FineCreateDto>({
  violation_type: '',
  amount: 0,
  vehicle_plate: '',
  vehicle_type: '',
  driver_name: '',
  driver_license: '',
  location: '',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  description: '',
  issuing_authority: '',
  officer_name: '',
  officer_badge: '',
  notes: '',
})

// Options
const violationTypes = [
  { title: 'Speeding', value: 'SPEEDING' },
  { title: 'Parking Violation', value: 'PARKING' },
  { title: 'No License', value: 'NO_LICENSE' },
  { title: 'Reckless Driving', value: 'RECKLESS_DRIVING' },
  { title: 'Traffic Light Violation', value: 'TRAFFIC_LIGHT' },
  { title: 'Illegal Overtaking', value: 'ILLEGAL_OVERTAKING' },
  { title: 'Using Mobile Phone', value: 'MOBILE_PHONE' },
  { title: 'No Seatbelt', value: 'NO_SEATBELT' },
  { title: 'Document Violation', value: 'DOCUMENT_VIOLATION' },
  { title: 'Other', value: 'OTHER' },
]

const authorityOptions = [
  { title: 'Municipal Police', value: 'MUNICIPAL_POLICE' },
  { title: 'Traffic Police', value: 'TRAFFIC_POLICE' },
  { title: 'Highway Patrol', value: 'HIGHWAY_PATROL' },
  { title: 'Transport Authority', value: 'TRANSPORT_AUTHORITY' },
]

// Methods
const submitForm = async () => {
  if (!formRef.value?.validate())
    return

  loading.value = true
  try {
    const result = await fineStore.createItem(form.value)

    issuedFineNumber.value = result?.fine_number || 'N/A'
    successDialog.value = true
  }
  catch (error) {
    console.error('Error creating fine:', error)
  }
  finally {
    loading.value = false
  }
}

const goToList = () => {
  router.push({ name: 'finesList' })
}

const issueAnother = () => {
  successDialog.value = false

  // Reset form
  form.value = {
    violation_type: '',
    amount: 0,
    vehicle_plate: '',
    vehicle_type: '',
    driver_name: '',
    driver_license: '',
    location: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    issuing_authority: '',
    officer_name: '',
    officer_badge: '',
    notes: '',
  }
  formRef.value?.resetValidation()
  updateDueDate()
}

// Set default due date to 30 days from issue date
const updateDueDate = () => {
  if (form.value.issue_date) {
    const issueDate = new Date(form.value.issue_date)
    const dueDate = new Date(issueDate)

    dueDate.setDate(dueDate.getDate() + 30)
    form.value.due_date = dueDate.toISOString().split('T')[0]
  }
}

// Watch issue date changes
watch(() => form.value.issue_date, updateDueDate)

// Lifecycle
onMounted(() => {
  // Set default due date
  updateDueDate()
})
</script>

<template>
  <div class="fine-create">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center mb-6">
            <VBtn
              icon
              variant="text"
              :to="{ name: 'finesList' }"
            >
              <VIcon>tabler-arrow-left</VIcon>
            </VBtn>
            <h1 class="text-h4 ml-4">
              Issue New Fine
            </h1>
          </div>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <VIcon class="mr-2">
                tabler-receipt
              </VIcon>
              Fine Information
            </VCardTitle>
            <VCardText>
              <VForm
                ref="formRef"
                v-model="formValid"
                @submit.prevent="submitForm"
              >
                <VRow>
                  <!-- Violation Type -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="form.violation_type"
                      label="Violation Type *"
                      :items="violationTypes"
                      :rules="[v => !!v || 'Violation type is required']"
                      required
                    />
                  </VCol>

                  <!-- Amount -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model.number="form.amount"
                      label="Fine Amount *"
                      type="number"
                      prefix="$"
                      step="0.01"
                      :rules="[
                        v => v !== null && v !== undefined && v !== '' || 'Fine amount is required',
                        v => v > 0 || 'Fine amount must be greater than 0',
                      ]"
                      required
                    />
                  </VCol>

                  <!-- Vehicle Information -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.vehicle_plate"
                      label="Vehicle Plate Number *"
                      :rules="[v => !!v || 'Vehicle plate is required']"
                      required
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.vehicle_type"
                      label="Vehicle Type"
                      placeholder="e.g. Sedan, Bus, Truck"
                    />
                  </VCol>

                  <!-- Driver Information -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.driver_name"
                      label="Driver Name *"
                      :rules="[v => !!v || 'Driver name is required']"
                      required
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.driver_license"
                      label="Driver License Number"
                      placeholder="License number if available"
                    />
                  </VCol>

                  <!-- Location and Date -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.location"
                      label="Violation Location *"
                      :rules="[v => !!v || 'Violation location is required']"
                      placeholder="Street, intersection, or landmark"
                      required
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.issue_date"
                      label="Issue Date *"
                      type="date"
                      :rules="[v => !!v || 'Issue date is required']"
                      required
                    />
                  </VCol>

                  <!-- Due Date (Auto-calculated) -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.due_date"
                      label="Due Date *"
                      type="date"
                      :rules="[
                        v => !!v || 'Due date is required',
                        v => !form.issue_date || new Date(v) > new Date(form.issue_date) || 'Due date must be after issue date',
                      ]"
                      required
                    />
                  </VCol>

                  <!-- Issuing Authority -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="form.issuing_authority"
                      label="Issuing Authority *"
                      :items="authorityOptions"
                      :rules="[v => !!v || 'Issuing authority is required']"
                      required
                    />
                  </VCol>

                  <!-- Officer Information -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.officer_name"
                      label="Issuing Officer *"
                      :rules="[v => !!v || 'Officer name is required']"
                      required
                    />
                  </VCol>

                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.officer_badge"
                      label="Badge Number"
                      placeholder="Officer badge or ID number"
                    />
                  </VCol>

                  <!-- Description -->
                  <VCol cols="12">
                    <VTextarea
                      v-model="form.description"
                      label="Violation Description *"
                      rows="4"
                      :rules="[v => !!v || 'Violation description is required']"
                      placeholder="Detailed description of the violation..."
                      required
                    />
                  </VCol>

                  <!-- Additional Notes -->
                  <VCol cols="12">
                    <VTextarea
                      v-model="form.notes"
                      label="Additional Notes"
                      rows="3"
                      placeholder="Any additional information or observations..."
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
                      Issue Fine
                    </VBtn>

                    <VBtn
                      variant="outlined"
                      :to="{ name: 'finesList' }"
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
            Fine Issued Successfully!
          </h3>
          <p>Fine number <strong>{{ issuedFineNumber }}</strong> has been created in the system.</p>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            @click="goToList"
          >
            View Fines
          </VBtn>
          <VBtn
            variant="outlined"
            @click="issueAnother"
          >
            Issue Another
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.fine-create {
  padding: 20px;
}
</style>
