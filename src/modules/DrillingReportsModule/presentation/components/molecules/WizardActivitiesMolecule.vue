<script setup lang="ts">
import { computed, ref } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import {
  ACTIVITY_TEMPLATES,
  ACTIVITY_TYPES,
  REPORT_VALIDATION_RULES,
} from '../../../shared/constants'

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES

// State for collapsed/expanded activities
const expandedActivities = ref<Set<number>>(new Set())

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
const addActivity = () => {
  wizardStore.addActivity()

  // Auto-expand the new activity
  const newIndex = formData.value.activities.length - 1

  expandedActivities.value.add(newIndex)

  // Set suggested times for the new activity
  setSuggestedTimes(newIndex)
}

const addActivityFromTemplate = (template: any) => {
  wizardStore.addActivity({
    activity_type: template.type,
    hours: template.hours,
  })

  // Auto-expand the new activity
  const newIndex = formData.value.activities.length - 1

  expandedActivities.value.add(newIndex)

  // Set suggested times for the new activity
  setSuggestedTimes(newIndex)
}

const removeActivity = (index: number) => {
  wizardStore.removeActivity(index)

  // Remove from expanded set and adjust indices
  expandedActivities.value.delete(index)

  const newExpanded = new Set<number>()

  expandedActivities.value.forEach(i => {
    if (i > index)
      newExpanded.add(i - 1)
    else if (i < index)
      newExpanded.add(i)
  })
  expandedActivities.value = newExpanded
}

const updateActivity = (index: number, field: string, value: any) => {
  // Update the field
  wizardStore.updateActivity(index, { [field]: value })

  // Auto-calculate hours when start_time or end_time changes
  if (field === 'start_time' || field === 'end_time') {
    const activity = formData.value.activities[index]
    if (activity?.start_time && activity?.end_time) {
      // Validate that end time is not before start time
      const start = new Date(`2000-01-01T${activity.start_time}`)
      const end = new Date(`2000-01-01T${activity.end_time}`)

      if (end < start) {
        // If end time is before start time, don't calculate hours
        wizardStore.updateActivity(index, { hours: 0 })

        return
      }

      const calculatedHours = calculateHoursFromTimes(activity.start_time, activity.end_time)

      wizardStore.updateActivity(index, { hours: calculatedHours })
    }
  }

  // Recalculate subsequent activities when time-related fields change
  if (['start_time', 'end_time'].includes(field)) {
    // Use setTimeout to avoid infinite loops
    setTimeout(() => {
      recalculateSubsequentActivities(index)
    }, 100)
  }
}

const toggleActivityExpansion = (index: number) => {
  if (expandedActivities.value.has(index))
    expandedActivities.value.delete(index)
  else
    expandedActivities.value.add(index)
}

const isActivityExpanded = (index: number) => expandedActivities.value.has(index)

// Get activity display name for collapsed view
const getActivityDisplayName = (activity: any) => {
  if (!activity.activity_type)
    return 'Actividad sin seleccionar'
  const selectedActivity = activityTypeOptions.find(a => a.value === activity.activity_type)

  return selectedActivity?.title || 'Actividad desconocida'
}

// Format hours for display (e.g., 1.1 -> "1.1 hrs (1h 6min)")
const formatHoursDisplay = (hours: number) => {
  if (!hours)
    return '0 hrs'

  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)

  if (minutes === 0)
    return `${hours} hrs`
  else
    return `${hours} hrs (${wholeHours}h ${minutes}min)`
}

// Get suggested start time for an activity
const getSuggestedStartTime = (index: number) => {
  if (index === 0) {
    // First activity starts at 8:00 AM (default work start)
    return '08:00'
  }

  // For subsequent activities, use the end time of the previous activity
  const previousActivity = formData.value.activities[index - 1]
  if (previousActivity?.end_time)
    return previousActivity.end_time

  // Fallback: calculate from previous activity's start time + hours
  if (previousActivity?.start_time && previousActivity?.hours) {
    const startTime = new Date(`2000-01-01T${previousActivity.start_time}`)
    const endTime = new Date(startTime.getTime() + (previousActivity.hours * 60 * 60 * 1000))

    return endTime.toTimeString().slice(0, 5)
  }

  return '08:00'
}

// Get suggested end time for an activity
const getSuggestedEndTime = (index: number) => {
  const startTime = getSuggestedStartTime(index)
  const activity = formData.value.activities[index]
  const hours = activity?.hours || 1 // Default 1 hour if no hours set

  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(start.getTime() + (hours * 60 * 60 * 1000))

  return end.toTimeString().slice(0, 5)
}

// Calculate hours based on start and end time
const calculateHoursFromTimes = (startTime: string, endTime: string) => {
  if (!startTime || !endTime)
    return 0

  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)

  // Validate that end time is not before start time
  if (end < start)
    return 0 // Return 0 if end time is before start time

  const diffMs = end.getTime() - start.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  return Math.max(0, diffHours) // Ensure non-negative
}

