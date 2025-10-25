<script setup lang="ts">
import { computed } from 'vue'
import { useReportWizardStore } from '../../stores/reportWizardStore'
import { REPORT_VALIDATION_RULES } from '../../../shared/constants'

interface Props {
  employeeOptions: any[]
  loadingEmployees: boolean
}

const props = defineProps<Props>()

const wizardStore = useReportWizardStore()
const rules = REPORT_VALIDATION_RULES

// Computed properties
const formData = computed(() => wizardStore.formData)
const showDayShift = computed(() => wizardStore.showDayShift)
const showNightShift = computed(() => wizardStore.showNightShift)

// Filtered employee options for each field
const dayOperatorOptions = computed(() => props.employeeOptions)

const dayHelper1Options = computed(() => {
  const selectedOperator = formData.value.operator_day_id
  const selectedHelper2 = formData.value.helper2_day_id
  
  return props.employeeOptions.filter(employee => 
    employee.value !== selectedOperator && 
    employee.value !== selectedHelper2
  )
})

const dayHelper2Options = computed(() => {
  const selectedOperator = formData.value.operator_day_id
  const selectedHelper1 = formData.value.helper1_day_id
  
  return props.employeeOptions.filter(employee => 
    employee.value !== selectedOperator && 
    employee.value !== selectedHelper1
  )
})

const nightOperatorOptions = computed(() => props.employeeOptions)

const nightHelper1Options = computed(() => {
  const selectedOperator = formData.value.operator_night_id
  const selectedHelper2 = formData.value.helper2_night_id
  
  return props.employeeOptions.filter(employee => 
    employee.value !== selectedOperator && 
    employee.value !== selectedHelper2
  )
})

const nightHelper2Options = computed(() => {
  const selectedOperator = formData.value.operator_night_id
  const selectedHelper1 = formData.value.helper1_night_id
  
  return props.employeeOptions.filter(employee => 
    employee.value !== selectedOperator && 
    employee.value !== selectedHelper1
  )
})

// Validation for step completion
const isPersonnelStepValid = computed(() => {
  if (!showDayShift.value && !showNightShift.value) return false
  
  let isValid = true
  
  // Day shift validation
  if (showDayShift.value) {
    if (!formData.value.operator_day_id) isValid = false
    if (!formData.value.horometer_start_day) isValid = false
    if (!formData.value.horometer_end_day) isValid = false
    
    // Validate horometer logic
    if (formData.value.horometer_start_day && formData.value.horometer_end_day) {
      if (formData.value.horometer_start_day >= formData.value.horometer_end_day) {
        isValid = false
      }
    }
  }
  
  // Night shift validation
  if (showNightShift.value) {
    if (!formData.value.operator_night_id) isValid = false
    if (!formData.value.horometer_start_night) isValid = false
    if (!formData.value.horometer_end_night) isValid = false
    
    // Validate horometer logic
    if (formData.value.horometer_start_night && formData.value.horometer_end_night) {
      if (formData.value.horometer_start_night >= formData.value.horometer_end_night) {
        isValid = false
      }
    }
  }
  
  return isValid
})

// Handlers
const updateField = (field: string, value: any) => {
  wizardStore.updateFormData({ [field]: value })
  
  // Clear helpers when operator changes
  if (field === 'operator_day_id') {
    if (formData.value.helper1_day_id === value) {
      wizardStore.updateFormData({ helper1_day_id: null })
    }
    if (formData.value.helper2_day_id === value) {
      wizardStore.updateFormData({ helper2_day_id: null })
    }
  }
  
  if (field === 'operator_night_id') {
    if (formData.value.helper1_night_id === value) {
      wizardStore.updateFormData({ helper1_night_id: null })
    }
    if (formData.value.helper2_night_id === value) {
      wizardStore.updateFormData({ helper2_night_id: null })
    }
  }
  
  // Clear helper2 when helper1 changes
  if (field === 'helper1_day_id' && formData.value.helper2_day_id === value) {
    wizardStore.updateFormData({ helper2_day_id: null })
  }
  
  if (field === 'helper1_night_id' && formData.value.helper2_night_id === value) {
    wizardStore.updateFormData({ helper2_night_id: null })
  }
}

const calculateHorometer = () => {
  // Auto-calculated in store's computed property
}

// Expose validation state to parent
defineExpose({
  isPersonnelStepValid
})
</script>

