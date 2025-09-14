<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AuthorizedService } from '../../../application/dtos/ConcessionDtos'

// Props
interface Props {
  authorizedServices: AuthorizedService[]
  validValues: {
    authorized_services?: Record<string, any>
    [key: string]: any
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:services': [services: AuthorizedService[]]
  validate: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()

// State
const selectedServiceCodes = ref<string[]>(props.authorizedServices.map(s => s.code))
const selectAll = ref(false)

// Available services from API
const availableServices = computed(() => {
  const services = props.validValues.authorized_services || {}
  return Object.entries(services).map(([code, service]: [string, any]) => ({
    code,
    title: service.description || service.label || code,
    category: service.category || 'GENERAL',
    description: service.description || '',
  }))
})

// Group services by category
const servicesByCategory = computed(() => {
  const grouped: Record<string, any[]> = {}
  availableServices.value.forEach(service => {
    if (!grouped[service.category]) {
      grouped[service.category] = []
    }
    grouped[service.category].push(service)
  })
  return grouped
})

const categoryNames: Record<string, string> = {
  'BASIC': 'Básicos',
  'PREMIUM': 'Premium',
  'SPECIAL': 'Especiales',
  'CORPORATE': 'Corporativos',
  'ON_DEMAND': 'Bajo Demanda',
  'LOGISTICS': 'Logística',
  'EVENTS': 'Eventos',
  'EXTENDED': 'Extendidos'
}

// Computed
const isValid = computed(() => true) // Optional step
const hasSelectedServices = computed(() => selectedServiceCodes.value.length > 0)

// Methods
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'BASIC': 'primary',
    'PREMIUM': 'info',
    'SPECIAL': 'warning',
    'CORPORATE': 'success',
    'ON_DEMAND': 'purple',
    'LOGISTICS': 'orange',
    'EVENTS': 'pink',
    'EXTENDED': 'indigo'
  }
  return colors[category] || 'primary'
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedServiceCodes.value = availableServices.value.map(s => s.code)
  } else {
    selectedServiceCodes.value = []
  }
}

const toggleCategory = (category: string) => {
  const categoryServices = servicesByCategory.value[category] || []
  const categoryServiceCodes = categoryServices.map(s => s.code)

  const allSelected = categoryServiceCodes.every(code =>
    selectedServiceCodes.value.includes(code)
  )

  if (allSelected) {
    // Deselect all in category
    selectedServiceCodes.value = selectedServiceCodes.value.filter(code =>
      !categoryServiceCodes.includes(code)
    )
  } else {
    // Select all in category
    categoryServiceCodes.forEach(code => {
      if (!selectedServiceCodes.value.includes(code)) {
        selectedServiceCodes.value.push(code)
      }
    })
  }
}

const isCategorySelected = (category: string) => {
  const categoryServices = servicesByCategory.value[category] || []
  return categoryServices.length > 0 && categoryServices.every(service =>
    selectedServiceCodes.value.includes(service.code)
  )
}

const isCategoryPartiallySelected = (category: string) => {
  const categoryServices = servicesByCategory.value[category] || []
  const selectedInCategory = categoryServices.filter(service =>
    selectedServiceCodes.value.includes(service.code)
  )
  return selectedInCategory.length > 0 && selectedInCategory.length < categoryServices.length
}

// Watchers
watch(selectedServiceCodes, (newCodes) => {
  const services = newCodes.map(code => {
    const service = availableServices.value.find(s => s.code === code)
    return {
      code,
      description: service?.title || code,
      category: service?.category || 'GENERAL'
    }
  })
  emit('update:services', services)

  // Update select all state
  selectAll.value = newCodes.length === availableServices.value.length
}, { immediate: true })

watch(isValid, (newValue) => {
  emit('validate', newValue)
}, { immediate: true })
</script>

<template>
  <div class="concession-services-step">
    <!-- Header -->
    <div class="mb-4">
      <h2 class="text-h6 mb-1 d-flex align-center">
        <VIcon
          icon="tabler-list-check"
          size="18"
          class="me-2"
          color="primary"
        />
        Servicios Autorizados
      </h2>
      <p class="text-body-2 text-medium-emphasis">
        Selecciona los servicios específicos que puede brindar esta concesión (opcional)
      </p>
    </div>

    <!-- Quick Actions -->
    <VCard
      variant="outlined"
      class="mb-3"
    >
      <VCardText class="pa-3">
        <div class="d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="d-flex align-center gap-3">
            <VCheckbox
              v-model="selectAll"
              label="Seleccionar todos"
              density="compact"
              hide-details
              @click="toggleSelectAll"
            />
            <VDivider vertical />
            <div class="text-caption text-medium-emphasis">
              {{ selectedServiceCodes.length }} de {{ availableServices.length }} seleccionados
            </div>
          </div>

          <VBtn
            v-if="hasSelectedServices"
            color="secondary"
            variant="text"
            size="small"
            @click="selectedServiceCodes = []"
          >
            <VIcon
              icon="tabler-x"
              size="14"
              start
            />
            Limpiar
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Services by Category -->
    <div v-if="availableServices.length > 0">
      <div
        v-for="(services, category) in servicesByCategory"
        :key="category"
        class="mb-3"
      >
        <VCard variant="outlined">
          <!-- Category Header -->
          <VCardTitle class="text-subtitle-1 pa-3 pb-2 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VCheckbox
                :model-value="isCategorySelected(category)"
                :indeterminate="isCategoryPartiallySelected(category)"
                density="compact"
                hide-details
                @click="toggleCategory(category)"
              />
              <VChip
                :color="getCategoryColor(category)"
                size="small"
                variant="tonal"
                class="me-2"
              >
                {{ categoryNames[category] || category }}
              </VChip>
              <span>{{ services.length }} servicios</span>
            </div>

            <VChip
              v-if="services.some(s => selectedServiceCodes.includes(s.code))"
              :color="getCategoryColor(category)"
              size="x-small"
              variant="flat"
            >
              {{ services.filter(s => selectedServiceCodes.includes(s.code)).length }}
            </VChip>
          </VCardTitle>

          <!-- Services List -->
          <VCardText class="pt-0 pb-3">
            <VRow dense>
              <VCol
                v-for="service in services"
                :key="service.code"
                cols="12"
                sm="6"
                md="4"
              >
                <VCheckbox
                  v-model="selectedServiceCodes"
                  :value="service.code"
                  :label="service.title"
                  density="compact"
                  hide-details
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </div>
    </div>

    <!-- No services available -->
    <VAlert
      v-else
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <VAlertTitle>No hay servicios específicos disponibles</VAlertTitle>
      Se aplicarán los servicios generales de la modalidad seleccionada.
    </VAlert>

    <!-- Summary -->
    <VAlert
      type="success"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <VAlertTitle>Configuración Completada</VAlertTitle>
      <div v-if="hasSelectedServices">
        Has seleccionado {{ selectedServiceCodes.length }} servicio(s) específico(s).
      </div>
      <div v-else>
        Sin servicios específicos. Se aplicarán los servicios generales de la modalidad.
      </div>
    </VAlert>
  </div>
</template>

<style scoped>
.concession-services-step {
  max-width: 1000px;
}
</style>