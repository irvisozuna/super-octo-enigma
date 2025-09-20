<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useVehicleStore } from '../../../../Vehicle/presentation/stores/vehicleStore'
import VehicleCreateDialogMolecule from '../../../../Vehicle/presentation/components/molecules/VehicleCreateDialogMolecule.vue'
import VehicleAssignDialogMolecule from '../../../../Vehicle/presentation/components/molecules/VehicleAssignDialogMolecule.vue'

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
const router = useRouter()

const vehicleStore = useVehicleStore()

// Reactive data
const createVehicleDialog = ref(false)
const assignVehicleDialog = ref(false)
const availableVehicles = ref([])
const selectedVehicle = ref('')
const assigning = ref(false)

// State for assigned vehicles
const assignedVehicles = ref([])

// Computed
const hasAssignedVehicle = computed(() => assignedVehicles.value.length > 0)

const activeVehicle = computed(() =>
  assignedVehicles.value.find(v => v.status === 'active'),
)

// Business rule: Only one active vehicle per concession
const canAssignVehicle = computed(() => {
  const concessionIsActive = props.concession?.status === 'ACTIVE'
  const noActiveVehicle = !activeVehicle.value

  return concessionIsActive && noActiveVehicle
})

const hasActiveVehicle = computed(() => !!activeVehicle.value)

// Methods
const fetchConcessionVehicles = async () => {
  if (!props.concession?.id)
    return

  try {
    // Use the application service to get vehicles by concession
    assignedVehicles.value = await vehicleStore.applicationService.getVehiclesByConcession(props.concession.id)
  }
  catch (error) {
    console.error('Error fetching concession vehicles:', error)
    assignedVehicles.value = []
  }
}

const fetchAvailableVehicles = async () => {
  try {
    // Set filters for available vehicles (not assigned to any concession)
    vehicleStore.filters.value = {
      status: 'active',
      concession_id: null, // Only vehicles without concession
    }

    await vehicleStore.fetchList()
    availableVehicles.value = vehicleStore.items.value
  }
  catch (error) {
    console.error('Error fetching available vehicles:', error)

    // Fallback to empty array on error
    availableVehicles.value = []
  }
}

const openCreateVehicleDialog = () => {
  createVehicleDialog.value = true
}

const openAssignVehicleDialog = async () => {
  await fetchAvailableVehicles()
  assignVehicleDialog.value = true
}

