<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFineStore } from '../stores/fineStore'
import type { FineUpdateDto } from '../../application/dtos/FineDtos'
import type { FineEntity } from '../../domain/entities/FineEntity'

// Router
const router = useRouter()
const route = useRoute()
const fineId = route.params.id as string

// Stores
const fineStore = useFineStore()

// Form data
const formRef = ref()
const formValid = ref(false)
const loading = ref(false)
const initialLoading = ref(true)
const successDialog = ref(false)
const fine = ref<FineEntity | null>(null)

const form = ref<FineUpdateDto>({
  violation_type: '',
  amount: 0,
  vehicle_plate: '',
  vehicle_type: '',
  driver_name: '',
  driver_license: '',
  location: '',
  due_date: '',
  status: '',
  payment_date: '',
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

const statusOptions = [
  { title: 'Pending', value: 'PENDING' },
  { title: 'Paid', value: 'PAID' },
  { title: 'Overdue', value: 'OVERDUE' },
  { title: 'Cancelled', value: 'CANCELLED' },
  { title: 'Contested', value: 'CONTESTED' },
]

const authorityOptions = [
  { title: 'Municipal Police', value: 'MUNICIPAL_POLICE' },
  { title: 'Traffic Police', value: 'TRAFFIC_POLICE' },
  { title: 'Highway Patrol', value: 'HIGHWAY_PATROL' },
  { title: 'Transport Authority', value: 'TRANSPORT_AUTHORITY' },
]

// Methods
const loadFine = async () => {
  try {
    await fineStore.fetchById(fineId)
    fine.value = fineStore.currentItem

    if (fine.value) {
      // Populate form with existing data
      form.value = {
        violation_type: fine.value.violationType,
        amount: fine.value.amount,
        vehicle_plate: fine.value.vehiclePlate,
        vehicle_type: fine.value.vehicleType,
        driver_name: fine.value.driverName,
        driver_license: fine.value.driverLicense || '',
        location: fine.value.location,
        due_date: fine.value.dueDate,
        status: fine.value.status,
        payment_date: fine.value.paymentDate || '',
        description: fine.value.description,
        issuing_authority: fine.value.issuingAuthority,
        officer_name: fine.value.officerName,
        officer_badge: fine.value.officerBadge || '',
        notes: fine.value.notes || '',
      }
    }
  }
  catch (error) {
    console.error('Error loading fine:', error)
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
    await fineStore.updateItem(fineId, form.value)
    successDialog.value = true
  }
  catch (error) {
    console.error('Error updating fine:', error)
  }
  finally {
    loading.value = false
  }
}

const goToList = () => {
  router.push({ name: 'finesList' })
}

const goToView = () => {
  router.push({ name: 'finesView', params: { id: fineId } })
}

// Lifecycle
onMounted(() => {
  loadFine()
})
</script>

<template>
  <div class="fine-edit">
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
              Edit Fine
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
            Loading fine details...
          </p>
        </VCol>
      </VRow>

      <!-- Edit Form -->
      <VRow v-else-if="fine">
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <VIcon class="mr-2">
                tabler-edit
              </VIcon>
              Edit Fine - {{ fine.fineNumber }}
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

                  <!-- Payment Date (if paid) -->
                  <VCol
                    v-if="form.status === 'PAID'"
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.payment_date"
                      label="Payment Date"
                      type="date"
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

                  <!-- Location and Dates -->
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
                      v-model="form.due_date"
                      label="Due Date *"
                      type="date"
                      :rules="[v => !!v || 'Due date is required']"
                      required
                    />
                  </VCol>

                  <!-- Authority Information -->
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
                      Update Fine
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

                    <VBtn
                      variant="outlined"
                      color="info"
                      :to="{ name: 'finesView', params: { id: fineId } }"
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
            Fine Not Found
          </h3>
          <p class="text-body-2 mt-2">
            The fine you're looking for doesn't exist or has been deleted.
          </p>
          <VBtn
            color="primary"
            class="mt-4"
            :to="{ name: 'finesList' }"
          >
            Back to Fines
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
            Fine Updated Successfully!
          </h3>
          <p>The fine information has been updated in the system.</p>
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
.fine-edit {
  padding: 20px;
}
</style>
