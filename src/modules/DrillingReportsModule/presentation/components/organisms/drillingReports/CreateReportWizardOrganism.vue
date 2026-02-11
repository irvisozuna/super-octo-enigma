<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useReportWizardStore } from '../../../stores/reportWizardStore'
import { useProjectDetailStore } from '../../../stores/projectDetailStore'
import { useDrillingReportStore } from '../../../stores/drillingReportStore'
import { REPORT_WIZARD_STEPS } from '../../../../shared/constants'

// Import Molecules
import WizardBasicInfoMolecule from '../../molecules/WizardBasicInfoMolecule.vue'
import WizardPersonnelMolecule from '../../molecules/WizardPersonnelMolecule.vue'
import WizardActivitiesMolecule from '../../molecules/WizardActivitiesMolecule.vue'
import WizardDirectionalMeasurementsMolecule from '../../molecules/WizardDirectionalMeasurementsMolecule.vue'
import WizardConsumptionsMolecule from '../../molecules/WizardConsumptionsMolecule.vue'
import WizardToolsMolecule from '../../molecules/WizardToolsMolecule.vue'
import WizardReviewMolecule from '../../molecules/WizardReviewMolecule.vue'

export interface CreateReportWizardProps {
  modelValue: boolean
  projectId: string
  projectName: string
  wellId: string
  wellName: string
  reportId?: string
  loading?: boolean
  error?: string | null
}

const props = defineProps<CreateReportWizardProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submit': [data: any]
  'update': [data: { reportId: string; data: any }]
}>()

const { t } = useI18n()

// Store
const wizardStore = useReportWizardStore()
const detailStore = useProjectDetailStore()
const drillingReportStore = useDrillingReportStore()

// Form refs
const step1Form = ref()
const step2Form = ref()
const step2Personnel = ref()

// Loading states
const loadingEquipment = ref(false)
const loadingEmployees = ref(false)
const loadingTools = ref(false)

// Options
const equipmentOptions = ref<any[]>([])
const employeeOptions = ref<any[]>([])
const toolOptions = ref<any[]>([])

// Dialog state
const localDialog = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Wizard config
const steps = REPORT_WIZARD_STEPS

// Validation
const validateStep1 = async () => {
  if (!step1Form.value)
    return false
  const { valid } = await step1Form.value.validate()

  return valid
}

const validateStep2 = async () => {
  if (!step2Form.value)
    return false
  const { valid } = await step2Form.value.validate()

  // Also check personnel step validation
  if (valid && step2Personnel.value)
    return step2Personnel.value.isPersonnelStepValid

  return valid
}

// Navigation
const nextStep = async () => {
  if (wizardStore.currentStep === '1') {
    const valid = await validateStep1()
    if (!valid) {
      console.log('❌ Step 1 validation failed')

      return
    }
  }

  if (wizardStore.currentStep === '2') {
    const valid = await validateStep2()
    if (!valid) {
      console.log('❌ Step 2 validation failed')

      return
    }
  }

  if (wizardStore.currentStep === '3') {
    if (!wizardStore.isActivitiesStepValid) {
      console.log('❌ Step 3 validation failed - activities step not valid')

      return
    }
  }

  if (wizardStore.currentStep === '4') {
    if (!wizardStore.isDirectionalMeasurementsStepValid) {
      console.log('❌ Step 4 validation failed - directional measurements step not valid')

      return
    }
  }

  if (wizardStore.currentStep === '6') {
    if (!wizardStore.isToolGroupsStepValid) {
      console.log('❌ Step 6 validation failed - tools step not valid')

      return
    }
  }

  wizardStore.nextStep()
}

const previousStep = () => {
  wizardStore.previousStep()
}

