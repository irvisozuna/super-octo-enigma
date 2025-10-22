<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DrillingReportApiService } from '../../../infrastructure/api/services/DrillingReportApiService'

// Import constants from centralized index
import {
  ACTIVITY_SHIFT_OPTIONS,
  ACTIVITY_TEMPLATES,
  ACTIVITY_TYPES,
  CONSUMABLE_TYPES,
  REPORT_VALIDATION_RULES,
  REPORT_WIZARD_CONFIG,
  REPORT_WIZARD_MESSAGES,
  REPORT_WIZARD_STEPS,
  SHIFT_OPTIONS,
  TOOL_CATEGORY_OPTIONS,
  UNIT_OPTIONS,
} from '../../../shared/constants'

const props = defineProps<CreateReportWizardProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: any]
}>()

const { t } = useI18n()

export interface CreateReportWizardProps {
  modelValue: boolean
  projectId: string
  projectName: string
  wellId: string
  wellName: string
  loading?: boolean
  error?: string | null
}

const currentStep = ref('1')
const step1Form = ref()
const step2Form = ref()
const loadingEquipment = ref(false)
const loadingEmployees = ref(false)
const loadingTools = ref(false)
const equipmentOptions = ref<any[]>([])
const employeeOptions = ref<any[]>([])
const toolOptions = ref<any[]>([])

// Error handling
const errorMessage = ref('')
const errorTitle = ref('Error')
const validationErrors = ref<string[]>([])

// Draft notification
const draftLoadedMessage = ref('')

const localDialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const formData = ref({
  report_date: new Date().toISOString().split('T')[0],
  shift: 'day',
  equipment_id: null as string | null,
  operator_day_id: null as string | null,
  helper1_day_id: null as string | null,
  helper2_day_id: null as string | null,
  operator_night_id: null as string | null,
  helper1_night_id: null as string | null,
  helper2_night_id: null as string | null,
  horometer_start_day: null as number | null,
  horometer_start_night: null as number | null,
  horometer_end_day: null as number | null,
  horometer_end_night: null as number | null,
  rpm_pull_down: null as number | null,
  rpm_rotation: null as number | null,
  observations: '',
  activities: [] as any[],
  consumptions: [] as any[],
  tool_assignments: [] as any[],
})

// Use constants from the imported file
const steps = REPORT_WIZARD_STEPS
const shiftOptions = SHIFT_OPTIONS
const activityShiftOptions = ACTIVITY_SHIFT_OPTIONS
const activityTypeOptions = ACTIVITY_TYPES
const activityTemplates = ACTIVITY_TEMPLATES
const consumableTypeOptions = CONSUMABLE_TYPES
const unitOptions = UNIT_OPTIONS
const toolCategoryOptions = TOOL_CATEGORY_OPTIONS
const rules = REPORT_VALIDATION_RULES

// Computed
const showDayShift = computed(() => formData.value.shift === 'day' || formData.value.shift === 'mixed')
const showNightShift = computed(() => formData.value.shift === 'night' || formData.value.shift === 'mixed')

const availableShiftOptions = computed(() => {
  if (formData.value.shift === 'mixed')
    return activityShiftOptions

  return activityShiftOptions.filter(opt => opt.value === formData.value.shift)
})

const totalHoursWorked = computed(() => {
  return formData.value.activities.reduce((sum, act) => sum + (act.hours || 0), 0)
})

const calculatedHorometerEnd = computed(() => {
  const start = formData.value.shift === 'night'
    ? formData.value.horometer_start_night
    : formData.value.horometer_start_day

  if (!start || !totalHoursWorked.value)
    return null

  return start + totalHoursWorked.value
})

const isFormValid = computed(() => {
  return formData.value.report_date
         && formData.value.shift
         && (showDayShift.value ? formData.value.operator_day_id : true)
         && (showNightShift.value ? formData.value.operator_night_id : true)
})

// Smart Shift Change Handler
const handleShiftChange = () => {
  const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift

  // Auto-update all activities
  formData.value.activities.forEach(activity => {
    activity.shift = defaultShift
  })

  // Auto-update all consumptions
  formData.value.consumptions.forEach(consumption => {
    consumption.shift = defaultShift
  })

  // Auto-update all tool assignments
  formData.value.tool_assignments.forEach(tool => {
    tool.shift = defaultShift
  })
}

