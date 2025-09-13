<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConcessionStore } from '../stores/concessionStore'
import { useConcessionHolderStore } from '../../../ConcessionHolder/presentation/stores/concessionholderStore'
import type { ConcessionEntity } from '../../domain/entities/ConcessionEntity'
import type { ConcessionHolderEntity } from '../../../ConcessionHolder/domain/entities/ConcessionHolderEntity'

// Router
const router = useRouter()
const route = useRoute()
const concessionId = route.params.id as string

// Stores
const concessionStore = useConcessionStore()
const concessionHolderStore = useConcessionHolderStore()

// Data
const loading = ref(true)
const showRenewalDialog = ref(false)
const renewalFormRef = ref()
const renewalFormValid = ref(false)
const renewalLoading = ref(false)

const renewalForm = ref({
  new_expiry_date: '',
  fee_amount: 0,
  notes: '',
})

// Computed
const concession = computed<ConcessionEntity | null>(() => concessionStore.currentItem)

const holderInfo = computed<ConcessionHolderEntity | null>(() => {
  if (!concession.value?.holderId)
    return null

  return concessionHolderStore.items.find(holder => holder.id === concession.value!.holderId) || null
})

// Methods
const loadConcession = async () => {
  try {
    loading.value = true
    await concessionStore.fetchById(concessionId)

    // Load holder information if available
    if (concession.value?.holderId) {
      try {
        await concessionHolderStore.fetchById(concession.value.holderId)
      }
      catch (error) {
        console.error('Error loading concession holder:', error)
      }
    }
  }
  catch (error) {
    console.error('Error loading concession:', error)
  }
  finally {
    loading.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    SUSPENDED: 'error',
    EXPIRED: 'error',
  }

  return colors[status] || 'grey'
}

const getHolderStatusColor = (status: string) => {
  const colors = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    SUSPENDED: 'error',
  }

  return colors[status] || 'grey'
}

const formatDate = (dateString: string) => {
  if (!dateString)
    return '-'

  return new Date(dateString).toLocaleDateString()
}

const isExpiringSoon = (expiryDate: string, days: number = 30) => {
  if (!expiryDate)
    return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const warningDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

  return expiry <= warningDate && expiry > today
}

const submitRenewal = async () => {
  if (!renewalFormRef.value?.validate() || !concession.value)
    return

  renewalLoading.value = true
  try {
    await concessionStore.renewConcession({
      concession_id: concession.value.id,
      ...renewalForm.value,
    })
    showRenewalDialog.value = false

    // Reload concession data to show updated information
    await loadConcession()
  }
  catch (error) {
    console.error('Error renewing concession:', error)
  }
  finally {
    renewalLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadConcession()
})
</script>

