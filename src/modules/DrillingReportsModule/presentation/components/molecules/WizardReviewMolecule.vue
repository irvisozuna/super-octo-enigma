<script setup lang="ts">
import { computed } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import { REPORT_VALIDATION_RULES } from '../../../shared/constants'

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES

// Computed
const formData = computed(() => wizardStore.formData)
const totalHoursWorked = computed(() => wizardStore.totalHoursWorked)
const isFormValid = computed(() => wizardStore.isFormValid)

// Handler
const updateObservations = (value: string) => {
  wizardStore.updateFormData({ observations: value })
}
</script>

<template>
  <div class="pa-6">
    <div class="mb-4">
      <h3 class="text-h6 mb-2">
        Revisión y Observaciones
      </h3>
      <p class="text-body-2 text-medium-emphasis">
        Revisa el resumen del reporte y agrega observaciones finales
      </p>
    </div>

    <!-- Summary Cards -->
    <VRow class="mb-6">
      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard
          variant="tonal"
          color="success"
        >
          <VCardText class="text-center">
            <VIcon
              icon="tabler-list-check"
              size="32"
              class="mb-2"
            />
            <div class="text-h5 font-weight-bold">
              {{ formData.activities.length }}
            </div>
            <div class="text-caption">
              Actividades
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard
          variant="tonal"
          color="info"
        >
          <VCardText class="text-center">
            <VIcon
              icon="tabler-droplet"
              size="32"
              class="mb-2"
            />
            <div class="text-h5 font-weight-bold">
              {{ formData.consumptions.length }}
            </div>
            <div class="text-caption">
              Consumos
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard
          variant="tonal"
          color="warning"
        >
          <VCardText class="text-center">
            <VIcon
              icon="tabler-tool"
              size="32"
              class="mb-2"
            />
            <div class="text-h5 font-weight-bold">
              {{ formData.tool_assignments.length }}
            </div>
            <div class="text-caption">
              Herramientas
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="6"
        md="3"
      >
        <VCard
          variant="tonal"
          color="primary"
        >
          <VCardText class="text-center">
            <VIcon
              icon="tabler-clock"
              size="32"
              class="mb-2"
            />
            <div class="text-h5 font-weight-bold">
              {{ totalHoursWorked.toFixed(1) }}
            </div>
            <div class="text-caption">
              Horas Totales
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Observations -->
    <VTextarea
      :model-value="formData.observations"
      label="Observaciones Generales"
      rows="6"
      counter="1000"
      :rules="[rules.maxLength(1000)]"
      prepend-inner-icon="tabler-notes"
      placeholder="Agrega cualquier observación relevante sobre el turno..."
      @update:model-value="updateObservations"
    />

    <!-- Final Validation Alert -->
    <VAlert
      v-if="!isFormValid"
      type="warning"
      variant="tonal"
      class="mt-4"
    >
      <div class="d-flex align-center gap-2">
        <VIcon icon="tabler-alert-triangle" />
        <span>Revisa que todos los campos requeridos estén completos antes de guardar.</span>
      </div>
    </VAlert>

    <VAlert
      v-else
      type="success"
      variant="tonal"
      class="mt-4"
    >
      <div class="d-flex align-center gap-2">
        <VIcon icon="tabler-circle-check" />
        <span>El reporte está completo y listo para guardar.</span>
      </div>
    </VAlert>
  </div>
</template>