// Activity Management
const addActivity = () => {
  const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift

  formData.value.activities.push({
    activity_type: 'drilling_core',
    shift: defaultShift,
    hours: 1,
    start_time: '',
    end_time: '',
    description: '',
  })
}

const addActivityFromTemplate = (template: any) => {
  const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift

  formData.value.activities.push({
    activity_type: template.type,
    shift: defaultShift,
    hours: template.hours,
    start_time: '',
    end_time: '',
    description: '',
  })
}

const removeActivity = (index: number) => {
  formData.value.activities.splice(index, 1)
  calculateHorometer()
}

// Consumption Management
const addConsumption = () => {
  const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift

  formData.value.consumptions.push({
    consumable_type: 'bentonite',
    shift: defaultShift,
    quantity: 1,
    unit: 'bags',
  })
}

const addConsumptionQuick = (type: string, unit: string) => {
  const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift

  formData.value.consumptions.push({
    consumable_type: type,
    shift: defaultShift,
    quantity: 1,
    unit,
  })
}

const removeConsumption = (index: number) => {
  formData.value.consumptions.splice(index, 1)
}

// Tool Assignment Management
const addToolAssignment = () => {
  const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift
  const lastDepth = getLastDepth()

  formData.value.tool_assignments.push({
    tool_id: null,
    shift: defaultShift,
    tool_category: 'diamond_bit',
    start_depth_meters: lastDepth,
    end_depth_meters: lastDepth,
    wear_pattern: '',
    matrix: '',
  })
}

const removeToolAssignment = (index: number) => {
  formData.value.tool_assignments.splice(index, 1)
}

const getLastDepth = () => {
  if (formData.value.tool_assignments.length === 0)
    return 0
  const lastTool = formData.value.tool_assignments[formData.value.tool_assignments.length - 1]

  return lastTool.end_depth_meters || 0
}

// Horometer Calculation
const calculateHorometer = () => {
  // Auto-calculated in computed property
}

// Navigation
const validateStep1 = async () => {
  if (!step1Form.value)
    return false
  const { valid } = await step1Form.value.validate()

  return valid
}

const nextStep = async () => {
  if (currentStep.value === '1') {
    const valid = await validateStep1()

    if (!valid)
      return
  }

  if (currentStep.value === '2' && step2Form.value) {
    const { valid } = await step2Form.value.validate()

    if (!valid)
      return
  }

  const currentStepIndex = steps.findIndex(s => s.value === currentStep.value)
  if (currentStepIndex < steps.length - 1)
    currentStep.value = steps[currentStepIndex + 1].value
}

const previousStep = () => {
  const currentStepIndex = steps.findIndex(s => s.value === currentStep.value)
  if (currentStepIndex > 0)
    currentStep.value = steps[currentStepIndex - 1].value
}

// Data Loading
const loadEquipment = async () => {
  loadingEquipment.value = true
  try {
    const response = await DrillingReportApiService.getEquipment?.() || { data: [] }

    equipmentOptions.value = (response.data || response || []).map((eq: any) => ({
      title: eq.name || eq.equipment_name,
      value: eq.id,
    }))
  }
  catch (error) {
    console.error('Error loading equipment:', error)
    equipmentOptions.value = []
  }
  finally {
    loadingEquipment.value = false
  }
}

const loadEmployees = async () => {
  loadingEmployees.value = true
  try {
    const response = await DrillingReportApiService.getEmployees?.() || { data: [] }

    employeeOptions.value = (response.data || response || []).map((emp: any) => ({
      title: emp.full_name || `${emp.first_name} ${emp.last_name}`,
      value: emp.id,
    }))
  }
  catch (error) {
    console.error('❌ Error loading employees:', error)
    employeeOptions.value = []
  }
  finally {
    loadingEmployees.value = false
  }
}

