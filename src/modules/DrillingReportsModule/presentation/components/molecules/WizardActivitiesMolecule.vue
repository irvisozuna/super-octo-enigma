<script setup lang="ts">
import { computed } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import {
  ACTIVITY_TEMPLATES,
  ACTIVITY_TYPES,
  REPORT_VALIDATION_RULES,
} from '../../../shared/constants'

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES

// Computed
const formData = computed(() => wizardStore.formData)
const availableShiftOptions = computed(() => {
  return wizardStore.availableShiftOptions
})
const totalHoursWorked = computed(() => wizardStore.totalHoursWorked)
const calculatedHorometerEnd = computed(() => wizardStore.calculatedHorometerEnd)
const isActivitiesStepValid = computed(() => wizardStore.isActivitiesStepValid)

// Activity options
const activityTypeOptions = ACTIVITY_TYPES
const activityTemplates = ACTIVITY_TEMPLATES

// Handlers
const addActivity = () => wizardStore.addActivity()

const addActivityFromTemplate = (template: any) => {
  wizardStore.addActivity({
    activity_type: template.type,
    hours: template.hours,
  })
}

const removeActivity = (index: number) => wizardStore.removeActivity(index)

const updateActivity = (index: number, field: string, value: any) => {
  // Use the time calculation function for time-related fields
  if (['hours', 'start_time', 'end_time'].includes(field)) {
    wizardStore.updateActivityWithTimeCalculation(index, field, value)
  } else {
    wizardStore.updateActivity(index, { [field]: value })
  }
}

const calculateHorometer = () => {
  // Auto-calculated in store's computed property
}
</script>

<template>
  <div class="pa-6">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h3 class="text-h6 mb-2">
          Actividades del Turno
        </h3>
        <p class="text-body-2 text-medium-emphasis">
          Registra las actividades realizadas. La profundidad se calcula automáticamente.
        </p>
      </div>
      <VBtn
        color="success"
        prepend-icon="tabler-plus"
        @click="addActivity"
      >
        Agregar
      </VBtn>
    </div>

    <!-- Quick Add Templates -->
    <div class="mb-4">
      <p class="text-caption text-medium-emphasis mb-2">
        Actividades Comunes:
      </p>
      <div class="d-flex flex-wrap gap-2">
        <VBtn
          v-for="template in activityTemplates"
          :key="template.type"
          size="small"
          variant="outlined"
          @click="addActivityFromTemplate(template)"
        >
          <VIcon
            :icon="template.icon"
            start
            size="16"
          />
          {{ template.label }}
        </VBtn>
      </div>
    </div>

    <!-- Activities List -->
    <VRow>
      <VCol
        v-for="(activity, index) in formData.activities"
        :key="index"
        cols="12"
      >
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between bg-success-lighten-5">
            <span class="text-body-1">Actividad {{ index + 1 }}</span>
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click="removeActivity(index)"
            />
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="4"
              >
                <VSelect
                  :model-value="activity.activity_type"
                  label="Tipo de Actividad *"
                  :items="activityTypeOptions"
                  :rules="[rules.required]"
                  prepend-inner-icon="tabler-list"
                  @update:model-value="(v) => updateActivity(index, 'activity_type', v)"
                />
              </VCol>

              <VCol
                cols="12"
                md="2"
              >
                <VSelect
                  :model-value="activity.shift"
                  label="Turno *"
                  :items="availableShiftOptions"
                  :rules="[rules.required]"
                  prepend-inner-icon="tabler-clock"
                  @update:model-value="(v) => updateActivity(index, 'shift', v)"
                />
              </VCol>

              <VCol
                cols="12"
                md="2"
              >
                <VTextField
                  :model-value="activity.hours"
                  label="Horas *"
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="24"
                  :rules="[rules.required, rules.positiveNumber]"
                  prepend-inner-icon="tabler-hourglass"
                  suffix="hrs"
                  @update:model-value="(v) => updateActivity(index, 'hours', Number(v))"
                  @blur="calculateHorometer"
                />
              </VCol>

              <VCol
                cols="12"
                md="2"
              >
                <VTextField
                  :model-value="activity.start_time"
                  label="Hora Inicio"
                  type="time"
                  prepend-inner-icon="tabler-clock-play"
                  @update:model-value="(v) => updateActivity(index, 'start_time', v)"
                />
              </VCol>

              <VCol
                cols="12"
                md="2"
              >
                <VTextField
                  :model-value="activity.end_time"
                  label="Hora Fin"
                  type="time"
                  prepend-inner-icon="tabler-clock-stop"
                  @update:model-value="(v) => updateActivity(index, 'end_time', v)"
                />
              </VCol>

              <VCol cols="12">
                <VTextarea
                  :model-value="activity.description"
                  label="Descripción"
                  rows="2"
                  counter="500"
                  :rules="[rules.maxLength(500)]"
                  prepend-inner-icon="tabler-notes"
                  @update:model-value="(v) => updateActivity(index, 'description', v)"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Empty State -->
      <VCol
        v-if="formData.activities.length === 0"
        cols="12"
      >
        <VCard
          variant="outlined"
          class="text-center pa-8"
        >
          <VIcon
            icon="tabler-list-check"
            size="64"
            class="text-medium-emphasis mb-4"
          />
          <p class="text-body-2 text-medium-emphasis mb-4">
            No hay actividades registradas. Debe agregar al menos una actividad para continuar.
          </p>
          <VBtn
            color="success"
            prepend-icon="tabler-plus"
            @click="addActivity"
          >
            Agregar Primera Actividad
          </VBtn>
        </VCard>
      </VCol>

      <!-- Validation Error -->
      <VCol
        v-if="formData.activities.length > 0 && !isActivitiesStepValid"
        cols="12"
      >
        <VAlert
          color="error"
          variant="tonal"
          border="start"
          class="mb-4"
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
            <li>• Todas las actividades deben tener un tipo seleccionado</li>
            <li>• Todas las actividades deben tener un turno asignado</li>
            <li>• Todas las actividades deben tener horas trabajadas (mayor a 0)</li>
          </ul>
        </VAlert>
      </VCol>
    </VRow>

    <!-- Horometer Calculation Preview -->
    <VAlert
      v-if="totalHoursWorked > 0"
      type="success"
      variant="tonal"
      class="mt-4"
    >
      <div class="d-flex align-center justify-space-between">
        <span>
          <VIcon
            icon="tabler-calculator"
            class="mr-2"
          />
          Total de horas trabajadas: <strong>{{ totalHoursWorked.toFixed(1) }} hrs</strong>
        </span>
        <span v-if="calculatedHorometerEnd">
          Horómetro estimado al finalizar: <strong>{{ calculatedHorometerEnd.toFixed(1) }} hrs</strong>
        </span>
      </div>
    </VAlert>
  </div>
</template>