// Update activity with suggested times
const setSuggestedTimes = (index: number) => {
  const suggestedStart = getSuggestedStartTime(index)
  const suggestedEnd = getSuggestedEndTime(index)

  updateActivity(index, 'start_time', suggestedStart)
  updateActivity(index, 'end_time', suggestedEnd)

  // Calculate hours automatically
  const calculatedHours = calculateHoursFromTimes(suggestedStart, suggestedEnd)

  wizardStore.updateActivity(index, { hours: calculatedHours })
}

// Recalculate all subsequent activities when one changes
const recalculateSubsequentActivities = (changedIndex: number) => {
  const activities = formData.value.activities

  for (let i = changedIndex + 1; i < activities.length; i++) {
    const previousActivity = activities[i - 1]
    if (previousActivity?.end_time) {
      // Update start time to match previous activity's end time
      updateActivity(i, 'start_time', previousActivity.end_time)

      // Note: End time will be set manually by user, hours will be calculated automatically
    }
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
        <VCard
          variant="outlined"
          class="activity-card"
        >
          <!-- Collapsible Header -->
          <VCardTitle
            class="d-flex align-center justify-space-between bg-success-lighten-5 cursor-pointer"
            @click="toggleActivityExpansion(index)"
          >
            <div class="d-flex align-center">
              <VIcon
                :icon="isActivityExpanded(index) ? 'tabler-chevron-down' : 'tabler-chevron-right'"
                class="me-2"
                size="20"
              />
              <div>
                <span class="text-body-1 font-weight-medium">
                  <VIcon
                    icon="tabler-list-check"
                    size="14"
                    class="me-1"
                  />
                  {{ getActivityDisplayName(activity) }}
                </span>
                <!-- Collapsed Summary -->
                <div
                  v-if="!isActivityExpanded(index)"
                  class="text-caption text-medium-emphasis mt-1"
                >
                  <div class="d-flex align-center gap-4">
                    <span v-if="activity.hours !== undefined">
                      <VIcon
                        icon="tabler-hourglass"
                        size="14"
                        class="me-1"
                      />
                      {{ formatHoursDisplay(activity.hours) }}
                    </span>
                    <span v-if="activity.start_time && activity.end_time">
                      <VIcon
                        icon="tabler-clock-play"
                        size="14"
                        class="me-1"
                      />
                      {{ activity.start_time }} - {{ activity.end_time }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <VBtn
              icon="tabler-trash"
              size="small"
              variant="text"
              color="error"
              @click.stop="removeActivity(index)"
            />
          </VCardTitle>

          <!-- Expandable Content -->
          <VExpandTransition>
            <VCardText v-show="isActivityExpanded(index)">
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
                    :model-value="activity.start_time"
                    label="Hora Inicio"
                    type="time"
                    prepend-inner-icon="tabler-clock-play"
                    :hint="`Sugerido: ${getSuggestedStartTime(index)}`"
                    persistent-hint
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
                    :min="activity.start_time || '00:00'"
                    prepend-inner-icon="tabler-clock-stop"
                    :hint="`Sugerido: ${getSuggestedEndTime(index)}`"
                    persistent-hint
                    :rules="[
                      (v) => {
                        if (!v || !activity.start_time) return true
                        const start = new Date(`2000-01-01T${activity.start_time}`)
                        const end = new Date(`2000-01-01T${v}`)
                        return end > start || 'La hora fin debe ser mayor a la hora inicio'
                      },
                    ]"
                    @update:model-value="(v) => updateActivity(index, 'end_time', v)"
                  />
                </VCol>

                <VCol
                  cols="12"
                  md="2"
                >
                  <VBtn
                    size="small"
                    variant="outlined"
                    color="primary"
                    prepend-icon="tabler-clock"
                    @click="setSuggestedTimes(index)"
                  >
                    Auto-horario
                  </VBtn>
                </VCol>
                <VCol
                  cols="12"
                  md="2"
                >
                  <VTextField
                    :model-value="activity.hours"
                    label="Horas (Calculadas)"
                    type="number"
                    step="0.01"
                    readonly
                    prepend-inner-icon="tabler-hourglass"
                    suffix="hrs"
                    :hint="activity.hours ? formatHoursDisplay(activity.hours) : 'Se calcula automáticamente'"
                    persistent-hint
                    class="readonly-field"
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
          </VExpandTransition>
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

<style scoped lang="scss">
.activity-card {
  transition: all 0.2s ease-in-out;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 10%);
  }
}

.cursor-pointer {
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--v-theme-success), 0.1) !important;
  }
}

// Smooth transitions for the expand/collapse
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease;
}

.v-expand-transition-enter-from,
.v-expand-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// Styles for readonly fields
.readonly-field {
  .v-field__input {
    background-color: rgba(var(--v-theme-surface-variant), 0.3) !important;
    color: rgba(var(--v-theme-on-surface), 0.6) !important;
  }

  .v-field__outline {
    border-color: rgba(var(--v-theme-outline), 0.3) !important;
  }

  &:hover .v-field__outline {
    border-color: rgba(var(--v-theme-outline), 0.5) !important;
  }
}
</style>
