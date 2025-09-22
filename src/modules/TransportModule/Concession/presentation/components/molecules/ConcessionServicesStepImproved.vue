<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AuthorizedService, RestrictionItem } from '../../../application/dtos/ConcessionDtos'

// Props
interface Props {
  authorizedServices: AuthorizedService[]
  restrictions: RestrictionItem[]
  validValues: {
    authorized_services?: Record<string, any>
    restrictions?: Record<string, any>
    [key: string]: any
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:services': [services: AuthorizedService[]]
  'update:restrictions': [restrictions: RestrictionItem[]]
  validate: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()

// State
const selectedServiceCodes = ref<string[]>(props.authorizedServices.map(s => s.code))
const selectedRestrictionCodes = ref<string[]>(props.restrictions.map(r => r.code))
const restrictionValues = ref<Record<string, string>>({})

// Initialize restriction values
props.restrictions.forEach(r => {
  restrictionValues.value[r.code] = r.value
})

// Available options from API
const availableServices = computed(() => {
  const services = props.validValues.authorized_services || {}

  return Object.entries(services).map(([code, service]: [string, any]) => ({
    code,
    title: service.description || service.label || code,
    category: service.category || 'GENERAL',
    icon: getServiceIcon(service.category || 'GENERAL'),
  }))
})

const availableRestrictions = computed(() => {
  const restrictions = props.validValues.restrictions || {}

  return Object.entries(restrictions).map(([code, restriction]: [string, any]) => ({
    code,
    title: restriction.description || restriction.label || code,
    options: restriction.options || {},
    icon: 'tabler-alert-circle',
  }))
})

// Computed
const isValid = computed(() => {
  // Optional step, always valid
  return true
})

const hasSelectedServices = computed(() => selectedServiceCodes.value.length > 0)
const hasSelectedRestrictions = computed(() => selectedRestrictionCodes.value.length > 0)

// Methods
const getServiceIcon = (category: string) => {
  const icons: Record<string, string> = {
    GENERAL: 'tabler-car',
    URBAN: 'tabler-building-community',
    SUBURBAN: 'tabler-home',
    INTERCITY: 'tabler-road',
    TOURIST: 'tabler-map-2',
    SCHOOL: 'tabler-school',
    SPECIAL: 'tabler-star',
  }

  return icons[category] || 'tabler-car'
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    GENERAL: 'primary',
    URBAN: 'success',
    SUBURBAN: 'info',
    INTERCITY: 'warning',
    TOURIST: 'purple',
    SCHOOL: 'orange',
    SPECIAL: 'error',
  }

  return colors[category] || 'primary'
}

// Update services when selection changes
watch(selectedServiceCodes, newCodes => {
  const services = newCodes.map(code => {
    const service = availableServices.value.find(s => s.code === code)

    return {
      code,
      description: service?.title || code,
      category: service?.category || 'GENERAL',
    }
  })

  emit('update:services', services)
}, { immediate: true })

// Update restrictions when selection changes
watch([selectedRestrictionCodes, restrictionValues], ([newCodes, newValues]) => {
  const restrictions = newCodes.map(code => {
    const restriction = availableRestrictions.value.find(r => r.code === code)
    const value = newValues[code] || ''
    const options = restriction?.options || {}
    const valueLabel = options[value] || value

    return {
      code,
      description: restriction?.title || code,
      value,
      label: restriction?.title || code,
    }
  })

  emit('update:restrictions', restrictions)
}, { deep: true, immediate: true })

watch(isValid, newValue => {
  emit('validate', newValue)
}, { immediate: true })
</script>

<template>
  <div class="concession-services-step-improved">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-h5 mb-2">
        <VIcon
          icon="tabler-settings"
          size="20"
          class="me-2"
          color="primary"
        />
        Servicios y Restricciones (Opcional)
      </h2>
      <p class="text-body-2 text-medium-emphasis">
        Personaliza los servicios específicos y restricciones operativas. Si no seleccionas ninguno, se aplicarán los servicios generales de la modalidad.
      </p>
    </div>

    <VRow>
      <!-- Authorized Services -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard
          variant="outlined"
          class="h-100"
        >
          <VCardTitle class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-list-check"
                size="18"
                class="me-2"
              />
              Servicios Autorizados
              <VChip
                v-if="hasSelectedServices"
                size="x-small"
                color="primary"
                class="ms-2"
              >
                {{ selectedServiceCodes.length }}
              </VChip>
            </div>
          </VCardTitle>

