<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '../../../shared/utils/dateUtils'

export interface ProjectEquipmentTabProps {
  equipment: any[]
  loading?: boolean
}

const props = withDefaults(defineProps<ProjectEquipmentTabProps>(), {
  loading: false,
})

defineEmits<{
  'assign': []
  'view': [equipment: any]
  'remove': [equipment: any]
}>()

const totalEquipment = computed(() => props.equipment.length)

const getEquipmentIcon = (type: string) => {
  const icons: Record<string, string> = {
    drill: 'tabler-tool',
    pump: 'tabler-ripple',
    compressor: 'tabler-wind',
    generator: 'tabler-bolt',
    vehicle: 'tabler-car',
    tool: 'tabler-hammer',
    other: 'tabler-tool',
  }

  return icons[type] || 'tabler-tool'
}

const getEquipmentColor = (type: string) => {
  const colors: Record<string, string> = {
    drill: 'primary',
    pump: 'info',
    compressor: 'warning',
    generator: 'success',
    vehicle: 'secondary',
    tool: 'primary',
    other: 'grey',
  }

  return colors[type] || 'grey'
}

const getEquipmentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    drill: 'Perforadora',
    pump: 'Bomba',
    compressor: 'Compresor',
    generator: 'Generador',
    vehicle: 'Vehículo',
    tool: 'Herramienta',
    other: 'Otro',
  }

  return labels[type] || type
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    operational: 'success',
    maintenance: 'warning',
    out_of_service: 'error',
    available: 'info',
  }

  return colors[status] || 'grey'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    operational: 'Operativo',
    maintenance: 'Mantenimiento',
    out_of_service: 'Fuera de Servicio',
    available: 'Disponible',
  }

  return labels[status] || status
}
</script>

<template>
  <div class="project-equipment-tab pa-6">
    <!-- Header with Actions -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h6 class="text-h6 mb-1">
          Equipos Asignados
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ totalEquipment }} {{ totalEquipment === 1 ? 'equipo asignado' : 'equipos asignados' }}
        </p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-tool"
        @click="$emit('assign')"
      >
        Asignar Equipo
      </VBtn>
    </div>

    <!-- Equipment Grid -->
    <VRow v-if="equipment.length > 0">
      <VCol
        v-for="item in equipment"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <VCard>
          <VCardText>
            <div class="d-flex align-center gap-3 mb-3">
              <VAvatar
                :color="getEquipmentColor(item.type)"
                size="48"
                variant="tonal"
              >
                <VIcon
                  :icon="getEquipmentIcon(item.type)"
                  size="24"
                />
              </VAvatar>
              <div class="flex-grow-1">
                <h6 class="text-h6 text-truncate">
                  {{ item.name }}
                </h6>
                <p class="text-caption text-medium-emphasis mb-0">
                  {{ item.equipment_code || 'N/A' }}
                </p>
              </div>
            </div>

            <VDivider class="my-3" />

            <!-- Equipment Details -->
            <div class="d-flex flex-column gap-2">
              <div class="d-flex align-center justify-space-between">
                <span class="text-body-2 text-medium-emphasis">Tipo:</span>
                <VChip
                  :color="getEquipmentColor(item.type)"
                  size="small"
                  variant="tonal"
                >
                  {{ getEquipmentTypeLabel(item.type) }}
                </VChip>
              </div>

              <div class="d-flex align-center justify-space-between">
                <span class="text-body-2 text-medium-emphasis">Estado:</span>
                <VChip
                  :color="getStatusColor(item.status)"
                  size="small"
                  variant="tonal"
                >
                  {{ getStatusLabel(item.status) }}
                </VChip>
              </div>

              <div
                v-if="item.assigned_at"
                class="d-flex align-center justify-space-between"
              >
                <span class="text-body-2 text-medium-emphasis">Asignado:</span>
                <span class="text-body-2">{{ formatDate(item.assigned_at) }}</span>
              </div>

              <div
                v-if="item.horometer"
                class="d-flex align-center justify-space-between"
              >
                <span class="text-body-2 text-medium-emphasis">Horómetro:</span>
                <span class="text-body-2 font-weight-medium">{{ item.horometer }} hrs</span>
              </div>
            </div>

            <VDivider class="my-3" />

            <!-- Actions -->
            <div class="d-flex gap-2">
              <VBtn
                variant="text"
                size="small"
                prepend-icon="tabler-eye"
                @click="$emit('view', item)"
              >
                Ver
              </VBtn>
              <VSpacer />
              <VBtn
                variant="text"
                size="small"
                color="error"
                icon="tabler-trash"
                @click="$emit('remove', item)"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Empty State -->
    <VCard
      v-else
      variant="outlined"
    >
      <VCardText class="text-center pa-12">
        <VIcon
          icon="tabler-tools-off"
          size="64"
          class="text-medium-emphasis mb-4"
        />
        <h5 class="text-h5 mb-2">
          No hay equipos asignados
        </h5>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Aún no se han asignado equipos a este proyecto
        </p>
        <VBtn
          color="primary"
          prepend-icon="tabler-tool"
          @click="$emit('assign')"
        >
          Asignar Primer Equipo
        </VBtn>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.project-equipment-tab {
  min-block-size: 400px;
}
</style>