const loadTools = async () => {
  loadingTools.value = true
  try {
    const response = await DrillingReportApiService.getTools?.() || { data: [] }

    toolOptions.value = (response.data || response || []).map((tool: any) => ({
      title: tool.name || tool.tool_name,
      value: tool.id,
    }))
  }
  catch (error) {
    console.error('Error loading tools:', error)
    toolOptions.value = []
  }
  finally {
    loadingTools.value = false
  }
}

const handleSubmit = async () => {
  const data = {
    project_id: props.projectId,
    well_id: props.wellId,
    ...formData.value,
  }

  emit('submit', data)
}

const handleCancel = () => {
  // Clear draft when user cancels
  clearDraft()

  currentStep.value = '1'
  formData.value = {
    report_date: new Date().toISOString().split('T')[0],
    shift: 'day',
    equipment_id: null,
    operator_day_id: null,
    helper1_day_id: null,
    helper2_day_id: null,
    operator_night_id: null,
    helper1_night_id: null,
    helper2_night_id: null,
    horometer_start_day: null,
    horometer_start_night: null,
    horometer_end_day: null,
    horometer_end_night: null,
    rpm_pull_down: null,
    rpm_rotation: null,
    observations: '',
    activities: [],
    consumptions: [],
    tool_assignments: [],
  }
  clearError()
  localDialog.value = false
}

// Draft management
const saveDraft = () => {
  try {
    const draft = {
      formData: formData.value,
      currentStep: currentStep.value,
      timestamp: new Date().toISOString(),
    }

    localStorage.setItem(DRAFT_KEY.value, JSON.stringify(draft))
  }
  catch (error) {
    console.error('Error saving draft:', error)
  }
}

