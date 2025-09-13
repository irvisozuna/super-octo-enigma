<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VehicleEntity } from '../../../domain/entities/VehicleEntity'
import type { ActionButton } from '../../../../shared/types'
import VehicleStatusChipAtom from '../atoms/VehicleStatusChipAtom.vue'
import VehicleTypeIconAtom from '../atoms/VehicleTypeIconAtom.vue'

interface Props {
  vehicle: VehicleEntity
  clickable?: boolean
  showActions?: boolean
  actions?: ActionButton[]
}

const props = withDefaults(defineProps<Props>(), {
  clickable: false,
  showActions: true,
  actions: () => [],
})

const emit = defineEmits<{
  click: [vehicle: VehicleEntity]
}>()

const { t } = useI18n()

const vehicleDisplayName = computed(() => {
  return `${props.vehicle.brand} ${props.vehicle.model}`
})

function handleClick() {
  if (props.clickable)
    emit('click', props.vehicle)
}
</script>

<template>
  <VCard
    class="vehicle-card"
    :class="{ 'vehicle-card--clickable': clickable }"
    elevation="2"
    @click="handleClick"
  >
    <VCardText>
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center gap-2">
          <VehicleTypeIconAtom :vehicle-type="vehicle.vehicle_type" />
          <div>
            <h3 class="text-h6 mb-0">
              {{ vehicle.plate_number }}
            </h3>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ vehicleDisplayName }}
            </p>
          </div>
        </div>

        <VehicleStatusChipAtom :status="vehicle.status" />
      </div>

      <VDivider class="mb-3" />

      <div class="vehicle-details">
        <div class="d-flex align-center mb-2">
          <VIcon
            icon="tabler-calendar"
            size="16"
            class="me-2 text-medium-emphasis"
          />
          <span class="text-body-2">{{ t('vehicle.year') }}: {{ vehicle.year }}</span>
        </div>

        <div class="d-flex align-center mb-2">
          <VIcon
            icon="tabler-users"
            size="16"
            class="me-2 text-medium-emphasis"
          />
          <span class="text-body-2">{{ t('vehicle.capacity') }}: {{ vehicle.capacity }} {{ t('vehicle.passengers') }}</span>
        </div>

        <div
          v-if="vehicle.color"
          class="d-flex align-center mb-2"
        >
          <VIcon
            icon="tabler-palette"
            size="16"
            class="me-2 text-medium-emphasis"
          />
          <span class="text-body-2">{{ t('vehicle.color') }}: {{ vehicle.color }}</span>
        </div>

        <div
          v-if="vehicle.inspection_due"
          class="d-flex align-center mb-2"
        >
          <VIcon
            icon="tabler-alert-circle"
            size="16"
            class="me-2 text-warning"
          />
          <span class="text-body-2 text-warning">{{ t('vehicle.inspectionDue') }}</span>
        </div>
      </div>
    </VCardText>

    <VCardActions
      v-if="showActions"
      class="px-4 pb-4"
    >
      <VBtn
        v-for="action in actions"
        :key="action.key"
        :icon="action.icon"
        :color="action.color"
        :variant="action.variant || 'text'"
        size="small"
        @click.stop="action.handler(vehicle)"
      >
        <VIcon :icon="action.icon" />
        <VTooltip
          activator="parent"
          location="top"
        >
          {{ action.label }}
        </VTooltip>
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<style scoped>
.vehicle-card {
  transition: all 0.2s ease;
  border-radius: 12px;
}

.vehicle-card--clickable {
  cursor: pointer;
}

.vehicle-card--clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.vehicle-details {
  line-height: 1.5;
}

.text-caption {
  font-size: 0.75rem;
}

.text-body-2 {
  font-size: 0.875rem;
}
</style>
