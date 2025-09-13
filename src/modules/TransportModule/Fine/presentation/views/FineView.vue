<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFineStore } from '../stores/fineStore'
import type { FineEntity } from '../../domain/entities/FineEntity'

// Router
const router = useRouter()
const route = useRoute()
const fineId = route.params.id as string

// Stores
const fineStore = useFineStore()

// Data
const loading = ref(true)
const showPaymentDialog = ref(false)
const paymentFormRef = ref()
const paymentFormValid = ref(false)
const paymentLoading = ref(false)

const paymentForm = ref({
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: '',
  payment_notes: '',
})

// Computed
const fine = computed<FineEntity | null>(() => fineStore.currentItem)

// Methods
const loadFine = async () => {
  try {
    loading.value = true
    await fineStore.fetchById(fineId)
  }
  catch (error) {
    console.error('Error loading fine:', error)
  }
  finally {
    loading.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    PENDING: 'warning',
    PAID: 'success',
    OVERDUE: 'error',
    CANCELLED: 'grey',
    CONTESTED: 'info',
  }

  return colors[status] || 'grey'
}

const formatDate = (dateString: string) => {
  if (!dateString)
    return '-'

  return new Date(dateString).toLocaleDateString()
}

const isOverdue = (dueDate: string) => {
  if (!dueDate)
    return false
  const due = new Date(dueDate)
  const today = new Date()

  return due < today
}

const processPayment = async () => {
  if (!paymentFormRef.value?.validate() || !fine.value)
    return

  paymentLoading.value = true
  try {
    await fineStore.processPayment({
      fine_id: fine.value.id,
      ...paymentForm.value,
    })
    showPaymentDialog.value = false

    // Reload fine data to show updated information
    await loadFine()
  }
  catch (error) {
    console.error('Error processing payment:', error)
  }
  finally {
    paymentLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadFine()
})
</script>

