<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVehicleStore } from '../../../../Vehicle/presentation/stores/vehicleStore'

interface Props {
  concession: any
  loading?: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const { openDialog } = useAppManager()

const vehicleStore = useVehicleStore()

// Reactive data
const assignDialog = ref(false)
const availableVehicles = ref([])
const selectedVehicle = ref('')
const assigning = ref(false)

// Computed
const assignedVehicles = computed(() => props.concession?.vehicles || [])
const hasAssignedVehicle = computed(() => assignedVehicles.value.length > 0)

const activeVehicle = computed(() =>
  assignedVehicles.value.find(v => v.status === 'active'),
)

const canAssignVehicle = computed(() =>
  !hasAssignedVehicle.value && props.concession?.status === 'active',
)

// Methods
const fetchAvailableVehicles = async () => {
  try {
    await vehicleStore.fetchList({
      filters: {
        status: 'active',
        concession_id: null, // Only vehicles without concession
      },
    })
    availableVehicles.value = vehicleStore.items
  }
  catch (error) {
    console.error('Error fetching available vehicles:', error)
  }
}

const openAssignDialog = async () => {
  await fetchAvailableVehicles()
  assignDialog.value = true
}

const assignVehicle = async () => {
  if (!selectedVehicle.value)
    return

  assigning.value = true
  try {
    // Call API to assign vehicle to concession
    await vehicleStore.assignToConcession(selectedVehicle.value, props.concession.id)

    assignDialog.value = false
    selectedVehicle.value = ''
    emit('refresh')
  }
  catch (error) {
    console.error('Error assigning vehicle:', error)
  }
  finally {
    assigning.value = false
  }
}

const unassignVehicle = async (vehicleId: string) => {
  try {
    await vehicleStore.unassignFromConcession(vehicleId)
    emit('refresh')
  }
  catch (error) {
    console.error('Error unassigning vehicle:', error)
  }
}

const openVehicleDetail = (vehicle: any) => {
  // Navigate to vehicle detail
  navigateTo(`/vehicles/${vehicle.id}`)
}

const openDriverDetail = (driver: any) => {
  // Navigate to driver detail
  navigateTo(`/drivers/${driver.id}`)
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

const formatDate = (date: string) => {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

// Lifecycle
onMounted(() => {
  // Component is ready
})
</script>

<template>
  <VCardText class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <h4 class="text-h6 d-flex align-center">
        <VIcon class="me-2">
          tabler-car
        </VIcon>
        {{ t('concession.tabs.vehicles') }}
        <VChip
          v-if="assignedVehicles.length > 0"
          :color="hasAssignedVehicle ? 'success' : 'default'"
          size="small"
          class="ms-3"
        >
          {{ assignedVehicles.length }}
        </VChip>
      </h4>

      <VBtn
        v-if="canAssignVehicle"
        color="primary"
        @click="openAssignDialog"
      >
        <VIcon start>
          tabler-plus
        </VIcon>
        {{ t('concession.vehicles.assign_vehicle') }}
      </VBtn>
    </div>

    <!-- No Vehicle Assigned -->
    <div
      v-if="!hasAssignedVehicle"
      class="text-center py-12"
    >
      <VIcon
        size="64"
        color="grey-400"
        class="mb-4"
      >
        tabler-car-off
      </VIcon>
      <h6 class="text-h6 mb-2">
        {{ t('concession.vehicles.no_vehicle') }}
      </h6>
      <p class="text-body-2 mb-4">
        {{ t('concession.vehicles.no_vehicle_description') }}
      </p>

      <VBtn
        v-if="canAssignVehicle"
        color="primary"
        variant="tonal"
        @click="openAssignDialog"
      >
        <VIcon start>
          tabler-plus
        </VIcon>
        {{ t('concession.vehicles.assign_first_vehicle') }}
      </VBtn>
    </div>

    <!-- Assigned Vehicles -->
    <VRow v-else>
      <VCol
        v-for="vehicle in assignedVehicles"
        :key="vehicle.id"
        cols="12"
      >
        <VCard
          variant="outlined"
          class="vehicle-card"
        >
          <VCardText class="pa-4">
            <div class="d-flex justify-space-between align-start mb-4">
              <div class="d-flex align-center">
                <VAvatar
                  size="48"
                  :color="getStatusColor(vehicle.status)"
                  variant="tonal"
                  class="me-3"
                >
                  <VIcon>tabler-car</VIcon>
                </VAvatar>

                <div>
                  <h6 class="text-h6 font-weight-bold">
                    {{ vehicle.plate_number }}
                  </h6>
                  <p class="text-body-2 mb-1">
                    {{ vehicle.make }} {{ vehicle.model }} ({{ vehicle.year }})
                  </p>
                  <VChip
                    :color="getStatusColor(vehicle.status)"
                    size="small"
                    variant="tonal"
                  >
                    {{ vehicle.status }}
                  </VChip>
                </div>
              </div>

              <!-- Actions Menu -->
              <VMenu>
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon
                    variant="text"
                    size="small"
                  >
                    <VIcon>tabler-dots-vertical</VIcon>
                  </VBtn>
                </template>

                <VList density="compact">
                  <VListItem @click="openVehicleDetail(vehicle)">
                    <template #prepend>
                      <VIcon>tabler-eye</VIcon>
                    </template>
                    <VListItemTitle>{{ t('common.view') }}</VListItemTitle>
                  </VListItem>

                  <VListItem
                    v-if="props.concession.status === 'active'"
                    @click="unassignVehicle(vehicle.id)"
                  >
                    <template #prepend>
                      <VIcon>tabler-unlink</VIcon>
                    </template>
                    <VListItemTitle>{{ t('concession.vehicles.unassign') }}</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </div>

            <!-- Vehicle Details -->
            <VRow class="mb-4">
              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('vehicle.fields.fuel_type') }}
                </div>
                <div class="font-weight-medium">
                  {{ vehicle.fuel_type || '-' }}
                </div>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('vehicle.fields.seating_capacity') }}
                </div>
                <div class="font-weight-medium">
                  {{ vehicle.seating_capacity || '-' }}
                </div>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('concession.vehicles.assignment_date') }}
                </div>
                <div class="font-weight-medium">
                  {{ formatDate(vehicle.assignment_date) }}
                </div>
              </VCol>

              <VCol
                cols="6"
                sm="3"
              >
                <div class="text-caption text-medium-emphasis">
                  {{ t('vehicle.fields.last_inspection') }}
                </div>
                <div class="font-weight-medium">
                  {{ formatDate(vehicle.last_inspection) }}
                </div>
              </VCol>
            </VRow>

            <!-- Assigned Drivers -->
            <div v-if="vehicle.drivers && vehicle.drivers.length > 0">
              <div class="text-subtitle-2 font-weight-medium mb-2 d-flex align-center">
                <VIcon
                  class="me-2"
                  size="18"
                >
                  tabler-user
                </VIcon>
                {{ t('concession.vehicles.assigned_drivers') }}
              </div>

              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="driver in vehicle.drivers"
                  :key="driver.id"
                  size="small"
                  variant="outlined"
                  @click="openDriverDetail(driver)"
                >
                  <VAvatar
                    start
                    size="18"
                  >
                    <VIcon size="12">
                      tabler-user
                    </VIcon>
                  </VAvatar>
                  {{ driver.full_name }}
                </VChip>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Assign Vehicle Dialog -->
    <VDialog
      v-model="assignDialog"
      max-width="600"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon class="me-2">
            tabler-car-plus
          </VIcon>
          {{ t('concession.vehicles.assign_vehicle') }}
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <p class="mb-4">
            {{ t('concession.vehicles.assign_description') }}
          </p>

          <VSelect
            v-model="selectedVehicle"
            :label="t('concession.vehicles.select_vehicle')"
            :items="availableVehicles"
            item-title="display_name"
            item-value="id"
            :rules="[v => !!v || t('validation.required')]"
            required
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
                  {{ item.raw.make }} {{ item.raw.model }} ({{ item.raw.year }})
                </VListItemSubtitle>
              </VListItem>
            </template>
          </VSelect>
        </VCardText>

        <VCardActions class="justify-end pa-6 pt-0">
          <VBtn
            variant="outlined"
            @click="assignDialog = false"
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
            {{ t('concession.vehicles.assign') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VCardText>
</template>

<style scoped>
.vehicle-card {
  transition: all 0.3s ease;
}

.vehicle-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
}

.v-chip {
  cursor: pointer;
}
</style>
