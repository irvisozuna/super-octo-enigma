<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConcessionStore } from '../stores/concessionStore'
import { useConcessionHolderStore } from '../../../ConcessionHolder/presentation/stores/concessionholderStore'
import type { ConcessionUpdateDto } from '../../application/dtos/ConcessionDtos'
import type { ConcessionEntity } from '../../domain/entities/ConcessionEntity'

// Router
const router = useRouter()
const route = useRoute()
const concessionId = route.params.id as string

// Stores
const concessionStore = useConcessionStore()
const concessionHolderStore = useConcessionHolderStore()

// Form data
const formRef = ref()
const formValid = ref(false)
const loading = ref(false)
const initialLoading = ref(true)
const loadingHolders = ref(false)
const successDialog = ref(false)
const concession = ref<ConcessionEntity | null>(null)

const form = ref<ConcessionUpdateDto>({
  concession_type: '',
  service_area: '',
  route_description: '',
  status: '',
  expiry_date: '',
  renewal_date: '',
  fee_amount: 0,
  fee_paid: false,
  last_payment_date: '',
  terms_conditions: '',
  notes: '',
})

// Options
const concessionTypes = [
  { title: 'Taxi', value: 'TAXI' },
  { title: 'Bus', value: 'BUS' },
  { title: 'Microbus', value: 'MICROBUS' },
  { title: 'Truck', value: 'TRUCK' },
]

const statusOptions = [
  { title: 'Active', value: 'ACTIVE' },
  { title: 'Inactive', value: 'INACTIVE' },
  { title: 'Suspended', value: 'SUSPENDED' },
  { title: 'Expired', value: 'EXPIRED' },
]

const feeStatusOptions = [
  { title: 'Paid', value: true },
  { title: 'Unpaid', value: false },
]

// Computed
const concessionHolders = computed(() =>
  concessionHolderStore.items.map(holder => ({
    ...holder,
    display_name: `${holder.fullName} (${holder.holderType})`,
    full_name: holder.fullName,
    holder_type: holder.holderType,
    identification_number: holder.identificationNumber,
    id: holder.id,
  })),
)

// Methods
const loadConcession = async () => {
  try {
    await concessionStore.fetchById(concessionId)
    concession.value = concessionStore.currentItem

    if (concession.value) {
      // Populate form with existing data
      form.value = {
        concession_type: concession.value.concessionType,
        service_area: concession.value.serviceArea,
        route_description: concession.value.routeDescription,
        status: concession.value.status,
        expiry_date: concession.value.expiryDate,
        renewal_date: concession.value.renewalDate || '',
        fee_amount: concession.value.feeAmount,
        fee_paid: concession.value.feePaid,
        last_payment_date: concession.value.lastPaymentDate || '',
        terms_conditions: concession.value.termsConditions || '',
        notes: concession.value.notes || '',
        holder_id: concession.value.holderId,
      }
    }
  }
  catch (error) {
    console.error('Error loading concession:', error)
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
    await concessionStore.updateItem(concessionId, form.value)
    successDialog.value = true
  }
  catch (error) {
    console.error('Error updating concession:', error)
  }
  finally {
    loading.value = false
  }
}

const goToList = () => {
  router.push({ name: 'concessionsList' })
}

const goToView = () => {
  router.push({ name: 'concessionsView', params: { id: concessionId } })
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadConcession(),
    (async () => {
      loadingHolders.value = true
      try {
        await concessionHolderStore.fetchList()
      }
      catch (error) {
        console.error('Error loading concession holders:', error)
      }
      finally {
        loadingHolders.value = false
      }
    })(),
  ])
})
</script>