<template>
  <div class="pa-6">
    <div class="mb-4">
      <h3 class="text-h6 mb-2">
        Personal Asignado
      </h3>
      <p class="text-body-2 text-medium-emphasis">
        Asigna el personal que trabajó en este reporte
      </p>
    </div>

    <!-- Alert if no shift is selected -->
    <VAlert
      v-if="!showDayShift && !showNightShift"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      <template #prepend>
        <VIcon icon="tabler-alert-circle" />
      </template>
      Por favor, selecciona un turno en el Paso 1 para continuar.
    </VAlert>

    <VForm>
      <VRow>
        <!-- Day Shift -->
        <VCol
          v-if="showDayShift"
          cols="12"
          md="6"
        >
          <VCard variant="outlined">
            <VCardTitle class="text-body-1 bg-warning-lighten-5 d-flex align-center gap-2">
              <VIcon icon="tabler-sun" />
              Turno Día
            </VCardTitle>
            <VCardText>
              <VSelect
                :model-value="formData.operator_day_id"
                label="Operador *"
                :items="dayOperatorOptions"
                :loading="loadingEmployees"
                :rules="showDayShift ? [rules.required] : []"
                class="mb-3"
                prepend-inner-icon="tabler-user"
                @update:model-value="(v) => updateField('operator_day_id', v)"
              />
              <VSelect
                :model-value="formData.helper1_day_id"
                label="Ayudante 1"
                :items="dayHelper1Options"
                :loading="loadingEmployees"
                class="mb-3"
                prepend-inner-icon="tabler-user"
                clearable
                @update:model-value="(v) => updateField('helper1_day_id', v)"
              />
              <VSelect
                :model-value="formData.helper2_day_id"
                label="Ayudante 2"
                :items="dayHelper2Options"
                :loading="loadingEmployees"
                class="mb-3"
                prepend-inner-icon="tabler-user"
                clearable
                @update:model-value="(v) => updateField('helper2_day_id', v)"
              />
              <VTextField
                :model-value="formData.horometer_start_day"
                label="Horómetro Inicio *"
                type="number"
                step="0.1"
                prepend-inner-icon="tabler-clock-hour-4"
                suffix="hrs"
                :rules="showDayShift ? [
                  rules.required, 
                  rules.positiveNumber,
                  (v) => {
                    if (!v || !formData.horometer_end_day) return true
                    return v < formData.horometer_end_day || 'El horómetro inicio debe ser menor al horómetro fin'
                  }
                ] : []"
                class="mb-3"
                @update:model-value="(v) => updateField('horometer_start_day', Number(v))"
                @blur="calculateHorometer"
              />
              <VTextField
                :model-value="formData.horometer_end_day"
                label="Horómetro Fin *"
                type="number"
                step="0.1"
                prepend-inner-icon="tabler-clock-hour-4"
                suffix="hrs"
                :rules="showDayShift ? [
                  rules.required, 
                  rules.positiveNumber,
                  (v) => {
                    if (!v || !formData.horometer_start_day) return true
                    return v > formData.horometer_start_day || 'El horómetro fin debe ser mayor al horómetro inicio'
                  }
                ] : []"
                @update:model-value="(v) => updateField('horometer_end_day', Number(v))"
                @blur="calculateHorometer"
              />
            </VCardText>
          </VCard>
        </VCol>

        <!-- Night Shift -->
        <VCol
          v-if="showNightShift"
          cols="12"
          md="6"
        >
          <VCard variant="outlined">
            <VCardTitle class="text-body-1 bg-info-lighten-5 d-flex align-center gap-2">
              <VIcon icon="tabler-moon" />
              Turno Noche
            </VCardTitle>
            <VCardText>
              <VSelect
                :model-value="formData.operator_night_id"
                label="Operador *"
                :items="nightOperatorOptions"
                :loading="loadingEmployees"
                :rules="showNightShift ? [rules.required] : []"
                class="mb-3"
                prepend-inner-icon="tabler-user"
                @update:model-value="(v) => updateField('operator_night_id', v)"
              />
              <VSelect
                :model-value="formData.helper1_night_id"
                label="Ayudante 1"
                :items="nightHelper1Options"
                :loading="loadingEmployees"
                class="mb-3"
                prepend-inner-icon="tabler-user"
                clearable
                @update:model-value="(v) => updateField('helper1_night_id', v)"
              />
              <VSelect
                :model-value="formData.helper2_night_id"
                label="Ayudante 2"
                :items="nightHelper2Options"
                :loading="loadingEmployees"
                class="mb-3"
                prepend-inner-icon="tabler-user"
                clearable
                @update:model-value="(v) => updateField('helper2_night_id', v)"
              />
              <VTextField
                :model-value="formData.horometer_start_night"
                label="Horómetro Inicio *"
                type="number"
                step="0.1"
                prepend-inner-icon="tabler-clock-hour-4"
                suffix="hrs"
                :rules="showNightShift ? [
                  rules.required, 
                  rules.positiveNumber,
                  (v) => {
                    if (!v || !formData.horometer_end_night) return true
                    return v < formData.horometer_end_night || 'El horómetro inicio debe ser menor al horómetro fin'
                  }
                ] : []"
                class="mb-3"
                @update:model-value="(v) => updateField('horometer_start_night', Number(v))"
                @blur="calculateHorometer"
              />
              <VTextField
                :model-value="formData.horometer_end_night"
                label="Horómetro Fin *"
                type="number"
                step="0.1"
                prepend-inner-icon="tabler-clock-hour-4"
                suffix="hrs"
                :rules="showNightShift ? [
                  rules.required, 
                  rules.positiveNumber,
                  (v) => {
                    if (!v || !formData.horometer_start_night) return true
                    return v > formData.horometer_start_night || 'El horómetro fin debe ser mayor al horómetro inicio'
                  }
                ] : []"
                @update:model-value="(v) => updateField('horometer_end_night', Number(v))"
                @blur="calculateHorometer"
              />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
      <VRow>
        <!-- RPM -->
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formData.rpm_pull_down"
            label="RPM Pull Down"
            type="number"
            step="0.1"
            prepend-inner-icon="tabler-arrow-down"
            suffix="RPM"
            @update:model-value="(v) => updateField('rpm_pull_down', Number(v))"
          />
        </VCol>

        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            :model-value="formData.rpm_rotation"
            label="RPM Rotación"
            type="number"
            step="0.1"
            prepend-inner-icon="tabler-rotate"
            suffix="RPM"
            @update:model-value="(v) => updateField('rpm_rotation', Number(v))"
          />
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>
