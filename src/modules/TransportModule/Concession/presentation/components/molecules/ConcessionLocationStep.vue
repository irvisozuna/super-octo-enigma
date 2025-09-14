<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// Props
interface Props {
  modelValue: {
    municipality: string
    route_or_site?: string
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: { municipality: string; route_or_site?: string }]
  validate: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()

// State
const localData = ref({
  municipality: props.modelValue.municipality,
  route_or_site: props.modelValue.route_or_site || '',
})

// Common municipalities in Mexico (you can expand this list)
const commonMunicipalities = [
  'Hermosillo',
  'Cajeme',
  'Nogales',
  'Navojoa',
  'Guaymas',
  'San Luis Río Colorado',
  'Agua Prieta',
  'Huatabampo',
  'Caborca',
  'Puerto Peñasco',
]

// Computed
const isValid = computed(() => {
  return !!localData.value.municipality?.trim()
})

const characterCount = computed(() => {
  return localData.value.route_or_site?.length || 0
})

// Watchers
watch(localData, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

watch(isValid, (newValue) => {
  emit('validate', newValue)
}, { immediate: true })
</script>

<template>
  <div class="concession-location-step">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-h5 mb-2">
        <VIcon
          icon="tabler-map-pin"
          size="20"
          class="me-2"
          color="primary"
        />
        Ubicación y Área de Servicio
      </h2>
      <p class="text-body-2 text-medium-emphasis">
        Define el municipio y la descripción del área donde operará esta concesión.
      </p>
    </div>

    <!-- Form -->
    <VRow>
      <!-- Municipality -->
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-map-pin"
              class="me-2"
            />
            Municipio de Operación
          </VCardTitle>
          <VCardText>
            <VCombobox
              v-model="localData.municipality"
              label="Municipio *"
              :items="commonMunicipalities"
              :rules="[v => !!v || 'El municipio es requerido']"
              required
              prepend-inner-icon="tabler-map-pin"
              variant="outlined"
              hint="Selecciona o escribe el nombre del municipio donde operará la concesión"
              persistent-hint
              clearable
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- Route or Site Description -->
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-route"
              class="me-2"
            />
            Descripción de Ruta o Sitio Autorizado
          </VCardTitle>
          <VCardText>
            <VTextarea
              v-model="localData.route_or_site"
              label="Ruta o Sitio Autorizado"
              rows="4"
              auto-grow
              :counter="1000"
              placeholder="Describe detalladamente la ruta, sitios específicos, o área geográfica donde está autorizada a operar esta concesión..."
              prepend-inner-icon="tabler-route"
              variant="outlined"
              hint="Descripción opcional pero recomendada del área de cobertura"
              persistent-hint
            />
            <div class="d-flex justify-space-between align-center mt-2">
              <div class="text-caption text-medium-emphasis">
                Caracteres: {{ characterCount }}/1000
              </div>
              <VChip
                v-if="characterCount > 0"
                size="x-small"
                :color="characterCount > 800 ? 'warning' : 'success'"
              >
                {{ characterCount > 800 ? 'Cerca del límite' : 'Longitud adecuada' }}
              </VChip>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Examples Section -->
    <VCard
      variant="outlined"
      color="info"
      class="mb-6"
    >
      <VCardTitle class="text-info">
        <VIcon
          icon="tabler-lightbulb"
          class="me-2"
        />
        Ejemplos de Descripción
      </VCardTitle>
      <VCardText>
        <p class="text-body-2 mb-3">
          Aquí tienes algunos ejemplos de cómo describir rutas o sitios:
        </p>

        <VExpansionPanels variant="accordion">
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <VIcon
                icon="tabler-bus"
                class="me-2"
                size="20"
              />
              Servicio Urbano
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              "Ruta centro-norte del municipio de Hermosillo, comprendiendo las colonias Centro, San Benito, Pitic, Villa de Seris y fraccionamientos aledaños. Recorrido desde el Centro Histórico hasta Boulevard Solidaridad."
            </VExpansionPanelText>
          </VExpansionPanel>

          <VExpansionPanel>
            <VExpansionPanelTitle>
              <VIcon
                icon="tabler-car"
                class="me-2"
                size="20"
              />
              Servicio de Taxi
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              "Servicio de taxi en todo el municipio de Cajeme, incluyendo Ciudad Obregón y comunidades rurales del valle del Yaqui. Autorizado para servicios al aeropuerto internacional y traslados intermunicipales."
            </VExpansionPanelText>
          </VExpansionPanel>

          <VExpansionPanel>
            <VExpansionPanelTitle>
              <VIcon
                icon="tabler-map-2"
                class="me-2"
                size="20"
              />
              Ruta Específica
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              "Ruta fija Hermosillo-Bahía de Kino, con paradas intermedias en Miguel Alemán, La Colorada y Kino Viejo. Frecuencia de 6 corridas diarias en ambos sentidos."
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </VCardText>
    </VCard>

    <!-- Preview Section -->
    <VCard
      v-if="isValid"
      variant="outlined"
      color="success"
      class="mb-6"
    >
      <VCardTitle class="text-success">
        <VIcon
          icon="tabler-check-circle"
          class="me-2"
        />
        Vista Previa
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis">
              Municipio
            </div>
            <div class="text-h6 mb-3">
              {{ localData.municipality }}
            </div>
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis">
              Estado del Área de Servicio
            </div>
            <VChip
              :color="localData.route_or_site ? 'success' : 'warning'"
              size="small"
            >
              {{ localData.route_or_site ? 'Descrita' : 'Sin descripción' }}
            </VChip>
          </VCol>
          <VCol
            v-if="localData.route_or_site"
            cols="12"
          >
            <div class="text-caption text-medium-emphasis mb-2">
              Descripción de Ruta/Sitio
            </div>
            <div class="text-body-2 pa-3 bg-surface-variant rounded">
              {{ localData.route_or_site }}
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Validation Status -->
    <VAlert
      v-if="!isValid"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      <VAlertTitle>Municipio Requerido</VAlertTitle>
      Debes especificar el municipio donde operará la concesión.
    </VAlert>

    <VAlert
      v-else
      type="success"
      variant="tonal"
      class="mb-4"
    >
      <VAlertTitle>¡Ubicación Definida!</VAlertTitle>
      La información de ubicación está completa.
      {{ localData.route_or_site ? 'Has incluido una descripción detallada del área de servicio.' : 'Considera agregar una descripción del área de servicio para mayor claridad.' }}
    </VAlert>
  </div>
</template>

<style scoped>
.concession-location-step {
  max-width: 1000px;
}
</style>