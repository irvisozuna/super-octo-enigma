<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { formatDate } from '../../../shared/utils/dateUtils'
import { EquipmentApiService } from '../../../infrastructure/api/services/EquipmentApiService'

export interface ProjectEquipmentTabProps {
  projectId: string
  loading?: boolean
}

const props = withDefaults(defineProps<ProjectEquipmentTabProps>(), {
  loading: false,
})

const emit = defineEmits<{
  'assign': []
  'view': [equipment: any]
  'remove': [equipment: any]
}>()

// Local state
const equipment = ref<any[]>([])
const loadingEquipment = ref(false)
const error = ref<string | null>(null)

// Load equipment for the project
const loadEquipment = async () => {
  if (!props.projectId || loadingEquipment.value) return
  
  loadingEquipment.value = true
  error.value = null
  
  try {
    console.log('🔍 Loading equipment for project:', props.projectId, 'at', new Date().toISOString())
    
    const response = await EquipmentApiService.getEquipment({
      project_id: props.projectId,
      per_page: 100, // Load more equipment if needed
    })
    
    console.log('📦 Equipment response:', response)
    
    // Handle different response structures
    let equipmentData = []
    
    if (response.data) {
      if (Array.isArray(response.data)) {
        equipmentData = response.data
      } else if (response.data.data) {
        equipmentData = response.data.data
      } else {
        equipmentData = [response.data]
      }
    } else if (Array.isArray(response)) {
      equipmentData = response
    }
    
    // Filter only equipment assigned to this project
    equipment.value = equipmentData.filter((item: any) => 
      item.current_project_id === props.projectId
    )
    
    console.log('✅ Equipment loaded:', {
      total: equipmentData.length,
      assigned: equipment.value.length,
      projectId: props.projectId
    })
  }
  catch (err: any) {
    console.error('❌ Error loading equipment:', err)
    error.value = err.message || 'Error al cargar equipos'
    equipment.value = []
  }
  finally {
    loadingEquipment.value = false
  }
}

// Watch for project ID changes
watch(() => props.projectId, (newProjectId) => {
  if (newProjectId) {
    loadEquipment()
  }
}, { immediate: true })

// Expose load method for parent component
defineExpose({
  loadEquipment,
})

const totalEquipment = computed(() => equipment.value.length)

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

    <!-- Loading State -->
    <div
      v-if="loadingEquipment"
      class="text-center pa-8"
    >
      <VIcon
        icon="tabler-loader-2"
        size="48"
        class="animate-spin text-primary mb-4"
      />
      <p class="text-body-1 text-medium-emphasis">
        Cargando equipos...
      </p>
    </div>

    <!-- Error State -->
    <VAlert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      <template #prepend>
        <VIcon
          icon="tabler-alert-circle"
          size="24"
        />
      </template>
      <VAlertTitle class="text-h6 mb-2">
        Error al Cargar Equipos
      </VAlertTitle>
      <p class="mb-0">
        {{ error }}
      </p>
    </VAlert>

    <!-- Equipment Grid -->
    <VRow v-else-if="equipment.length > 0">
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
                  {{ item.equipment_name }}
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
                  :color="getEquipmentColor(item.equipment_type)"
                  size="small"
                  variant="tonal"
                >
                  {{ getEquipmentTypeLabel(item.equipment_type) }}
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
                v-if="item.manufacturer"
                class="d-flex align-center justify-space-between"
              >
                <span class="text-body-2 text-medium-emphasis">Fabricante:</span>
                <span class="text-body-2">{{ item.manufacturer }}</span>
              </div>

              <div
                v-if="item.model"
                class="d-flex align-center justify-space-between"
              >
                <span class="text-body-2 text-medium-emphasis">Modelo:</span>
                <span class="text-body-2">{{ item.model }}</span>
              </div>

              <div
                v-if="item.operating_hours"
                class="d-flex align-center justify-space-between"
              >
                <span class="text-body-2 text-medium-emphasis">Horas de Operación:</span>
                <span class="text-body-2 font-weight-medium">{{ item.operating_hours }} hrs</span>
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