          <VCardText>
            <div v-if="availableServices.length > 0">
              <VList
                v-model:selected="selectedServiceCodes"
                select-strategy="multiple"
                density="compact"
                class="service-list"
              >
                <VListItem
                  v-for="service in availableServices"
                  :key="service.code"
                  :value="service.code"
                  :title="service.title"
                  class="service-item"
                >
                  <template #prepend="{ isSelected }">
                    <VListItemAction start>
                      <VCheckbox
                        :model-value="isSelected"
                        color="primary"
                      />
                    </VListItemAction>
                  </template>

                  <template #append>
                    <VChip
                      :color="getCategoryColor(service.category)"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ service.category }}
                    </VChip>
                  </template>
                </VListItem>
              </VList>
            </div>

            <VAlert
              v-else
              type="info"
              variant="tonal"
              density="compact"
            >
              <VAlertTitle>No hay servicios específicos disponibles</VAlertTitle>
              Se aplicarán los servicios generales de la modalidad seleccionada.
            </VAlert>

            <VAlert
              v-if="!hasSelectedServices && availableServices.length > 0"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              <VAlertTitle>Servicios Generales</VAlertTitle>
              Sin servicios específicos seleccionados, se aplicarán los servicios generales.
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Restrictions -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard
          variant="outlined"
          class="h-100"
        >
          <VCardTitle class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-alert-octagon"
                size="18"
                class="me-2"
              />
              Restricciones Operativas
              <VChip
                v-if="hasSelectedRestrictions"
                size="x-small"
                color="warning"
                class="ms-2"
              >
                {{ selectedRestrictionCodes.length }}
              </VChip>
            </div>
          </VCardTitle>

          <VCardText>
            <div v-if="availableRestrictions.length > 0">
              <div
                v-for="restriction in availableRestrictions"
                :key="restriction.code"
                class="mb-3"
              >
                <VCheckbox
                  v-model="selectedRestrictionCodes"
                  :value="restriction.code"
                  :label="restriction.title"
                  density="compact"
                  class="mb-2"
                />

                <!-- Restriction value selector -->
                <div
                  v-if="selectedRestrictionCodes.includes(restriction.code) && Object.keys(restriction.options).length > 0"
                  class="ms-8"
                >
                  <VSelect
                    v-model="restrictionValues[restriction.code]"
                    :items="Object.entries(restriction.options).map(([value, label]) => ({ title: label, value }))"
                    label="Selecciona un valor"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </div>

                <!-- Custom value input -->
                <div
                  v-else-if="selectedRestrictionCodes.includes(restriction.code) && Object.keys(restriction.options).length === 0"
                  class="ms-8"
                >
                  <VTextField
                    v-model="restrictionValues[restriction.code]"
                    label="Especifica el valor"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </div>
              </div>
            </div>

            <VAlert
              v-else
              type="info"
              variant="tonal"
              density="compact"
            >
              <VAlertTitle>No hay restricciones específicas disponibles</VAlertTitle>
              Se aplicarán las regulaciones generales.
            </VAlert>

            <VAlert
              v-if="!hasSelectedRestrictions && availableRestrictions.length > 0"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              <VAlertTitle>Sin Restricciones Específicas</VAlertTitle>
              Sin restricciones específicas, se aplicarán las regulaciones generales.
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Summary -->
    <VAlert
      type="success"
      variant="tonal"
      class="mt-6"
    >
      <VAlertTitle>Configuración Completada</VAlertTitle>
      <div v-if="hasSelectedServices || hasSelectedRestrictions">
        <span v-if="hasSelectedServices">{{ selectedServiceCodes.length }} servicio(s) autorizado(s)</span>
        <span v-if="hasSelectedServices && hasSelectedRestrictions"> y </span>
        <span v-if="hasSelectedRestrictions">{{ selectedRestrictionCodes.length }} restricción(es) específica(s)</span>
        configurados.
      </div>
      <div v-else>
        La concesión operará bajo configuración estándar sin servicios o restricciones específicas.
      </div>
    </VAlert>
  </div>
</template>

<style scoped>
.concession-services-step-improved {
  max-width: 1200px;
}

.service-list .v-list-item {
  border-radius: 8px;
  margin-bottom: 4px;
}

.service-list .v-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.service-item {
  transition: all 0.2s ease;
}
</style>
