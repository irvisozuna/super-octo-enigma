import { computed, watch } from 'vue'
import { useReportWizardStore } from '../stores/reportWizardStore'
import { useReportWizardData } from './useReportWizardData'
import { useReportWizardValidation } from './useReportWizardValidation'
import { useReportWizardErrorHandler } from './useReportWizardErrorHandler'

export interface UseReportWizardProps {
  projectId: string
  wellId: string
  modelValue: boolean
  error?: string | null
}

export const useReportWizard = (props: UseReportWizardProps) => {
  const wizardStore = useReportWizardStore()
  const dataHandlers = useReportWizardData()
  const validation = useReportWizardValidation()
  const errorHandler = useReportWizardErrorHandler()

  // Initialize wizard when opened
  const initializeWizard = async () => {
    wizardStore.setStep('1')

    // Load all data in parallel
    await dataHandlers.loadAllData()

    // Try to load draft
    const draftLoaded = wizardStore.loadDraft(props.projectId, props.wellId)

    if (!draftLoaded) {
      // Initialize with default values if no draft
      wizardStore.resetForm()
    }
  }

  // Handle next step navigation
  const handleNextStep = async () => {
    const currentStepNum = Number.parseInt(wizardStore.currentStep)
    const isValid = await validation.validateStep(currentStepNum)

    if (!isValid) {
      console.log(`❌ Step ${currentStepNum} validation failed`)

      return false
    }

    wizardStore.nextStep()

    return true
  }

  // Handle previous step navigation
  const handlePreviousStep = () => {
    wizardStore.previousStep()
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all steps before submission
    const isValid = await validation.validateAllSteps()

    if (!isValid) {
      errorHandler.setCustomError(
        'Validación Incompleta',
        'Por favor revisa que todos los campos requeridos estén completos',
      )

      return null
    }

    // Prepare data for submission
    return {
      project_id: props.projectId,
      well_id: props.wellId,
      ...wizardStore.formData,
    }
  }

  // Handle wizard cancellation
  const handleCancel = () => {
    wizardStore.clearDraft(props.projectId, props.wellId)
    wizardStore.resetForm()
    validation.resetValidation()
    errorHandler.clearError()
  }

  // Handle success (called from parent)
  const handleSuccess = () => {
    wizardStore.clearDraft(props.projectId, props.wellId)
    wizardStore.resetForm()
    validation.resetValidation()
    errorHandler.clearError()
  }

  // Watch for dialog open/close
  watch(() => props.modelValue, async newValue => {
    if (newValue)
      await initializeWizard()
  })

  // Auto-save draft on changes
  watch(
    () => wizardStore.formData,
    () => {
      if (props.modelValue && wizardStore.isDirty)
        wizardStore.saveDraft(props.projectId, props.wellId)
    },
    { deep: true },
  )

  // Watch for errors from parent
  watch(() => props.error, newError => {
    if (newError)
      errorHandler.handleError(newError)
  })

  return {
    // Store
    wizardStore,

    // Data handlers
    ...dataHandlers,

    // Validation
    ...validation,

    // Navigation
    handleNextStep,
    handlePreviousStep,

    // Actions
    handleSubmit,
    handleCancel,
    handleSuccess,

    // Error handling
    ...errorHandler,

    // Computed properties
    currentStep: computed(() => wizardStore.currentStep),
    formData: computed(() => wizardStore.formData),
    isFormValid: computed(() => wizardStore.isFormValid),
    isDirty: computed(() => wizardStore.isDirty),
    showDayShift: computed(() => wizardStore.showDayShift),
    showNightShift: computed(() => wizardStore.showNightShift),
    totalHoursWorked: computed(() => wizardStore.totalHoursWorked),
    calculatedHorometerEnd: computed(() => wizardStore.calculatedHorometerEnd),
  }
}
