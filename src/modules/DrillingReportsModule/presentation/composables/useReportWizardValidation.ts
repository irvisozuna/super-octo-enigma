import { ref } from 'vue'
import type { Ref } from 'vue'
import { useReportWizardStore } from '../stores/reportWizardStore'

export const useReportWizardValidation = () => {
  const wizardStore = useReportWizardStore()
  const step1Form = ref()
  const step2Form = ref()
  const step3Form = ref()
  const step4Form = ref()
  const step5Form = ref()
  const step6Form = ref()
  const step7Form = ref()

  const validateStep = async (stepNumber: number): Promise<boolean> => {
    let formRef: Ref<any> | null = null

    switch (stepNumber) {
      case 1:
        formRef = step1Form
        break
      case 2:
        formRef = step2Form
        break
      case 3:
      // Step 3 (Activities) uses computed validation from store
        return wizardStore.isActivitiesStepValid
      case 4:
      // Step 4 (Directional Measurements) uses computed validation from store
        return wizardStore.isDirectionalMeasurementsStepValid
      case 5:
        formRef = step5Form
        break
      case 6:
      // Step 6 (Tools) uses computed validation from store
        return wizardStore.isToolGroupsStepValid
      case 7:
      // Step 7 (Review) is always valid
        return true
      default:
        return true
    }

    if (!formRef?.value)
      return true

    try {
      const { valid } = await formRef.value.validate()

      return valid
    }
    catch (error) {
      console.error(`Error validating step ${stepNumber}:`, error)

      return false
    }
  }

  const validateAllSteps = async (): Promise<boolean> => {
    const results = await Promise.all([
      validateStep(1),
      validateStep(2),
      validateStep(3),
      validateStep(4),
      validateStep(5),
      validateStep(6),
      validateStep(7),
    ])

    return results.every(valid => valid)
  }

  const resetValidation = () => {
    step1Form.value?.resetValidation()
    step2Form.value?.resetValidation()
    step3Form.value?.resetValidation()
    step4Form.value?.resetValidation()
    step5Form.value?.resetValidation()
    step6Form.value?.resetValidation()
    step7Form.value?.resetValidation()
  }

  return {
    // Form refs
    step1Form,
    step2Form,
    step3Form,
    step4Form,
    step5Form,
    step6Form,
    step7Form,

    // Validation methods
    validateStep,
    validateAllSteps,
    resetValidation,
  }
}