<template>
  <div class="fine-view">
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
              Fine Details
            </h1>
          </div>
        </VCol>
      </VRow>

      <!-- Loading State -->
      <VRow v-if="loading">
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

      <!-- Fine Details -->
      <VRow v-else-if="fine">
        <VCol cols="12">
          <!-- Header Card -->
          <VCard class="mb-4">
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="8"
                >
                  <div class="d-flex align-center mb-4">
                    <VIcon
                      size="48"
                      color="primary"
                      class="mr-4"
                    >
                      tabler-receipt
                    </VIcon>
                    <div>
                      <h2 class="text-h5">
                        {{ fine.fineNumber }}
                      </h2>
                      <p class="text-body-2 text-medium-emphasis">
                        {{ fine.violationType }} Violation
                      </p>
                    </div>
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                  class="text-md-right"
                >
                  <VChip
                    :color="getStatusColor(fine.status)"
                    size="large"
                    class="mb-2"
                  >
                    <VIcon start>
                      tabler-circle-filled
                    </VIcon>
                    {{ fine.status }}
                  </VChip>
                  <div class="mt-2">
                    <VBtn
                      color="primary"
                      variant="outlined"
                      :to="{ name: 'finesEdit', params: { id: fineId } }"
                      class="mr-2"
                    >
                      <VIcon start>
                        tabler-edit
                      </VIcon>
                      Edit
                    </VBtn>
                    <VBtn
                      v-if="fine.status === 'PENDING' || fine.status === 'OVERDUE'"
                      color="success"
                      variant="outlined"
                      @click="showPaymentDialog = true"
                    >
                      <VIcon start>
                        tabler-currency-dollar
                      </VIcon>
                      Pay
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Main Information -->
          <VRow>
            <!-- Violation Details -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-alert-triangle
                  </VIcon>
                  Violation Details
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Violation Type"
                        :model-value="fine.violationType"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Amount"
                        :model-value="`$${fine.amount.toFixed(2)}`"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Location"
                        :model-value="fine.location"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextarea
                        label="Description"
                        :model-value="fine.description"
                        readonly
                        variant="outlined"
                        rows="3"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Dates Information -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-calendar
                  </VIcon>
                  Date Information
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Issue Date"
                        :model-value="formatDate(fine.issueDate)"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Due Date"
                        :model-value="formatDate(fine.dueDate)"
                        readonly
                        variant="outlined"
                        :class="{ 'text-error': isOverdue(fine.dueDate) }"
                      />
                    </VCol>
                    <VCol
                      v-if="fine.paymentDate"
                      cols="12"
                    >
                      <VTextField
                        label="Payment Date"
                        :model-value="formatDate(fine.paymentDate)"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="!fine.paymentDate && isOverdue(fine.dueDate)"
                      cols="12"
                    >
                      <VAlert
                        type="warning"
                        variant="tonal"
                      >
                        <VIcon start>
                          tabler-alert-triangle
                        </VIcon>
                        This fine is overdue!
                      </VAlert>
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Vehicle and Driver Information -->
          <VRow class="mt-4">
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-car
                  </VIcon>
                  Vehicle Information
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Plate Number"
                        :model-value="fine.vehiclePlate"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="fine.vehicleType"
                      cols="12"
                    >
                      <VTextField
                        label="Vehicle Type"
                        :model-value="fine.vehicleType"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-user
                  </VIcon>
                  Driver Information
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Driver Name"
                        :model-value="fine.driverName"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="fine.driverLicense"
                      cols="12"
                    >
                      <VTextField
                        label="License Number"
                        :model-value="fine.driverLicense"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Authority Information -->
          <VRow class="mt-4">
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-shield
                  </VIcon>
                  Issuing Authority
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Authority"
                        :model-value="fine.issuingAuthority"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Officer Name"
                        :model-value="fine.officerName"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol
                      v-if="fine.officerBadge"
                      cols="12"
                    >
                      <VTextField
                        label="Badge Number"
                        :model-value="fine.officerBadge"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Additional Notes -->
            <VCol
              v-if="fine.notes"
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-notes
                  </VIcon>
                  Additional Notes
                </VCardTitle>
                <VCardText>
                  <VTextarea
                    :model-value="fine.notes"
                    readonly
                    variant="outlined"
                    rows="6"
                  />
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Activity Timeline -->
          <VRow class="mt-4">
            <VCol cols="12">
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-timeline
                  </VIcon>
                  Fine History
                </VCardTitle>
                <VCardText>
                  <VTimeline
                    side="end"
                    density="compact"
                  >
                    <VTimelineItem
                      icon="tabler-receipt"
                      dot-color="primary"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(fine.issueDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>Fine Issued</strong>
                          <p class="text-body-2 mt-1">
                            Fine {{ fine.fineNumber }} was issued for {{ fine.violationType }}
                          </p>
                        </VCardText>
                      </VCard>
                    </VTimelineItem>

                    <VTimelineItem
                      v-if="fine.paymentDate"
                      icon="tabler-currency-dollar"
                      dot-color="success"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(fine.paymentDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>Payment Received</strong>
                          <p class="text-body-2 mt-1">
                            Payment of ${{ fine.amount.toFixed(2) }} was received
                          </p>
                        </VCardText>
                      </VCard>
                    </VTimelineItem>

                    <VTimelineItem
                      icon="tabler-calendar-event"
                      :dot-color="isOverdue(fine.dueDate) ? 'error' : 'warning'"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(fine.dueDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>{{ isOverdue(fine.dueDate) ? 'Overdue' : 'Due Date' }}</strong>
                          <p class="text-body-2 mt-1">
                            {{ isOverdue(fine.dueDate) ? 'Payment is overdue' : 'Payment due date' }}
                          </p>
                        </VCardText>
                      </VCard>
                    </VTimelineItem>
                  </VTimeline>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
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

    <!-- Payment Dialog -->
    <VDialog
      v-model="showPaymentDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle>Process Payment</VCardTitle>
        <VCardText>
          <VForm
            ref="paymentFormRef"
            v-model="paymentFormValid"
          >
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="paymentForm.payment_date"
                  label="Payment Date *"
                  type="date"
                  :rules="[v => !!v || 'Payment date is required']"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="paymentForm.payment_method"
                  label="Payment Method"
                  placeholder="e.g. Cash, Credit Card, Bank Transfer"
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="paymentForm.payment_notes"
                  label="Payment Notes"
                  rows="3"
                  placeholder="Add any notes about this payment..."
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showPaymentDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            :loading="paymentLoading"
            :disabled="!paymentFormValid"
            @click="processPayment"
          >
            Process Payment
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.fine-view {
  padding: 20px;
}

.text-error {
  color: rgb(var(--v-theme-error)) !important;
}
</style>