const loadDraft = () => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY.value)
    if (saved) {
      const draft = JSON.parse(saved)

      formData.value = draft.formData
      currentStep.value = draft.currentStep || '1'

      // Show notification
      const savedDate = new Date(draft.timestamp)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - savedDate.getTime()) / 60000)

      let timeAgo = ''
      if (diffMinutes < 1) {
        timeAgo = 'hace unos segundos'
      }
      else if (diffMinutes < 60) {
        timeAgo = `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`
      }
      else {
        const diffHours = Math.floor(diffMinutes / 60)

        timeAgo = `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
      }

      draftLoadedMessage.value = `Se restauró el borrador guardado ${timeAgo}`

      // Clear message after 5 seconds
      setTimeout(() => {
        draftLoadedMessage.value = ''
      }, 5000)
    }
  }
  catch (error) {
    console.error('Error loading draft:', error)
  }
}

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY.value)
  }
  catch (error) {
    console.error('Error clearing draft:', error)
  }
}

const clearError = () => {
  errorMessage.value = ''
  errorTitle.value = 'Error'
  validationErrors.value = []
}

// Method to be called from parent on success
const onSuccess = () => {
  clearDraft()
  clearError()
  handleCancel()
}

// Expose method for parent to call
defineExpose({
  onSuccess,
})

// Auto-save draft to localStorage
const DRAFT_KEY = computed(() => `report_draft_${props.projectId}_${props.wellId}`)

watch(() => props.modelValue, newValue => {
  if (newValue) {
    currentStep.value = '1'
    loadEquipment()
    loadEmployees()
    loadTools()

    // Load draft if exists
    loadDraft()
  }
})

// Auto-save formData to localStorage on changes
watch(() => formData.value, newData => {
  if (props.modelValue)
    saveDraft()
}, { deep: true })

// Watch for errors from parent
watch(() => props.error, newError => {
  if (!newError)
    return

  try {
    const errorObj = typeof newError === 'string' ? JSON.parse(newError) : newError

    // Handle Laravel validation errors
    if (errorObj.errors) {
      errorTitle.value = 'Errores de validación'
      errorMessage.value = errorObj.message || 'Por favor corrige los siguientes errores:'

      // Extract validation errors with field names
      validationErrors.value = Object.entries(errorObj.errors).flatMap(([field, messages]: [string, any]) => {
        return (messages as string[]).map((msg: string) => {
          // Clean up field name for better UX
          const cleanField = field.replace(/_/g, ' ').replace(/\.\d+\./g, ' > ')

          return `${cleanField}: ${msg}`
        })
      })
    }
    else if (errorObj.error) {
      // Handle structured error
      const errorCode = errorObj.error.code
      const translatedMessage = t(`errors.${errorCode}`, '', { missingWarn: false, fallbackWarn: false })

      if (translatedMessage && translatedMessage !== '' && translatedMessage !== `errors.${errorCode}`) {
        errorTitle.value = t('common.error')
        errorMessage.value = translatedMessage
      }
      else {
        errorTitle.value = errorCode || t('common.error')
        errorMessage.value = errorObj.error.message || newError
      }
      validationErrors.value = []
    }
    else {
      errorTitle.value = t('common.error')
      errorMessage.value = errorObj.message || typeof errorObj === 'string' ? errorObj : JSON.stringify(errorObj)
      validationErrors.value = []
    }
  }
  catch (e) {
    console.error('💥 Wizard: Error parsing error message:', e)
    errorTitle.value = t('common.error')
    errorMessage.value = typeof newError === 'string' ? newError : 'Error desconocido'
    validationErrors.value = []
  }
})

watch(() => currentStep.value, (newStep, oldStep) => {
  if (newStep === '2') {
    console.log('👥 Employee options available:', employeeOptions.value)
    console.log('⚙️ Equipment options available:', equipmentOptions.value)
    console.log('📋 Current form data:', formData.value)
  }
})

onMounted(() => {
  if (props.modelValue) {
    loadEquipment()
    loadEmployees()
    loadTools()
  }
})
</script>

<template>
  <VDialog
    v-model="localDialog"
    max-width="1000"
    persistent
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between sticky-header">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-file-plus"
            color="primary"
          />
          <span>Nuevo Reporte de Perforación</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="handleCancel"
        />
      </VCardTitle>

      <VDivider />

      <!-- Draft Loaded Alert -->
      <VAlert
        v-if="draftLoadedMessage"
        type="info"
        variant="tonal"
        closable
        class="ma-4"
        @click:close="draftLoadedMessage = ''"
      >
        <template #prepend>
          <VIcon icon="tabler-restore" />
        </template>
        {{ draftLoadedMessage }}
      </VAlert>

      <!-- Error Alert -->
      <VAlert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        closable
        class="ma-4"
        prominent
        @click:close="clearError"
      >
        <template #prepend>
          <VIcon
            icon="tabler-alert-circle"
            size="32"
          />
        </template>
        <VAlertTitle class="text-h6 mb-2">
          {{ errorTitle }}
        </VAlertTitle>
        <div v-if="validationErrors.length > 0">
          <p class="mb-2">
            {{ errorMessage }}
          </p>
          <ul class="ml-4">
            <li
              v-for="(error, index) in validationErrors"
              :key="index"
              class="text-body-2"
            >
              {{ error }}
            </li>
          </ul>
        </div>
        <p
          v-else
          class="mb-0"
        >
          {{ errorMessage }}
        </p>
      </VAlert>

      <VCardText
        class="pa-0"
        style="max-block-size: 70vh; overflow-y: auto;"
      >
        <VStepper
          v-model="currentStep"
          :items="steps"
          hide-actions
          flat
        >
          <!-- Step 1: Información Básica -->
          <VStepperWindow>
            <VStepperWindowItem value="1">
              <div class="pa-6">
                <div class="mb-4">
                  <h3 class="text-h6 mb-2">
                    Información Básica del Reporte
                  </h3>
                  <p class="text-body-2 text-medium-emphasis">
                    Configura los datos principales del reporte de perforación
                  </p>
                </div>

                <VForm ref="step1Form">
                  <VRow>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <VTextField
                        :model-value="projectName"
                        label="Proyecto"
                        prepend-inner-icon="tabler-folder"
                        readonly
                        variant="filled"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="6"
                    >
                      <VTextField
                        :model-value="wellName"
                        label="Pozo"
                        prepend-inner-icon="tabler-droplet"
                        readonly
                        variant="filled"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="4"
                    >
                      <VTextField
                        v-model="formData.report_date"
                        label="Fecha del Reporte *"
                        type="date"
                        prepend-inner-icon="tabler-calendar"
                        :rules="[rules.required, rules.dateNotFuture]"
                        required
                        @update:model-value="validateStep1"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="4"
                    >
                      <VSelect
                        v-model="formData.shift"
                        label="Turno *"
                        :items="shiftOptions"
                        prepend-inner-icon="tabler-clock"
                        :rules="[rules.required]"
                        required
                        @update:model-value="handleShiftChange"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="4"
                    >
                      <VSelect
                        v-model="formData.equipment_id"
                        label="Equipo"
                        :items="equipmentOptions"
                        :loading="loadingEquipment"
                        prepend-inner-icon="tabler-tool"
                        clearable
                      />
                    </VCol>

                    <VCol cols="12">
                      <VAlert
                        type="info"
                        variant="tonal"
                        density="compact"
                      >
                        <template #prepend>
                          <VIcon icon="tabler-bulb" />
                        </template>
                        El turno seleccionado se aplicará automáticamente a todas las actividades, consumos y herramientas.
                      </VAlert>
                    </VCol>
                  </VRow>
                </VForm>
              </div>
            </VStepperWindowItem>

            <!-- Step 2: Personal -->
            <VStepperWindowItem value="2">
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

                <VForm ref="step2Form">
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
                            v-model="formData.operator_day_id"
                            label="Operador *"
                            :items="employeeOptions"
                            :loading="loadingEmployees"
                            :rules="showDayShift ? [rules.required] : []"
                            class="mb-3"
                            prepend-inner-icon="tabler-user"
                          />
                          <VSelect
                            v-model="formData.helper1_day_id"
                            label="Ayudante 1"
                            :items="employeeOptions"
                            :loading="loadingEmployees"
                            class="mb-3"
                            prepend-inner-icon="tabler-user"
                            clearable
                          />
                          <VSelect
                            v-model="formData.helper2_day_id"
                            label="Ayudante 2"
                            :items="employeeOptions"
                            :loading="loadingEmployees"
                            class="mb-3"
                            prepend-inner-icon="tabler-user"
                            clearable
                          />
                          <VTextField
                            v-model.number="formData.horometer_start_day"
                            label="Horómetro Inicio *"
                            type="number"
                            step="0.1"
                            prepend-inner-icon="tabler-clock-hour-4"
                            suffix="hrs"
                            :rules="showDayShift ? [rules.required, rules.positiveNumber] : []"
                            class="mb-3"
                            @update:model-value="calculateHorometer"
                          />
                          <VTextField
                            v-model.number="formData.horometer_end_day"
                            label="Horómetro Fin *"
                            type="number"
                            step="0.1"
                            prepend-inner-icon="tabler-clock-hour-4"
                            suffix="hrs"
                            :rules="showDayShift ? [rules.required, rules.positiveNumber] : []"
                            @update:model-value="calculateHorometer"
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
                            v-model="formData.operator_night_id"
                            label="Operador *"
                            :items="employeeOptions"
                            :loading="loadingEmployees"
                            :rules="showNightShift ? [rules.required] : []"
                            class="mb-3"
                            prepend-inner-icon="tabler-user"
                          />
                          <VSelect
                            v-model="formData.helper1_night_id"
                            label="Ayudante 1"
                            :items="employeeOptions"
                            :loading="loadingEmployees"
                            class="mb-3"
                            prepend-inner-icon="tabler-user"
                            clearable
                          />
                          <VSelect
                            v-model="formData.helper2_night_id"
                            label="Ayudante 2"
                            :items="employeeOptions"
                            :loading="loadingEmployees"
                            class="mb-3"
                            prepend-inner-icon="tabler-user"
                            clearable
                          />
                          <VTextField
                            v-model.number="formData.horometer_start_night"
                            label="Horómetro Inicio *"
                            type="number"
                            step="0.1"
                            prepend-inner-icon="tabler-clock-hour-4"
                            suffix="hrs"
                            :rules="showNightShift ? [rules.required, rules.positiveNumber] : []"
                            class="mb-3"
                            @update:model-value="calculateHorometer"
                          />
                          <VTextField
                            v-model.number="formData.horometer_end_night"
                            label="Horómetro Fin *"
                            type="number"
                            step="0.1"
                            prepend-inner-icon="tabler-clock-hour-4"
                            suffix="hrs"
                            :rules="showNightShift ? [rules.required, rules.positiveNumber] : []"
                            @update:model-value="calculateHorometer"
                          />
                        </VCardText>
                      </VCard>
                    </VCol>

                    <!-- RPM -->
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <VTextField
                        v-model.number="formData.rpm_pull_down"
                        label="RPM Pull Down"
                        type="number"
                        step="0.1"
                        prepend-inner-icon="tabler-arrow-down"
                        suffix="RPM"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="6"
                    >
                      <VTextField
                        v-model.number="formData.rpm_rotation"
                        label="RPM Rotación"
                        type="number"
                        step="0.1"
                        prepend-inner-icon="tabler-rotate"
                        suffix="RPM"
                      />
                    </VCol>
                  </VRow>
                </VForm>
              </div>
            </VStepperWindowItem>

            <!-- Step 3: Actividades -->
            <VStepperWindowItem value="3">
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
                              v-model="activity.activity_type"
                              label="Tipo de Actividad *"
                              :items="activityTypeOptions"
                              :rules="[rules.required]"
                              prepend-inner-icon="tabler-list"
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="2"
                          >
                            <VSelect
                              v-model="activity.shift"
                              label="Turno *"
                              :items="availableShiftOptions"
                              :rules="[rules.required]"
                              prepend-inner-icon="tabler-clock"
                              readonly
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="2"
                          >
                            <VTextField
                              v-model.number="activity.hours"
                              label="Horas *"
                              type="number"
                              step="0.5"
                              min="0.1"
                              max="24"
                              :rules="[rules.required, rules.positiveNumber]"
                              prepend-inner-icon="tabler-hourglass"
                              suffix="hrs"
                              @update:model-value="calculateHorometer"
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="2"
                          >
                            <VTextField
                              v-model="activity.start_time"
                              label="Hora Inicio"
                              type="time"
                              prepend-inner-icon="tabler-clock-play"
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="2"
                          >
                            <VTextField
                              v-model="activity.end_time"
                              label="Hora Fin"
                              type="time"
                              prepend-inner-icon="tabler-clock-stop"
                            />
                          </VCol>

                          <VCol cols="12">
                            <VTextarea
                              v-model="activity.description"
                              label="Descripción"
                              rows="2"
                              counter="500"
                              :rules="[rules.maxLength(500)]"
                              prepend-inner-icon="tabler-notes"
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
                        No hay actividades registradas. Agrega la primera actividad del turno.
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
            </VStepperWindowItem>

            <!-- Step 4: Consumos -->
            <VStepperWindowItem value="4">
              <div class="pa-6">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <h3 class="text-h6 mb-2">
                      Consumos de Materiales
                    </h3>
                    <p class="text-body-2 text-medium-emphasis">
                      Registra los materiales consumidos durante el turno
                    </p>
                  </div>
                  <VBtn
                    color="info"
                    prepend-icon="tabler-plus"
                    @click="addConsumption"
                  >
                    Agregar
                  </VBtn>
                </div>

                <!-- Quick Add Common Consumables -->
                <div class="mb-4">
                  <p class="text-caption text-medium-emphasis mb-2">
                    Materiales Comunes:
                  </p>
                  <div class="d-flex flex-wrap gap-2">
                    <VBtn
                      size="small"
                      variant="outlined"
                      @click="addConsumptionQuick('bentonite', 'bags')"
                    >
                      <VIcon
                        icon="tabler-droplet"
                        start
                        size="16"
                      />
                      Bentonita (sacos)
                    </VBtn>
                    <VBtn
                      size="small"
                      variant="outlined"
                      @click="addConsumptionQuick('water', 'liters')"
                    >
                      <VIcon
                        icon="tabler-droplet-filled"
                        start
                        size="16"
                      />
                      Agua (litros)
                    </VBtn>
                    <VBtn
                      size="small"
                      variant="outlined"
                      @click="addConsumptionQuick('cement', 'bags')"
                    >
                      <VIcon
                        icon="tabler-building"
                        start
                        size="16"
                      />
                      Cemento (sacos)
                    </VBtn>
                  </div>
                </div>

                <!-- Consumptions List -->
                <VRow>
                  <VCol
                    v-for="(consumption, index) in formData.consumptions"
                    :key="index"
                    cols="12"
                    md="6"
                  >
                    <VCard variant="outlined">
                      <VCardTitle class="d-flex align-center justify-space-between bg-info-lighten-5">
                        <span class="text-body-1">Material {{ index + 1 }}</span>
                        <VBtn
                          icon="tabler-trash"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeConsumption(index)"
                        />
                      </VCardTitle>
                      <VCardText>
                        <VRow>
                          <VCol cols="12">
                            <VSelect
                              v-model="consumption.consumable_type"
                              label="Material *"
                              :items="consumableTypeOptions"
                              :rules="[rules.required]"
                              prepend-inner-icon="tabler-droplet"
                            />
                          </VCol>

                          <VCol cols="6">
                            <VTextField
                              v-model.number="consumption.quantity"
                              label="Cantidad *"
                              type="number"
                              step="0.01"
                              min="0.01"
                              :rules="[rules.required, rules.positiveNumber]"
                              prepend-inner-icon="tabler-123"
                            />
                          </VCol>

                          <VCol cols="6">
                            <VSelect
                              v-model="consumption.unit"
                              label="Unidad *"
                              :items="unitOptions"
                              :rules="[rules.required]"
                              prepend-inner-icon="tabler-ruler"
                            />
                          </VCol>

                          <VCol cols="12">
                            <VSelect
                              v-model="consumption.shift"
                              label="Turno *"
                              :items="availableShiftOptions"
                              :rules="[rules.required]"
                              prepend-inner-icon="tabler-clock"
                              readonly
                            />
                          </VCol>
                        </VRow>
                      </VCardText>
                    </VCard>
                  </VCol>

                  <!-- Empty State -->
                  <VCol
                    v-if="formData.consumptions.length === 0"
                    cols="12"
                  >
                    <VCard
                      variant="outlined"
                      class="text-center pa-8"
                    >
                      <VIcon
                        icon="tabler-droplet-off"
                        size="64"
                        class="text-medium-emphasis mb-4"
                      />
                      <p class="text-body-2 text-medium-emphasis mb-4">
                        No hay consumos registrados. Puedes omitir este paso si no hubo consumos.
                      </p>
                      <VBtn
                        color="info"
                        prepend-icon="tabler-plus"
                        @click="addConsumption"
                      >
                        Agregar Consumo
                      </VBtn>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </VStepperWindowItem>

            <!-- Step 5: Herramientas -->
            <VStepperWindowItem value="5">
              <div class="pa-6">
                <div class="d-flex justify-space-between align-center mb-4">
                  <div>
                    <h3 class="text-h6 mb-2">
                      Herramientas Utilizadas
                    </h3>
                    <p class="text-body-2 text-medium-emphasis">
                      Registra las herramientas usadas. La profundidad se sugiere automáticamente.
                    </p>
                  </div>
                  <VBtn
                    color="warning"
                    prepend-icon="tabler-plus"
                    @click="addToolAssignment"
                  >
                    Agregar
                  </VBtn>
                </div>

                <!-- Tools List -->
                <VRow>
                  <VCol
                    v-for="(tool, index) in formData.tool_assignments"
                    :key="index"
                    cols="12"
                  >
                    <VCard variant="outlined">
                      <VCardTitle class="d-flex align-center justify-space-between bg-warning-lighten-5">
                        <span class="text-body-1">Herramienta {{ index + 1 }}</span>
                        <VBtn
                          icon="tabler-trash"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeToolAssignment(index)"
                        />
                      </VCardTitle>
                      <VCardText>
                        <VRow>
                          <VCol
                            cols="12"
                            md="4"
                          >
                            <VSelect
                              v-model="tool.tool_id"
                              label="Herramienta *"
                              :items="toolOptions"
                              :loading="loadingTools"
                              :rules="[rules.required]"
                              prepend-inner-icon="tabler-tool"
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="4"
                          >
                            <VSelect
                              v-model="tool.tool_category"
                              label="Categoría *"
                              :items="toolCategoryOptions"
                              :rules="[rules.required]"
                              prepend-inner-icon="tabler-category"
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="4"
                          >
                            <VSelect
                              v-model="tool.shift"
                              label="Turno *"
                              :items="availableShiftOptions"
                              :rules="[rules.required]"
                              prepend-inner-icon="tabler-clock"
                              readonly
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="6"
                          >
                            <VTextField
                              v-model.number="tool.start_depth_meters"
                              label="Profundidad Inicio (m) *"
                              type="number"
                              step="0.01"
                              min="0"
                              :rules="[rules.required, rules.positiveNumber]"
                              prepend-inner-icon="tabler-arrow-down-circle"
                              suffix="m"
                              :hint="index === 0 ? 'Primera herramienta' : `Sugerido: ${getLastDepth()} m`"
                              persistent-hint
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="6"
                          >
                            <VTextField
                              v-model.number="tool.end_depth_meters"
                              label="Profundidad Fin (m) *"
                              type="number"
                              step="0.01"
                              min="0"
                              :rules="[rules.required, rules.positiveNumber, (v) => v > tool.start_depth_meters || 'Debe ser mayor a la profundidad inicial']"
                              prepend-inner-icon="tabler-arrow-up-circle"
                              suffix="m"
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="6"
                          >
                            <VTextField
                              v-model="tool.wear_pattern"
                              label="Patrón de Desgaste"
                              counter="100"
                              :rules="[rules.maxLength(100)]"
                              prepend-inner-icon="tabler-zoom-question"
                              placeholder="Ej: Desgaste uniforme en corona"
                            />
                          </VCol>

                          <VCol
                            cols="12"
                            md="6"
                          >
                            <VTextField
                              v-model="tool.matrix"
                              label="Matriz"
                              counter="50"
                              :rules="[rules.maxLength(50)]"
                              prepend-inner-icon="tabler-grid-dots"
                              placeholder="Ej: M7"
                            />
                          </VCol>
                        </VRow>
                      </VCardText>
                    </VCard>
                  </VCol>

                  <!-- Empty State -->
                  <VCol
                    v-if="formData.tool_assignments.length === 0"
                    cols="12"
                  >
                    <VCard
                      variant="outlined"
                      class="text-center pa-8"
                    >
                      <VIcon
                        icon="tabler-tools-off"
                        size="64"
                        class="text-medium-emphasis mb-4"
                      />
                      <p class="text-body-2 text-medium-emphasis mb-4">
                        No hay herramientas registradas. Puedes omitir este paso si no se usaron herramientas.
                      </p>
                      <VBtn
                        color="warning"
                        prepend-icon="tabler-plus"
                        @click="addToolAssignment"
                      >
                        Agregar Herramienta
                      </VBtn>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </VStepperWindowItem>

            <!-- Step 6: Revisión Final -->
            <VStepperWindowItem value="6">
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
                  v-model="formData.observations"
                  label="Observaciones Generales"
                  rows="6"
                  counter="1000"
                  :rules="[rules.maxLength(1000)]"
                  prepend-inner-icon="tabler-notes"
                  placeholder="Agrega cualquier observación relevante sobre el turno..."
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
            </VStepperWindowItem>
          </VStepperWindow>
        </VStepper>
      </VCardText>

      <VDivider />

      <!-- Navigation Footer -->
      <VCardActions class="pa-4">
        <VChip
          size="small"
          variant="tonal"
        >
          Paso {{ currentStep }} de {{ steps.length }}
        </VChip>
        <VSpacer />
        <VBtn
          v-if="currentStep > 1"
          variant="text"
          prepend-icon="tabler-arrow-left"
          @click="previousStep"
        >
          Anterior
        </VBtn>
        <VBtn
          variant="text"
          @click="handleCancel"
        >
          Cancelar
        </VBtn>
        <VBtn
          v-if="currentStep < steps.length"
          color="primary"
          append-icon="tabler-arrow-right"
          @click="nextStep"
        >
          Siguiente
        </VBtn>
        <VBtn
          v-else
          color="primary"
          prepend-icon="tabler-device-floppy"
          :loading="loading"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          Guardar Reporte
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.sticky-header {
  position: sticky;
  z-index: 10;
  background: rgb(var(--v-theme-surface));
  inset-block-start: 0;
}

:deep(.v-stepper) {
  box-shadow: none !important;
}
</style>
