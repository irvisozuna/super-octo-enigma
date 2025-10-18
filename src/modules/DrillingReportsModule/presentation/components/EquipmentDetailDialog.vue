<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface EquipmentDetailDialogProps {
  equipment: any
  modelValue: boolean
}

const props = defineProps<EquipmentDetailDialogProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const getTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    drill_rig: 'Equipo de perforación',
    core_drill: 'Perforadora de núcleo',
    rotary_drill: 'Perforadora rotatoria',
    pump: 'Bomba',
    compressor: 'Compresor',
    generator: 'Generador',
    vehicle: 'Vehículo',
    other: 'Otro',
  }

  return types[type] || type
}

const getStatusLabel = (status: string) => {
  const statuses: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    in_maintenance: 'En mantenimiento',
    retired: 'Retirado',
    out_of_service: 'Fuera de servicio',
  }

  return statuses[status] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    inactive: 'grey',
    in_maintenance: 'warning',
    retired: 'error',
    out_of_service: 'error',
  }

  return colors[status] || 'grey'
}

const formatDate = (date: string | null) => {
  if (!date)
    return 'N/A'

  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const specifications = computed(() => {
  if (!props.equipment?.specifications)
    return []

  return Object.entries(props.equipment.specifications).map(([key, value]) => ({
    key,
    value,
  }))
})

const serviceProgress = computed(() => {
  if (!props.equipment?.service_interval_hours || !props.equipment?.operating_hours)
    return 0

  const progress = (props.equipment.operating_hours / props.equipment.service_interval_hours) * 100

  return Math.min(progress, 100)
})

const serviceProgressColor = computed(() => {
  const progress = serviceProgress.value
  if (progress >= 90)
    return 'error'
  if (progress >= 70)
    return 'warning'

  return 'success'
})

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    drill_rig: 'tabler-tool',
    core_drill: 'tabler-circle-dot',
    rotary_drill: 'tabler-rotate-clockwise',
    pump: 'tabler-droplet',
    compressor: 'tabler-wind',
    generator: 'tabler-bolt',
    vehicle: 'tabler-car',
    other: 'tabler-settings',
  }

  return icons[type] || 'tabler-settings'
}
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="1100"
    scrollable
  >
    <VCard
      v-if="equipment"
      class="equipment-detail-dialog"
    >
      <!-- Premium Header with Gradient -->
      <div class="detail-header">
        <div class="d-flex align-center justify-space-between px-6 py-5">
          <div class="d-flex align-center">
            <VAvatar
              :color="getStatusColor(equipment.status)"
              size="56"
              class="me-4 elevation-3"
            >
              <VIcon
                :icon="getTypeIcon(equipment.equipment_type)"
                size="32"
                color="white"
              />
            </VAvatar>
            <div>
              <h2 class="text-h4 font-weight-bold text-white mb-1">
                {{ equipment.equipment_name }}
              </h2>
              <div class="d-flex align-center gap-2">
                <VIcon
                  icon="tabler-qrcode"
                  size="16"
                  class="text-white opacity-80"
                />
                <span class="text-body-1 text-white opacity-90">{{ equipment.equipment_code }}</span>
              </div>
            </div>
          </div>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="white"
            size="large"
            @click="dialog = false"
          />
        </div>

        <!-- Status Chips Row -->
        <div class="px-6 pb-4 d-flex align-center gap-3 flex-wrap">
          <VChip
            :color="getStatusColor(equipment.status)"
            size="large"
            variant="flat"
            class="font-weight-bold px-4"
          >
            <VIcon
              icon="tabler-circle-filled"
              size="10"
              class="me-2"
            />
            {{ getStatusLabel(equipment.status) }}
          </VChip>
          <VChip
            v-if="equipment.is_assigned"
            color="info"
            size="large"
            variant="flat"
            class="px-4"
          >
            <VIcon
              icon="tabler-link"
              size="18"
              class="me-2"
            />
            Asignado a Proyecto
          </VChip>
          <VChip
            v-if="equipment.needs_service"
            color="warning"
            size="large"
            variant="flat"
            class="px-4 pulse-animation"
          >
            <VIcon
              icon="tabler-alert-triangle"
              size="18"
              class="me-2"
            />
            Requiere Mantenimiento
          </VChip>
        </div>
      </div>

      <VDivider />

      <VCardText class="pa-6">
        <!-- Main Information Grid -->
        <VRow>
          <!-- Left Column -->
          <VCol
            cols="12"
            md="6"
          >
            <!-- General Info Card -->
            <VCard
              variant="outlined"
              class="mb-4 detail-card"
            >
              <VCardTitle class="d-flex align-center pa-4 bg-grey-lighten-5">
                <VIcon
                  icon="tabler-info-circle"
                  size="20"
                  class="me-2 text-primary"
                />
                <span class="text-h6">Información General</span>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-4">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-barcode"
                        size="16"
                        class="me-1"
                      />
                      Código
                    </div>
                    <div class="info-value font-weight-bold">
                      {{ equipment.equipment_code }}
                    </div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-category"
                        size="16"
                        class="me-1"
                      />
                      Tipo
                    </div>
                    <div class="info-value">
                      {{ getTypeLabel(equipment.equipment_type) }}
                    </div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-building-factory"
                        size="16"
                        class="me-1"
                      />
                      Fabricante
                    </div>
                    <div class="info-value">
                      {{ equipment.manufacturer || 'N/A' }}
                    </div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-tag"
                        size="16"
                        class="me-1"
                      />
                      Modelo
                    </div>
                    <div class="info-value">
                      {{ equipment.model || 'N/A' }}
                    </div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-hash"
                        size="16"
                        class="me-1"
                      />
                      Número de Serie
                    </div>
                    <div class="info-value">
                      {{ equipment.serial_number || 'N/A' }}
                    </div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-calendar-event"
                        size="16"
                        class="me-1"
                      />
                      Año de Fabricación
                    </div>
                    <div class="info-value">
                      {{ equipment.year_manufactured || 'N/A' }}
                    </div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-shopping-cart"
                        size="16"
                        class="me-1"
                      />
                      Fecha de Compra
                    </div>
                    <div class="info-value">
                      {{ formatDate(equipment.purchase_date) }}
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- Maintenance Info Card -->
            <VCard
              variant="outlined"
              class="detail-card"
            >
              <VCardTitle class="d-flex align-center pa-4 bg-grey-lighten-5">
                <VIcon
                  icon="tabler-wrench"
                  size="20"
                  class="me-2 text-warning"
                />
                <span class="text-h6">Mantenimiento</span>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-4">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-clock-check"
                        size="16"
                        class="me-1"
                      />
                      Último Servicio
                    </div>
                    <div class="info-value">
                      {{ formatDate(equipment.last_service_date) }}
                    </div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-clock-plus"
                        size="16"
                        class="me-1"
                      />
                      Próximo Servicio
                    </div>
                    <div class="info-value">
                      {{ formatDate(equipment.next_service_date) }}
                    </div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <VIcon
                        icon="tabler-refresh"
                        size="16"
                        class="me-1"
                      />
                      Intervalo de Servicio
                    </div>
                    <div class="info-value">
                      {{ equipment.service_interval_hours || 'N/A' }} hrs
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Right Column -->
          <VCol
            cols="12"
            md="6"
          >
            <!-- Operating Hours Card with Circular Progress -->
            <VCard
              variant="outlined"
              class="mb-4 detail-card"
            >
              <VCardTitle class="d-flex align-center pa-4 bg-grey-lighten-5">
                <VIcon
                  icon="tabler-clock"
                  size="20"
                  class="me-2 text-success"
                />
                <span class="text-h6">Horas de Operación</span>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-6 text-center">
                <!-- Large Hour Display -->
                <div class="mb-4">
                  <div class="text-h2 font-weight-bold text-primary mb-2">
                    {{ equipment.operating_hours?.toFixed(1) || '0.0' }}
                  </div>
                  <div class="text-h6 text-medium-emphasis">
                    Horas Totales
                  </div>
                </div>

                <!-- Progress to Service -->
                <div
                  v-if="equipment.service_interval_hours"
                  class="mt-6"
                >
                  <div class="d-flex justify-center mb-4">
                    <VProgressCircular
                      :model-value="serviceProgress"
                      :color="serviceProgressColor"
                      :size="120"
                      :width="12"
                      class="progress-circle"
                    >
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold">
                          {{ serviceProgress.toFixed(0) }}%
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          Progreso
                        </div>
                      </div>
                    </VProgressCircular>
                  </div>

                  <VAlert
                    :color="serviceProgressColor"
                    variant="tonal"
                    class="mb-0"
                  >
                    <div class="d-flex align-center">
                      <VIcon
                        :icon="serviceProgress >= 90 ? 'tabler-alert-triangle' : 'tabler-info-circle'"
                        class="me-2"
                      />
                      <div>
                        <div class="font-weight-bold">
                          Próximo mantenimiento
                        </div>
                        <div class="text-caption">
                          {{ (equipment.service_interval_hours - equipment.operating_hours).toFixed(1) }} hrs restantes
                        </div>
                      </div>
                    </div>
                  </VAlert>
                </div>
              </VCardText>
            </VCard>

            <!-- Quick Stats -->
            <VRow class="mb-4">
              <VCol cols="6">
                <VCard
                  variant="outlined"
                  class="text-center pa-4 stat-card"
                  :class="equipment.is_active ? 'border-success' : 'border-grey'"
                >
                  <VIcon
                    :icon="equipment.is_active ? 'tabler-circle-check' : 'tabler-circle-x'"
                    :color="equipment.is_active ? 'success' : 'grey'"
                    size="32"
                    class="mb-2"
                  />
                  <div class="text-caption text-medium-emphasis">
                    Estado
                  </div>
                  <div class="text-body-1 font-weight-bold">
                    {{ equipment.is_active ? 'Activo' : 'Inactivo' }}
                  </div>
                </VCard>
              </VCol>
              <VCol cols="6">
                <VCard
                  variant="outlined"
                  class="text-center pa-4 stat-card"
                  :class="equipment.is_assigned ? 'border-info' : 'border-grey'"
                >
                  <VIcon
                    :icon="equipment.is_assigned ? 'tabler-link' : 'tabler-unlink'"
                    :color="equipment.is_assigned ? 'info' : 'grey'"
                    size="32"
                    class="mb-2"
                  />
                  <div class="text-caption text-medium-emphasis">
                    Asignación
                  </div>
                  <div class="text-body-1 font-weight-bold">
                    {{ equipment.is_assigned ? 'Asignado' : 'Disponible' }}
                  </div>
                </VCard>
              </VCol>
            </VRow>
          </VCol>
        </VRow>

        <!-- Specifications Card -->
        <VCard
          v-if="specifications.length > 0"
          variant="outlined"
          class="mt-4 detail-card"
        >
          <VCardTitle class="d-flex align-center pa-4 bg-grey-lighten-5">
            <VIcon
              icon="tabler-list-details"
              size="20"
              class="me-2 text-info"
            />
            <span class="text-h6">Especificaciones Técnicas</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-4">
            <VRow>
              <VCol
                v-for="spec in specifications"
                :key="spec.key"
                cols="12"
                sm="6"
                md="4"
              >
                <div class="spec-item">
                  <VIcon
                    icon="tabler-chevron-right"
                    size="14"
                    class="me-2 text-primary"
                  />
                  <div>
                    <div class="text-caption text-medium-emphasis text-capitalize">
                      {{ spec.key.replace(/_/g, ' ') }}
                    </div>
                    <div class="text-body-1 font-weight-medium">
                      {{ spec.value }}
                    </div>
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Audit Trail -->
        <VCard
          variant="outlined"
          class="mt-4 detail-card"
        >
          <VCardTitle class="d-flex align-center pa-4 bg-grey-lighten-5">
            <VIcon
              icon="tabler-history"
              size="20"
              class="me-2 text-secondary"
            />
            <span class="text-h6">Registro de Auditoría</span>
          </VCardTitle>
          <VDivider />
          <VCardText class="pa-4">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <div class="info-item">
                  <div class="info-label">
                    <VIcon
                      icon="tabler-calendar-plus"
                      size="16"
                      class="me-1"
                    />
                    Fecha de Creación
                  </div>
                  <div class="info-value">
                    {{ formatDate(equipment.created_at) }}
                  </div>
                </div>
              </VCol>
              <VCol
                v-if="equipment.updated_at"
                cols="12"
                md="6"
              >
                <div class="info-item">
                  <div class="info-label">
                    <VIcon
                      icon="tabler-calendar-edit"
                      size="16"
                      class="me-1"
                    />
                    Última Actualización
                  </div>
                  <div class="info-value">
                    {{ formatDate(equipment.updated_at) }}
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 bg-grey-lighten-5">
        <VSpacer />
        <VBtn
          variant="text"
          color="secondary"
          @click="dialog = false"
        >
          <VIcon
            icon="tabler-x"
            class="me-2"
          />
          Cerrar
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
        >
          <VIcon
            icon="tabler-edit"
            class="me-2"
          />
          Editar Equipo
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.equipment-detail-dialog {
  .detail-header {
    background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-primary-darken-1)) 100%);
  }

  .detail-card {
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .info-grid {
    display: grid;
    gap: 1.25rem;
  }

  .info-item {
    .info-label {
      font-size: 0.75rem;
      color: rgba(var(--v-theme-on-surface), 0.6);
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .info-value {
      font-size: 0.95rem;
      color: rgba(var(--v-theme-on-surface), 0.87);
      line-height: 1.5;
    }
  }

  .spec-item {
    display: flex;
    align-items: start;
    padding: 0.75rem;
    border-radius: 8px;
    background: rgba(var(--v-theme-surface), 0.5);
    transition: all 0.2s ease;

    &:hover {
      background: rgba(var(--v-theme-primary), 0.05);
      transform: translateX(4px);
    }
  }

  .progress-circle {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .stat-card {
    transition: all 0.3s ease;
    border-width: 2px;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }
  }

  .pulse-animation {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
}
</style>
