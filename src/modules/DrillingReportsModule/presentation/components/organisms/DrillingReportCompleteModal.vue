<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Props
interface Props {
  modelValue: boolean
  report: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  completed: []
}>()

// State
const formRef = ref()
const formValid = ref(false)
const completing = ref(false)

const formData = ref({
  horometer_end_day: null,
  horometer_end_night: null,
})

const errors = ref({})

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const canComplete = computed(() => {
  return props.report?.activities?.length > 0
         && (props.report?.personnel?.operator_day || props.report?.personnel?.operator_night)
})

const totalHours = computed(() => {
  let hours = 0
  if (formData.value.horometer_end_day && props.report?.horometer?.day?.start)
    hours += Math.max(0, formData.value.horometer_end_day - props.report.horometer.day.start)

  if (formData.value.horometer_end_night && props.report?.horometer?.night?.start)
    hours += Math.max(0, formData.value.horometer_end_night - props.report.horometer.night.start)

  return hours.toFixed(1)
})

const dayHorometerHint = computed(() => {
  if (props.report?.horometer?.day?.start)
    return `Inicial: ${props.report.horometer.day.start}`

  return ''
})

const nightHorometerHint = computed(() => {
  if (props.report?.horometer?.night?.start)
    return `Inicial: ${props.report.horometer.night.start}`

  return ''
})

// Validation rules
const rules = {
  horometer: (value: any) => {
    if (!value)
      return true
    const num = Number.parseFloat(value)
    if (isNaN(num))
      return 'Valor inválido'
    if (num < 0)
      return 'El horómetro no puede ser negativo'

    return true
  },
}

// Methods
const closeModal = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    horometer_end_day: null,
    horometer_end_night: null,
  }
  errors.value = {}
}

const completeReport = async () => {
  if (!canComplete.value)
    return

  completing.value = true
  try {
    // TODO: Implement complete report
    console.log('Completing report:', {
      reportId: props.report.id,
      horometerData: formData.value,
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Show success message
    // TODO: Show success notification

    emit('completed')
    closeModal()
  }
  catch (error) {
    console.error('Error completing report:', error)

    // TODO: Show error notification
  }
  finally {
    completing.value = false
  }
}

// Watchers
watch(() => props.modelValue, newValue => {
  if (newValue) {
    // Initialize form with existing data
    if (props.report?.horometer) {
      formData.value = {
        horometer_end_day: props.report.horometer.day?.end || null,
        horometer_end_night: props.report.horometer.night?.end || null,
      }
    }
  }
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="600px"
    persistent
  >
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-check-circle"
          class="me-2"
        />
        Completar Reporte
      </VCardTitle>

      <VCardText>
        <VAlert
          type="info"
          class="mb-4"
        >
          <VIcon
            icon="mdi-information"
            class="me-2"
          />
          Al completar el reporte, este pasará a estado "Completado" y estará listo para aprobación.
        </VAlert>

        <VForm
          ref="formRef"
          v-model="formValid"
          @submit.prevent="completeReport"
        >
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.horometer_end_day"
                type="number"
                step="0.1"
                label="Horómetro Final Día"
                :error-messages="errors.horometer_end_day"
                :rules="[rules.horometer]"
                :hint="dayHorometerHint"
                persistent-hint
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="formData.horometer_end_night"
                type="number"
                step="0.1"
                label="Horómetro Final Noche"
                :error-messages="errors.horometer_end_night"
                :rules="[rules.horometer]"
                :hint="nightHorometerHint"
                persistent-hint
                :disabled="report.shift === 'day'"
              />
            </VCol>
          </VRow>

          <!-- Summary Card -->
          <VCard
            variant="outlined"
            class="mt-4"
          >
            <VCardTitle class="text-h6">
              Resumen del Reporte
            </VCardTitle>
            <VCardText>
              <VRow>
                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="summary-item">
                    <VIcon
                      icon="mdi-clock"
                      class="me-2"
                    />
                    <span class="summary-label">Total Horas:</span>
                    <span class="summary-value">{{ totalHours }}h</span>
                  </div>
                  <div class="summary-item">
                    <VIcon
                      icon="mdi-ruler"
                      class="me-2"
                    />
                    <span class="summary-label">Metros Perforados:</span>
                    <span class="summary-value">{{ report.totals?.meters_drilled || 0 }}m</span>
                  </div>
                </VCol>
                <VCol
                  cols="12"
                  md="6"
                >
                  <div class="summary-item">
                    <VIcon
                      icon="mdi-cog"
                      class="me-2"
                    />
                    <span class="summary-label">Actividades:</span>
                    <span class="summary-value">{{ report.activities?.length || 0 }}</span>
                  </div>
                  <div class="summary-item">
                    <VIcon
                      icon="mdi-package-variant"
                      class="me-2"
                    />
                    <span class="summary-label">Consumos:</span>
                    <span class="summary-value">{{ report.consumptions?.length || 0 }}</span>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Validation Warnings -->
          <VAlert
            v-if="!canComplete"
            type="warning"
            class="mt-4"
          >
            <VIcon
              icon="mdi-alert"
              class="me-2"
            />
            El reporte no puede completarse. Verifica que tenga al menos una actividad y un operador asignado.
          </VAlert>
        </VForm>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="grey"
          variant="outlined"
          @click="closeModal"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="success"
          :loading="completing"
          :disabled="!canComplete"
          @click="completeReport"
        >
          <VIcon
            icon="mdi-check"
            class="me-2"
          />
          Completar Reporte
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-dialog {
  max-inline-size: 600px;
}

.v-card-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.v-card-actions {
  border-block-start: 1px solid #e0e0e0;
  padding-block: 16px;
  padding-inline: 24px;
}

.v-form {
  padding: 0;
}

.v-row {
  margin: 0;
}

.v-col {
  padding-block: 8px;
  padding-inline: 12px;
}

.summary-item {
  display: flex;
  align-items: center;
  margin-block-end: 8px;
}

.summary-label {
  margin-inline-end: 8px;
  min-inline-size: 120px;
}

.summary-value {
  color: #1976d2;
  font-weight: 500;
}

@media (max-width: 768px) {
  .v-dialog {
    margin: 16px;
    max-inline-size: 100%;
  }

  .v-card-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