const assignVehicle = async () => {
  if (!selectedVehicle.value)
    return

  assigning.value = true
  try {
    await vehicleStore.assignToConcession(selectedVehicle.value, props.concession.id)
    assignVehicleDialog.value = false
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

const onVehicleCreated = () => {
  emit('refresh')
}

const onVehicleAssigned = () => {
  emit('refresh')
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
  // TODO: Navigate to vehicle detail when routes are available
  console.log('Opening vehicle detail:', vehicle.id)

  // router.push(`/vehicles/${vehicle.id}`)
}

const openDriverDetail = (driver: any) => {
  // TODO: Navigate to driver detail when routes are available
  console.log('Opening driver detail:', driver.id)

  // router.push(`/drivers/${driver.id}`)
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

// Watch for concession changes
watch(
  () => props.concession?.id,
  newId => {
    if (newId)
      fetchConcessionVehicles()
  },
  { immediate: true },
)

// Lifecycle
onMounted(() => {
  // Component is ready, vehicles will be loaded by the watcher
})
</script>

<template>
  <VCard>
    <VCardText class="pa-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <h4 class="text-h6 d-flex align-center">
          <VIcon class="me-2">
            tabler-car
          </VIcon>
          {{ t('TransportModule.concession.tabs.vehicles') }}
          <VChip
            v-if="assignedVehicles.length > 0"
            :color="hasAssignedVehicle ? 'success' : 'default'"
            size="small"
            class="ms-3"
          >
            {{ assignedVehicles.length }}
          </VChip>
        </h4>

        <VBtnGroup
          v-if="canAssignVehicle"
          variant="outlined"
        >
          <VBtn
            color="primary"
            @click="openCreateVehicleDialog"
          >
            <VIcon start>
              tabler-car-plus
            </VIcon>
            Crear Vehículo
          </VBtn>

          <VBtn
            color="primary"
            @click="openAssignVehicleDialog"
          >
            <VIcon start>
              tabler-car
            </VIcon>
            Asignar Vehículo
          </VBtn>
        </VBtnGroup>

        <VTooltip v-else-if="hasActiveVehicle && props.concession?.status === 'ACTIVE'">
          <template #activator="{ props: tooltipProps }">
            <VBtn
              v-bind="tooltipProps"
              color="warning"
              variant="outlined"
              disabled
            >
              <VIcon start>
                tabler-alert-circle
              </VIcon>
              Vehículo Asignado
            </VBtn>
          </template>
          <span>Esta concesión ya tiene un vehículo activo. Solo se permite un vehículo por concesión.</span>
        </VTooltip>
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
          Sin Vehículo Asignado
        </h6>
        <p class="text-body-2 mb-4">
          Esta concesión no tiene ningún vehículo asignado. Debe asignar un vehículo para que pueda operar.
        </p>

        <VBtnGroup
          v-if="canAssignVehicle"
          variant="outlined"
        >
          <VBtn
            color="primary"
            variant="tonal"
            @click="openCreateVehicleDialog"
          >
            <VIcon start>
              tabler-car-plus
            </VIcon>
            Crear Vehículo
          </VBtn>

          <VBtn
            color="primary"
            variant="tonal"
            @click="openAssignVehicleDialog"
          >
            <VIcon start>
              tabler-car
            </VIcon>
            Asignar Vehículo
          </VBtn>
        </VBtnGroup>

        <VAlert
          v-else-if="props.concession?.status !== 'ACTIVE'"
          type="warning"
          variant="tonal"
          class="mt-4 mx-auto"
          style="max-inline-size: 400px;"
        >
          <VAlertTitle>Regla de Negocio</VAlertTitle>
          La concesión debe estar activa para poder asignar vehículos. Solo se permite un vehículo por concesión.
        </VAlert>
      </div>

      <!-- Assigned Vehicles -->
      <VRow v-else>
        <VCol
          v-for="vehicle in assignedVehicles"
          :key="vehicle.id"
          cols="12"
        >
          <VCard
            variant="elevated"
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
                    <div class="d-flex align-center gap-2">
                      <h6 class="text-h6 font-weight-bold">
                        {{ vehicle.plateNumber || vehicle.plate_number }}
                      </h6>
                      <VChip
                        v-if="vehicle.status === 'active'"
                        color="success"
                        size="x-small"
                        variant="tonal"
                      >
                        <VIcon
                          start
                          size="12"
                        >
                          tabler-circle-check
                        </VIcon>
                        ACTIVO
                      </VChip>
                    </div>
                    <p class="text-body-2 mb-1">
                      {{ vehicle.make }} {{ vehicle.model }} ({{ vehicle.year }})
                    </p>
                    <VChip
                      :color="getStatusColor(vehicle.status)"
                      size="small"
                      variant="outlined"
                    >
                      {{ vehicle.statusLabel || vehicle.status }}
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
                      <VListItemTitle>{{ t('TransportModule.common.view') }}</VListItemTitle>
                    </VListItem>

                    <VListItem
                      v-if="props.concession.status === 'ACTIVE'"
                      class="text-error"
                      @click="unassignVehicle(vehicle.id)"
                    >
                      <template #prepend>
                        <VIcon>tabler-unlink</VIcon>
                      </template>
                      <VListItemTitle>Desasignar Vehículo</VListItemTitle>
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
                    Tipo de Vehiculo
                  </div>
                  <div class="font-weight-medium">
                    {{ vehicle.vehicle_type || '-' }}
                  </div>
                </VCol>

                <VCol
                  cols="6"
                  sm="3"
                >
                  <div class="text-caption text-medium-emphasis">
                    Capacidad de Asientos
                  </div>
                  <div class="font-weight-medium">
                    {{ vehicle.capacity || '-' }}
                  </div>
                </VCol>

                <VCol
                  cols="6"
                  sm="3"
                >
                  <div class="text-caption text-medium-emphasis">
                    VIN
                  </div>
                  <div class="font-weight-medium">
                    {{ vehicle.vin || '-' }}
                  </div>
                </VCol>

                <VCol
                  cols="6"
                  sm="3"
                >
                  <div class="text-caption text-medium-emphasis">
                    Última Inspección
                  </div>
                  <div class="font-weight-medium">
                    {{ formatDate(vehicle.lastInspectionDate) }}
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
                  Conductores Asignados
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
                    {{ driver.fullName || driver.full_name }}
                  </VChip>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Create Vehicle Dialog -->
      <VehicleCreateDialogMolecule
        v-model="createVehicleDialog"
        :concession-id="concession?.id"
        @success="onVehicleCreated"
      />

      <!-- Assign Vehicle Dialog -->
      <VehicleAssignDialogMolecule
        v-model="assignVehicleDialog"
        :concession-id="concession?.id"
        @success="onVehicleAssigned"
      />
    </VCardText>
  </VCard>
</template>

<style scoped>
.vehicle-card {
  transition: all 0.3s ease;
}

.vehicle-card:hover {
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
  transform: translateY(-2px);
}

.v-chip {
  cursor: pointer;
}
</style>
