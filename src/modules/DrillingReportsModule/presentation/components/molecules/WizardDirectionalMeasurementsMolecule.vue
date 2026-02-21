<script setup lang="ts">
import { computed } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import {
  MEASUREMENT_INTERVAL_OPTIONS,
  REPORT_VALIDATION_RULES,
} from '../../../shared/constants'

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES

// Computed
const formData = computed(() => wizardStore.formData)

const isDirectionalMeasurementsStepValid = computed(() => wizardStore.isDirectionalMeasurementsStepValid)

// Options
const measurementIntervalOptions = MEASUREMENT_INTERVAL_OPTIONS

// Handlers
const addMeasurement = () => wizardStore.addDirectionalMeasurement()

const addMeasurementQuick = (interval: number) => {
  wizardStore.addDirectionalMeasurement({
    measurement_interval: interval,
  })
}

const removeMeasurement = (index: number) => wizardStore.removeDirectionalMeasurement(index)

const updateMeasurement = (index: number, field: string, value: any) => {
  wizardStore.updateDirectionalMeasurement(index, { [field]: value })
}
</script>

<template>
  <div class="pa-6">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 mb-2">
          Mediciones Direccionales
        </h3>
        <p class="text-body-2 text-medium-emphasis">
          Registra las mediciones direccionales tomadas durante la perforación (opcional)
        </p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        @click="addMeasurement"
      >
        Agregar
      </VBtn>
    </div>

    <!-- Quick Add Common Intervals -->
    <div class="mb-4">
      <p class="text-caption text-medium-emphasis mb-2">
        Intervalos Comunes:
      </p>
      <div class="d-flex flex-wrap gap-2">
        <VBtn
          v-for="interval in measurementIntervalOptions"
          :key="interval.value"
          size="small"
          variant="outlined"
          @click="addMeasurementQuick(interval.value)"
        >
          <VIcon
            icon="tabler-ruler"
            start
            size="16"
          />
          {{ interval.title }}
        </VBtn>
      </div>
    </div>

    <!-- Measurements List -->
    <VRow>
      <VCol
        v-for="(measurement, index) in formData.directional_measurements"
        :key="index"
        cols="12"
        md="6"
      >
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between bg-primary-lighten-5">
            <span class="text-body-1">Medición {{ index + 1 }}</span>
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click="removeMeasurement(index)"
            />
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="12">
                <VTextField
                  :model-value="measurement.depth"
                  label="Profundidad (m) *"
                  type="number"
                  step="0.1"
                  min="0"
                  :rules="[
                    rules.required,
                    (v) => v === null || v === '' || Number(v) >= 0 || 'Debe ser mayor o igual a 0',
                  ]"
                  prepend-inner-icon="tabler-arrow-down"
                  @update:model-value="(v) => updateMeasurement(index, 'depth', v ? Number(v) : null)"
                />
              </VCol>

              <VCol cols="6">
                <VTextField
                  :model-value="measurement.azimuth"
                  label="Azimuth (°) *"
                  type="number"
                  step="0.1"
                  min="0"
                  max="360"
                  :rules="[
                    rules.required,
                    (v) => {
                      if (v === null || v === '') return 'Campo requerido'
                      const num = Number(v)
                      return (num >= 0 && num <= 360) || 'Debe estar entre 0 y 360 grados'
                    },
                  ]"
                  prepend-inner-icon="tabler-compass"
                  @update:model-value="(v) => updateMeasurement(index, 'azimuth', v ? Number(v) : null)"
                />
              </VCol>

              <VCol cols="6">
                <VTextField
                  :model-value="measurement.inclination"
                  label="Inclinación (°) *"
                  type="number"
                  step="0.1"
                  min="-90"
                  max="90"
                  :rules="[
                    rules.required,
                    (v) => {
                      if (v === null || v === '') return 'Campo requerido'
                      const num = Number(v)
                      return (num >= -90 && num <= 90) || 'Debe estar entre -90 y 90 grados'
                    },
                  ]"
                  prepend-inner-icon="tabler-arrow-down-circle"
                  @update:model-value="(v) => updateMeasurement(index, 'inclination', v ? Number(v) : null)"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  :model-value="measurement.measurement_interval"
                  label="Intervalo de Medición (m) *"
                  type="number"
                  step="0.1"
                  min="0.1"
                  :rules="[
                    rules.required,
                    (v) => v === null || v === '' || Number(v) > 0.1 || 'Debe ser mayor a 0.1 metros',
                  ]"
                  prepend-inner-icon="tabler-ruler"
                  @update:model-value="(v) => updateMeasurement(index, 'measurement_interval', v ? Number(v) : null)"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  :model-value="measurement.notes"
                  label="Notas"
                  rows="3"
                  counter="1000"
                  :rules="[rules.maxLength(1000)]"
                  prepend-inner-icon="tabler-notes"
                  placeholder="Observaciones sobre la medición..."
                  @update:model-value="(v) => updateMeasurement(index, 'notes', v || '')"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Empty State -->
      <VCol
        v-if="formData.directional_measurements.length === 0"
        cols="12"
      >
        <VCard
          variant="outlined"
          class="text-center pa-8"
        >
          <VIcon
            icon="tabler-ruler-off"
            size="64"
            class="text-medium-emphasis mb-4"
          />
          <p class="text-body-2 text-medium-emphasis mb-4">
            No hay mediciones direccionales registradas. Este paso es opcional y puede omitirse.
          </p>
          <VBtn
            color="primary"
            prepend-icon="tabler-plus"
            @click="addMeasurement"
          >
            Agregar Medición
          </VBtn>
        </VCard>
      </VCol>
    </VRow>

    <!-- Validation Error -->
    <VCol
      v-if="formData.directional_measurements.length > 0 && !isDirectionalMeasurementsStepValid"
      cols="12"
    >
      <VAlert
        color="error"
        variant="tonal"
        border="start"
        class="mt-4"
      >
        <template #title>
          <VIcon
            icon="tabler-alert-circle"
            class="me-2"
          />
          Validación Requerida
        </template>
        <p class="mb-2">
          Por favor complete todos los campos requeridos:
        </p>
        <ul class="text-body-2">
          <li>• Todas las mediciones deben tener profundidad (>= 0)</li>
          <li>• Todas las mediciones deben tener azimuth (0-360 grados)</li>
          <li>• Todas las mediciones deben tener inclinación (-90 a 90 grados)</li>
          <li>• Todas las mediciones deben tener intervalo de medición (> 0.1 metros)</li>
        </ul>
      </VAlert>
    </VCol>
  </div>
</template>
