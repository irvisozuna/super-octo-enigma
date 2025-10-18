<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatDate } from '@/modules/DrillingReportsModule/shared/utils/dateUtils'

// Props
interface Props {
  modelValue: boolean
  report: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  rejected: []
}>()

// State
const formRef = ref()
const formValid = ref(false)
const rejecting = ref(false)

const formData = ref({
  reason: '',
})

const errors = ref({})

// Computed
const dialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const reasonHint = computed(() => {
  const length = formData.value.reason.length
  if (length < 10)
    return `Mínimo 10 caracteres (${length}/10)`

  return `${length}/500 caracteres`
})

// Validation rules
const rules = {
  required: (value: any) => !!value || 'El motivo es requerido',
  minLength: (value: any) => {
    if (!value)
      return true

    return value.length >= 10 || 'El motivo debe tener al menos 10 caracteres'
  },
  maxLength: (value: any) => {
    if (!value)
      return true

    return value.length <= 500 || 'El motivo no puede exceder 500 caracteres'
  },
}

// Methods
const closeModal = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  formData.value = {
    reason: '',
  }
  errors.value = {}
}

const getOperatorName = () => {
  return props.report?.personnel?.operator_day?.name
         || props.report?.personnel?.operator_night?.name
         || 'No asignado'
}

const rejectReport = async () => {
  if (!formValid.value)
    return

  rejecting.value = true
  try {
    // TODO: Implement reject report
    console.log('Rejecting report:', {
      reportId: props.report.id,
      reason: formData.value.reason,
    })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Show success message
    // TODO: Show success notification

    emit('rejected')
    closeModal()
  }
  catch (error) {
    console.error('Error rejecting report:', error)

    // TODO: Show error notification
  }
  finally {
    rejecting.value = false
  }
}

// Watchers
watch(() => props.modelValue, newValue => {
  if (newValue)
    resetForm()
})
</script>

<template>
  <VDialog
    v-model="dialog"
    max-width="500px"
    persistent
  >
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-close-circle"
          class="me-2"
        />
        Rechazar Reporte
      </VCardTitle>

      <VCardText>
        <VAlert
          type="warning"
          class="mb-4"
        >
          <VIcon
            icon="mdi-alert"
            class="me-2"
          />
          Al rechazar el reporte, este volverá a estado "Borrador" para que el operador pueda hacer las correcciones necesarias.
        </VAlert>

        <VForm
          ref="formRef"
          v-model="formValid"
          @submit.prevent="rejectReport"
        >
          <VRow>
            <VCol cols="12">
              <VTextarea
                v-model="formData.reason"
                label="Motivo del Rechazo *"
                rows="4"
                :rules="[rules.required, rules.minLength, rules.maxLength]"
                :error-messages="errors.reason"
                :counter="500"
                :hint="reasonHint"
                persistent-hint
              />
            </VCol>
          </VRow>

          <!-- Report Info -->
          <VCard
            variant="outlined"
            class="mt-4"
          >
            <VCardTitle class="text-h6">
              Información del Reporte
            </VCardTitle>
            <VCardText>
              <div class="report-info-item">
                <label class="report-info-label">Número:</label>
                <span class="report-info-value">{{ report.report_number }}</span>
              </div>
              <div class="report-info-item">
                <label class="report-info-label">Fecha:</label>
                <span class="report-info-value">{{ formatDate(report.report_date) }}</span>
              </div>
              <div class="report-info-item">
                <label class="report-info-label">Pozo:</label>
                <span class="report-info-value">{{ report.well?.name }}</span>
              </div>
              <div class="report-info-item">
                <label class="report-info-label">Operador:</label>
                <span class="report-info-value">{{ getOperatorName() }}</span>
              </div>
            </VCardText>
          </VCard>
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
          color="error"
          :loading="rejecting"
          :disabled="!formValid"
          @click="rejectReport"
        >
          <VIcon
            icon="mdi-close-circle"
            class="me-2"
          />
          Rechazar Reporte
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.v-dialog {
  max-inline-size: 500px;
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

.report-info-item {
  display: flex;
  align-items: center;
  margin-block-end: 8px;
}

.report-info-label {
  font-weight: 500;
  margin-inline-end: 8px;
  min-inline-size: 80px;
}

.report-info-value {
  color: #666;
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
