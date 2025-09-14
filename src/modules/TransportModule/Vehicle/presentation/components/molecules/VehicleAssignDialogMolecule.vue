<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from '../../stores/vehicleStore'
import type { VehicleListDto } from '../../application/dtos/VehicleDtos'

interface Props {
  modelValue: boolean
  concessionId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const vehicleStore = useVehicleStore()

// Dialog state
const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Form state
const selectedVehicle = ref('')
const availableVehicles = ref<VehicleListDto[]>([])
const loadingVehicles = ref(false)
const assigning = ref(false)

// Computed
const selectedVehicleDetails = computed(() => {
  return availableVehicles.value.find(v => v.id === selectedVehicle.value)
})

// Methods
const closeDialog = () => {
  dialog.value = false
  selectedVehicle.value = ''
  availableVehicles.value = []
}

const fetchAvailableVehicles = async () => {
  loadingVehicles.value = true

  try {
    // Get vehicles that are not assigned to any concession
    const response = await vehicleStore.apiService.getList({
      status: 'ACTIVE',
      concession_id: '', // Empty means not assigned
      per_page: 100,
    })

    availableVehicles.value = response.data
  }
  catch (error) {
    console.error('Error fetching available vehicles:', error)
    availableVehicles.value = []
  }
  finally {
    loadingVehicles.value = false
  }
}

const assignVehicle = async () => {
  if (!selectedVehicle.value)
    return

  assigning.value = true

  try {
    await vehicleStore.assignToConcession(selectedVehicle.value, props.concessionId)
    emit('success')
    closeDialog()
  }
  catch (error) {
    console.error('Error assigning vehicle:', error)
  }
  finally {
    assigning.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    active: 'success',
    inactive: 'warning',
    maintenance: 'info',
    retired: 'error',
  }

  return colors[status?.toLowerCase()] || 'default'
}

// Watch for dialog changes
watch(dialog, newValue => {
  if (newValue) {
    fetchAvailableVehicles()
  }
  else {
    selectedVehicle.value = ''
    availableVehicles.value = []
  }
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="600"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon class="me-2">
          tabler-car-plus
        </VIcon>
        {{ t('vehicle.actions.assign_vehicle') }}
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-6">
        <VAlert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <VAlertTitle>{{ t('TransportModule.vehicle.rules.business_rule') }}</VAlertTitle>
          {{ t('TransportModule.vehicle.rules.one_vehicle_per_concession') }}
        </VAlert>

        <p class="mb-4">
          {{ t('TransportModule.vehicle.messages.select_vehicle_to_assign') }}
        </p>

        <VSelect
          v-model="selectedVehicle"
          :label="`${t('TransportModule.vehicle.fields.select_vehicle')} *`"
          :items="availableVehicles"
          item-title="plate_number"
          item-value="id"
          :rules="[v => !!v || t('validation.required')]"
          :loading="loadingVehicles"
          :no-data-text="availableVehicles.length === 0 ? t('TransportModule.vehicle.messages.no_vehicles_available') : t('common.no_data')"
          required
          clearable
        >
          <template #item="{ props, item }">
            <VListItem v-bind="props">
              <template #prepend>
                <VAvatar
                  size="32"
                  color="primary"
                  variant="tonal"
                >
                  <VIcon>tabler-car</VIcon>
                </VAvatar>
              </template>
              <VListItemTitle>{{ item.raw.plate_number }}</VListItemTitle>
              <VListItemSubtitle>
                {{ item.raw.brand }} {{ item.raw.model }} ({{ item.raw.year }}) - {{ item.raw.status_label }}
              </VListItemSubtitle>
            </VListItem>
          </template>
        </VSelect>

        <!-- Selected Vehicle Details -->
        <VCard
          v-if="selectedVehicleDetails"
          variant="outlined"
          class="mt-4"
        >
          <VCardText class="pa-4">
            <h6 class="text-subtitle-1 mb-3">
              {{ t('TransportModule.vehicle.sections.selected_vehicle') }}
            </h6>

            <VRow>
              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('TransportModule.vehicle.fields.plate_number') }}
                </div>
                <div class="font-weight-medium">
                  {{ selectedVehicleDetails.plate_number }}
                </div>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('TransportModule.vehicle.fields.brand') }}
                </div>
                <div class="font-weight-medium">
                  {{ selectedVehicleDetails.brand }}
                </div>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('TransportModule.vehicle.fields.model') }}
                </div>
                <div class="font-weight-medium">
                  {{ selectedVehicleDetails.model }}
                </div>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('TransportModule.vehicle.fields.year') }}
                </div>
                <div class="font-weight-medium">
                  {{ selectedVehicleDetails.year }}
                </div>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('TransportModule.vehicle.fields.vehicle_type') }}
                </div>
                <div class="font-weight-medium">
                  {{ selectedVehicleDetails.vehicle_type_label }}
                </div>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('TransportModule.vehicle.fields.capacity') }}
                </div>
                <div class="font-weight-medium">
                  {{ selectedVehicleDetails.capacity }}
                </div>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('TransportModule.vehicle.fields.status') }}
                </div>
                <VChip
                  :color="getStatusColor(selectedVehicleDetails.status)"
                  size="small"
                  variant="tonal"
                >
                  {{ selectedVehicleDetails.status_label }}
                </VChip>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('TransportModule.vehicle.fields.color') }}
                </div>
                <div class="font-weight-medium">
                  {{ selectedVehicleDetails.color }}
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCardText>

      <VCardActions class="justify-end pa-6 pt-0">
        <VBtn
          variant="outlined"
          :disabled="assigning"
          @click="closeDialog"
        >
          {{ t('common.cancel') }}
        </VBtn>

        <VBtn
          color="primary"
          :loading="assigning"
          :disabled="!selectedVehicle"
          @click="assignVehicle"
        >
          <VIcon start>
            tabler-check
          </VIcon>
          {{ t('TransportModule.vehicle.actions.assign') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