<template>
  <div class="concession-edit">
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
              Edit Concession
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
            Loading concession data...
          </p>
        </VCol>
      </VRow>

      <!-- Edit Form -->
      <VRow v-else-if="concession">
        <VCol cols="12">
          <VCard>
            <VCardTitle>
              <VIcon class="mr-2">
                tabler-edit
              </VIcon>
              Edit Concession - {{ concession.concessionNumber }}
            </VCardTitle>
            <VCardText>
              <VForm
                ref="formRef"
                v-model="formValid"
                @submit.prevent="submitForm"
              >
                <VRow>
                  <!-- Concession Type -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="form.concession_type"
                      label="Concession Type *"
                      :items="concessionTypes"
                      :rules="[v => !!v || 'Concession type is required']"
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

                  <!-- Service Area -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.service_area"
                      label="Service Area *"
                      :rules="[v => !!v || 'Service area is required']"
                      required
                    />
                  </VCol>

                  <!-- Route Description -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextarea
                      v-model="form.route_description"
                      label="Route Description"
                      rows="3"
                      placeholder="Describe the route or service details..."
                    />
                  </VCol>

                  <!-- Holder Selection -->
                  <VCol cols="12">
                    <VAutocomplete
                      v-model="form.holder_id"
                      label="Concession Holder *"
                      :items="concessionHolders"
                      item-title="display_name"
                      item-value="id"
                      :loading="loadingHolders"
                      :rules="[v => !!v || 'Concession holder is required']"
                      placeholder="Search and select a concession holder..."
                      clearable
                      required
                    >
                      <template #item="{ props, item }">
                        <VListItem v-bind="props">
                          <VListItemTitle>{{ item.raw.full_name }}</VListItemTitle>
                          <VListItemSubtitle>
                            {{ item.raw.holder_type }} - ID: {{ item.raw.identification_number }}
                          </VListItemSubtitle>
                        </VListItem>
                      </template>
                    </VAutocomplete>
                  </VCol>

                  <!-- Expiry Date -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.expiry_date"
                      label="Expiry Date *"
                      type="date"
                      :rules="[v => !!v || 'Expiry date is required']"
                      required
                    />
                  </VCol>

                  <!-- Renewal Date -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.renewal_date"
                      label="Last Renewal Date"
                      type="date"
                    />
                  </VCol>

                  <!-- Fee Amount -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model.number="form.fee_amount"
                      label="Fee Amount *"
                      type="number"
                      prefix="$"
                      step="0.01"
                      :rules="[
                        v => v !== null && v !== undefined && v !== '' || 'Fee amount is required',
                        v => v > 0 || 'Fee amount must be greater than 0',
                      ]"
                      required
                    />
                  </VCol>

                  <!-- Fee Paid -->
                  <VCol
                    cols="12"
                    md="6"
                  >
                    <VSelect
                      v-model="form.fee_paid"
                      label="Fee Status"
                      :items="feeStatusOptions"
                    />
                  </VCol>

                  <!-- Last Payment Date -->
                  <VCol
                    v-if="form.fee_paid"
                    cols="12"
                    md="6"
                  >
                    <VTextField
                      v-model="form.last_payment_date"
                      label="Last Payment Date"
                      type="date"
                    />
                  </VCol>

                  <!-- Terms and Conditions -->
                  <VCol cols="12">
                    <VTextarea
                      v-model="form.terms_conditions"
                      label="Terms and Conditions"
                      rows="4"
                      placeholder="Enter any specific terms and conditions for this concession..."
                    />
                  </VCol>

                  <!-- Notes -->
                  <VCol cols="12">
                    <VTextarea
                      v-model="form.notes"
                      label="Additional Notes"
                      rows="3"
                      placeholder="Any additional information or notes..."
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
                      Update Concession
                    </VBtn>

                    <VBtn
                      variant="outlined"
                      :to="{ name: 'concessionsList' }"
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
                      :to="{ name: 'concessionsView', params: { id: concessionId } }"
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
            Concession Updated Successfully!
          </h3>
          <p>The concession information has been updated in the system.</p>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            @click="goToList"
          >
            View Concessions
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
.concession-edit {
  padding: 20px;
}
</style>