// Data Loading
const loadEquipment = async () => {
  loadingEquipment.value = true
  try {
    // Use the store method instead of calling API directly
    const response = await detailStore.loadTabData('equipment', props.projectId, true)

    equipmentOptions.value = (response || []).map((eq: any) => ({
      title: eq.equipment_name || eq.name,
      value: eq.id,
    }))
  }
  catch (error) {
    console.error('❌ Error loading equipment:', error)
    equipmentOptions.value = []
  }
  finally {
    loadingEquipment.value = false
  }
}

const loadEmployees = async () => {
  loadingEmployees.value = true
  try {
    // Use the store method instead of calling API directly
    const response = await detailStore.loadTabData('personnel', props.projectId, true)

    employeeOptions.value = (response || []).map((emp: any) => ({
      title: emp.employee?.full_name || emp.full_name || emp.name || 'N/A',
      value: emp.employee?.id || emp.id,
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
    // Use the store method instead of calling API directly
    const response = await detailStore.loadTabData('tools', props.projectId, true)

    toolOptions.value = (response || []).map((tool: any) => ({
      title: tool.serial_number || tool.tool_type,
      value: tool.id,
      type: tool.tool_type,
    }))
  }
  catch (error) {
    console.error('❌ Error loading tools:', error)
    toolOptions.value = []
  }
  finally {
    loadingTools.value = false
  }
}

// Actions
const handleSubmit = async () => {
  const data = {
    project_id: props.projectId,
    well_id: props.wellId,
    ...wizardStore.formData,
  }

  // Important: We don't clear here because we need to wait for the parent's response
  // The parent will call onSuccess() if the save is successful
  if (props.reportId)
    emit('update', { reportId: props.reportId, data })

  else
    emit('submit', data)
}

const handleCancel = () => {
  // Clear draft when user cancels
  wizardStore.clearDraft(props.projectId, props.wellId)

  // Reset form to initial state
  wizardStore.resetForm()

  // Clear any errors
  wizardStore.clearError()

  // Close dialog
  localDialog.value = false
}

// Method to be called from parent on success
const onSuccess = () => {
  // Clear draft after successful save
  wizardStore.clearDraft(props.projectId, props.wellId)

  // Reset form to initial state for next use
  wizardStore.resetForm()

  // Clear any errors
  wizardStore.clearError()

  // Close dialog
  localDialog.value = false
}

// Method to be called from parent on error (optional)
const onError = (error: any) => {
  // Draft is kept so user doesn't lose data
  // Error handling is done through the error prop watcher
}

// Expose methods for parent to call
defineExpose({
  onSuccess,
  onError,
})

// Function to load report data when editing
const loadReportForEditing = async () => {
  if (!props.reportId) {
    console.warn('⚠️ loadReportForEditing called but no reportId provided')

    return
  }

  try {
    console.log('🔄 Loading report with ID:', props.reportId)

    const response = await drillingReportStore.fetchReportById(props.reportId)

    console.log('📦 Raw API response:', response)

    // The API might return { data: report } or just report
    const report = response?.data || response

    console.log('📋 Report object extracted:', report)
    console.log('📋 Report keys:', report ? Object.keys(report) : 'No report object')

    if (!report) {
      console.error('❌ No report data received')
      wizardStore.setError('Error', 'No se recibieron datos del reporte')

      return
    }

    if (!report.id && !report.report_number) {
      console.error('❌ Invalid report structure:', report)
      wizardStore.setError('Error', 'El reporte recibido no tiene la estructura esperada')

      return
    }

    console.log('✅ Valid report received, loading into wizard...')

    // Add tools from the report to toolOptions if they don't exist
    // This ensures reamers and bits from the report are selectable in dropdowns
    const reportTools = [
      ...(report.tools?.reamers || []),
      ...(report.tools?.bits || []),
    ].map((item: any) => item.tool).filter(Boolean)

    reportTools.forEach((tool: any) => {
      if (tool.id && !toolOptions.value.find((opt: any) => opt.value === tool.id)) {
        toolOptions.value.push({
          title: tool.serial_number || tool.type,
          value: tool.id,
          type: tool.type,
        })
        console.log('➕ Added missing tool from report:', tool.serial_number || tool.id)
      }
    })

    wizardStore.loadReportData(report)
    console.log('✅ Report data loaded into wizard successfully')
  }
  catch (error: any) {
    console.error('❌ Error loading report for editing:', error)
    console.error('❌ Error details:', {
      message: error?.message,
      response: error?.response,
      stack: error?.stack,
    })
    wizardStore.setError('Error', error?.message || 'No se pudo cargar el reporte para editar')
  }
}

// Watch for dialog open/close
watch(() => props.modelValue, async newValue => {
  if (newValue) {
    // Always start fresh
    wizardStore.setStep('1')
    wizardStore.clearError()

    // Load required data first
    await Promise.all([
      loadEquipment(),
      loadEmployees(),
      loadTools(),
    ])

    // If editing (reportId exists), load report data
    if (props.reportId) {
      console.log('🔧 Edit mode detected, reportId:', props.reportId)
      await loadReportForEditing()
    }
    else {
      // Try to load draft if exists (only for new reports)
      const draftLoaded = wizardStore.loadDraft(props.projectId, props.wellId)

      // If no draft loaded, ensure we start with clean form
      if (!draftLoaded)
        wizardStore.resetForm()
      else
        console.log('📋 Draft loaded successfully')
    }
  }
  else {
    // When dialog closes, ensure everything is clean for next time
    wizardStore.clearError()

    // Reset form when closing to avoid stale data
    if (!props.reportId)
      wizardStore.resetForm()
  }
})

// Watch for reportId changes (in case it changes after dialog opens)
watch(() => props.reportId, async (newReportId, oldReportId) => {
  if (props.modelValue && newReportId && newReportId !== oldReportId)
    await loadReportForEditing()
})

// Auto-save draft on changes
watch(() => wizardStore.formData, () => {
  if (props.modelValue && wizardStore.isDirty)
    wizardStore.saveDraft(props.projectId, props.wellId)
}, { deep: true })

// Watch for errors from parent
watch(() => props.error, newError => {
  if (!newError)
    return

  console.log('🔴 Wizard: Received error from parent:', newError)

  try {
    const errorObj = typeof newError === 'string' ? JSON.parse(newError) : newError

    // Handle Laravel validation errors
    if (errorObj.errors) {
      const validationErrors: Record<string, string[]> = {}

      Object.entries(errorObj.errors).forEach(([field, messages]: [string, any]) => {
        validationErrors[field] = messages as string[]
      })

      wizardStore.setError(
        'Errores de validación',
        errorObj.message || 'Por favor corrige los siguientes errores:',
        validationErrors,
      )
    }
    else if (errorObj.error) {
      // Handle structured error
      const errorCode = errorObj.error.code
      const translatedMessage = t(`errors.${errorCode}`, '', { missingWarn: false, fallbackWarn: false })

      if (translatedMessage && translatedMessage !== '' && translatedMessage !== `errors.${errorCode}`)
        wizardStore.setError(t('common.error'), translatedMessage)
      else
        wizardStore.setError(errorCode || t('common.error'), errorObj.error.message || newError)
    }
    else {
      wizardStore.setError(t('common.error'), errorObj.message || typeof errorObj === 'string' ? errorObj : JSON.stringify(errorObj))
    }
  }
  catch (e) {
    console.error('💥 Wizard: Error parsing error message:', e)
    wizardStore.setError(t('common.error'), typeof newError === 'string' ? newError : 'Error desconocido')
  }
})

onMounted(async () => {
  if (props.modelValue) {
    await Promise.all([
      loadEquipment(),
      loadEmployees(),
      loadTools(),
    ])

    // If editing and reportId is available, load report data
    if (props.reportId) {
      console.log('🔧 Component mounted in edit mode, loading report:', props.reportId)
      await loadReportForEditing()
    }
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
          <span>{{ props.reportId ? 'Editar Reporte de Perforación' : 'Nuevo Reporte de Perforación' }}</span>
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
        v-if="wizardStore.draftLoadedMessage"
        type="info"
        variant="tonal"
        closable
        class="ma-4"
        @click:close="wizardStore.draftLoadedMessage = ''"
      >
        <template #prepend>
          <VIcon icon="tabler-restore" />
        </template>
        {{ wizardStore.draftLoadedMessage }}
      </VAlert>

      <!-- Error Alert -->
      <VAlert
        v-if="wizardStore.errorMessage"
        type="error"
        variant="tonal"
        closable
        class="ma-4"
        prominent
        @click:close="wizardStore.clearError()"
      >
        <template #prepend>
          <VIcon
            icon="tabler-alert-circle"
            size="32"
          />
        </template>
        <VAlertTitle class="text-h6 mb-2">
          {{ wizardStore.errorTitle }}
        </VAlertTitle>
        <div v-if="Object.keys(wizardStore.validationErrors).length > 0">
          <p class="mb-2">
            {{ wizardStore.errorMessage }}
          </p>
          <ul class="ml-4">
            <li
              v-for="(messages, field) in wizardStore.validationErrors"
              :key="field"
              class="text-body-2"
            >
              {{ field.replace(/_/g, ' ').replace(/\.\d+\./g, ' > ') }}:
              <span
                v-for="(msg, idx) in messages"
                :key="idx"
              >
                {{ msg }}<span v-if="idx < messages.length - 1">, </span>
              </span>
            </li>
          </ul>
        </div>
        <p
          v-else
          class="mb-0"
        >
          {{ wizardStore.errorMessage }}
        </p>
      </VAlert>

      <VCardText
        class="pa-0"
        style="max-block-size: 70vh; overflow-y: auto;"
      >
        <VStepper
          v-model="wizardStore.currentStep"
          :items="steps"
          hide-actions
          flat
        >
          <VStepperWindow>
            <!-- Step 1: Información Básica -->
            <VStepperWindowItem value="1">
              <VForm ref="step1Form">
                <WizardBasicInfoMolecule
                  :project-name="projectName"
                  :well-name="wellName"
                  :equipment-options="equipmentOptions"
                  :loading-equipment="loadingEquipment"
                />
              </VForm>
            </VStepperWindowItem>

            <!-- Step 2: Personal -->
            <VStepperWindowItem value="2">
              <VForm ref="step2Form">
                <WizardPersonnelMolecule
                  ref="step2Personnel"
                  :employee-options="employeeOptions"
                  :loading-employees="loadingEmployees"
                />
              </VForm>
            </VStepperWindowItem>

            <!-- Step 3: Actividades -->
            <VStepperWindowItem value="3">
              <WizardActivitiesMolecule />
            </VStepperWindowItem>

            <!-- Step 4: Mediciones Direccionales -->
            <VStepperWindowItem value="4">
              <WizardDirectionalMeasurementsMolecule />
            </VStepperWindowItem>

            <!-- Step 5: Consumos -->
            <VStepperWindowItem value="5">
              <WizardConsumptionsMolecule />
            </VStepperWindowItem>

            <!-- Step 6: Herramientas -->
            <VStepperWindowItem value="6">
              <WizardToolsMolecule
                :tool-options="toolOptions"
                :loading-tools="loadingTools"
                :current-well="detailStore.currentWell"
              />
            </VStepperWindowItem>

            <!-- Step 7: Revisión Final -->
            <VStepperWindowItem value="7">
              <WizardReviewMolecule />
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
          Paso {{ wizardStore.currentStep }} de {{ steps.length }}
        </VChip>
        <VSpacer />
        <VBtn
          v-if="wizardStore.currentStep > '1'"
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
          v-if="wizardStore.currentStep < String(steps.length)"
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
          :disabled="!wizardStore.isFormValid"
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