<template>
  <div class="concession-view">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center mb-6">
            <VBtn
              icon
              variant="text"
              :to="{ name: 'concessionsList' }"
            >
              <VIcon>tabler-arrow-left</VIcon>
            </VBtn>
            <h1 class="text-h4 ml-4">
              Concession Details
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
            Loading concession details...
          </p>
        </VCol>
      </VRow>

      <!-- Concession Details -->
      <VRow v-else-if="concession">
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
                      tabler-certificate
                    </VIcon>
                    <div>
                      <h2 class="text-h5">
                        {{ concession.concessionNumber }}
                      </h2>
                      <p class="text-body-2 text-medium-emphasis">
                        {{ concession.concessionType }} Concession
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
                    :color="getStatusColor(concession.status)"
                    size="large"
                    class="mb-2"
                  >
                    <VIcon start>
                      tabler-circle-filled
                    </VIcon>
                    {{ concession.status }}
                  </VChip>
                  <div class="mt-2">
                    <VBtn
                      color="primary"
                      variant="outlined"
                      :to="{ name: 'concessionsEdit', params: { id: concessionId } }"
                      class="mr-2"
                    >
                      <VIcon start>
                        tabler-edit
                      </VIcon>
                      Edit
                    </VBtn>
                    <VBtn
                      v-if="concession.status === 'ACTIVE' && isExpiringSoon(concession.expiryDate, 90)"
                      color="info"
                      variant="outlined"
                      @click="showRenewalDialog = true"
                    >
                      <VIcon start>
                        tabler-refresh
                      </VIcon>
                      Renew
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Main Information -->
          <VRow>
            <!-- Basic Information -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-info-circle
                  </VIcon>
                  Basic Information
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Concession Type"
                        :model-value="concession.concessionType"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Service Area"
                        :model-value="concession.serviceArea"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextarea
                        label="Route Description"
                        :model-value="concession.routeDescription"
                        readonly
                        variant="outlined"
                        rows="3"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Dates and Status -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-calendar
                  </VIcon>
                  Dates & Status
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Issue Date"
                        :model-value="formatDate(concession.issueDate)"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Expiry Date"
                        :model-value="formatDate(concession.expiryDate)"
                        readonly
                        variant="outlined"
                        :class="{ 'text-error': isExpiringSoon(concession.expiryDate) }"
                      />
                    </VCol>
                    <VCol
                      v-if="concession.renewalDate"
                      cols="12"
                    >
                      <VTextField
                        label="Last Renewal Date"
                        :model-value="formatDate(concession.renewalDate)"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Holder Information -->
          <VRow class="mt-4">
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-user
                  </VIcon>
                  Concession Holder
                </VCardTitle>
                <VCardText>
                  <div v-if="holderInfo">
                    <div class="d-flex align-center mb-4">
                      <VAvatar
                        size="64"
                        color="primary"
                        class="mr-4"
                      >
                        <VIcon size="32">
                          tabler-user
                        </VIcon>
                      </VAvatar>
                      <div>
                        <h3 class="text-h6">
                          {{ holderInfo.fullName }}
                        </h3>
                        <p class="text-body-2 text-medium-emphasis">
                          {{ holderInfo.holderType }}
                        </p>
                        <VChip
                          :color="getHolderStatusColor(holderInfo.status)"
                          size="small"
                          class="mt-1"
                        >
                          {{ holderInfo.status }}
                        </VChip>
                      </div>
                    </div>
                    <VRow>
                      <VCol cols="12">
                        <VTextField
                          label="ID Number"
                          :model-value="holderInfo.identificationNumber"
                          readonly
                          variant="outlined"
                        />
                      </VCol>
                      <VCol cols="12">
                        <VTextField
                          label="Phone"
                          :model-value="holderInfo.phone"
                          readonly
                          variant="outlined"
                        />
                      </VCol>
                      <VCol cols="12">
                        <VTextField
                          label="Address"
                          :model-value="holderInfo.address"
                          readonly
                          variant="outlined"
                        />
                      </VCol>
                    </VRow>
                  </div>
                  <div
                    v-else
                    class="text-center py-4"
                  >
                    <VProgressCircular
                      indeterminate
                      size="24"
                    />
                    <p class="mt-2">
                      Loading holder information...
                    </p>
                  </div>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Financial Information -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-currency-dollar
                  </VIcon>
                  Financial Information
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol cols="12">
                      <VTextField
                        label="Fee Amount"
                        :model-value="`$${concession.feeAmount.toFixed(2)}`"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                    <VCol cols="12">
                      <VTextField
                        label="Fee Status"
                        :model-value="concession.feePaid ? 'Paid' : 'Unpaid'"
                        readonly
                        variant="outlined"
                        :color="concession.feePaid ? 'success' : 'error'"
                      >
                        <template #prepend-inner>
                          <VIcon :color="concession.feePaid ? 'success' : 'error'">
                            {{ concession.feePaid ? 'tabler-check' : 'tabler-x' }}
                          </VIcon>
                        </template>
                      </VTextField>
                    </VCol>
                    <VCol
                      v-if="concession.lastPaymentDate"
                      cols="12"
                    >
                      <VTextField
                        label="Last Payment Date"
                        :model-value="formatDate(concession.lastPaymentDate)"
                        readonly
                        variant="outlined"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Terms and Notes -->
          <VRow class="mt-4">
            <VCol
              v-if="concession.termsConditions"
              cols="12"
              md="6"
            >
              <VCard>
                <VCardTitle>
                  <VIcon class="mr-2">
                    tabler-file-text
                  </VIcon>
                  Terms and Conditions
                </VCardTitle>
                <VCardText>
                  <VTextarea
                    :model-value="concession.termsConditions"
                    readonly
                    variant="outlined"
                    rows="6"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              v-if="concession.notes"
              cols="12"
              :md="concession.termsConditions ? 6 : 12"
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
                    :model-value="concession.notes"
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
                  Activity Timeline
                </VCardTitle>
                <VCardText>
                  <VTimeline
                    side="end"
                    density="compact"
                  >
                    <VTimelineItem
                      icon="tabler-certificate"
                      dot-color="primary"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(concession.issueDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>Concession Issued</strong>
                          <p class="text-body-2 mt-1">
                            Concession {{ concession.concessionNumber }} was issued
                          </p>
                        </VCardText>
                      </VCard>
                    </VTimelineItem>

                    <VTimelineItem
                      v-if="concession.renewalDate"
                      icon="tabler-refresh"
                      dot-color="info"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(concession.renewalDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>Concession Renewed</strong>
                          <p class="text-body-2 mt-1">
                            Concession was renewed successfully
                          </p>
                        </VCardText>
                      </VCard>
                    </VTimelineItem>

                    <VTimelineItem
                      v-if="concession.lastPaymentDate"
                      icon="tabler-currency-dollar"
                      dot-color="success"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(concession.lastPaymentDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>Payment Received</strong>
                          <p class="text-body-2 mt-1">
                            Fee payment of ${{ concession.feeAmount.toFixed(2) }} received
                          </p>
                        </VCardText>
                      </VCard>
                    </VTimelineItem>

                    <VTimelineItem
                      icon="tabler-calendar-event"
                      :dot-color="isExpiringSoon(concession.expiryDate) ? 'warning' : 'grey'"
                      size="small"
                    >
                      <template #opposite>
                        <span class="text-caption">{{ formatDate(concession.expiryDate) }}</span>
                      </template>
                      <VCard>
                        <VCardText>
                          <strong>{{ isExpiringSoon(concession.expiryDate) ? 'Expires Soon' : 'Expiry Date' }}</strong>
                          <p class="text-body-2 mt-1">
                            {{ isExpiringSoon(concession.expiryDate) ? 'Concession expires soon - renewal required' : 'Scheduled expiry date' }}
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
            Concession Not Found
          </h3>
          <p class="text-body-2 mt-2">
            The concession you're looking for doesn't exist or has been deleted.
          </p>
          <VBtn
            color="primary"
            class="mt-4"
            :to="{ name: 'concessionsList' }"
          >
            Back to Concessions
          </VBtn>
        </VCol>
      </VRow>
    </VContainer>

    <!-- Renewal Dialog -->
    <VDialog
      v-model="showRenewalDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle>Renew Concession</VCardTitle>
        <VCardText>
          <VForm
            ref="renewalFormRef"
            v-model="renewalFormValid"
          >
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="renewalForm.new_expiry_date"
                  label="New Expiry Date *"
                  type="date"
                  :rules="[v => !!v || 'New expiry date is required']"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model.number="renewalForm.fee_amount"
                  label="Renewal Fee *"
                  type="number"
                  prefix="$"
                  step="0.01"
                  :rules="[
                    v => v !== null && v !== undefined && v !== '' || 'Renewal fee is required',
                    v => v > 0 || 'Renewal fee must be greater than 0',
                  ]"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="renewalForm.notes"
                  label="Renewal Notes"
                  rows="3"
                  placeholder="Add any notes about this renewal..."
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showRenewalDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            :loading="renewalLoading"
            :disabled="!renewalFormValid"
            @click="submitRenewal"
          >
            Renew Concession
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.concession-view {
  padding: 20px;
}

.text-error {
  color: rgb(var(--v-theme-error)) !important;
}
</style>
