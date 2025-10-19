import { ref } from 'vue'
import type { Ref } from 'vue'

export const useReportWizardValidation = () => {
  const step1Form = ref()
  const step2Form = ref()
  const step3Form = ref()
  const step4Form = ref()
  const step5Form = ref()

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
        formRef = step3Form
        break
      case 4:
        formRef = step4Form
        break
      case 5:
        formRef = step5Form
        break
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
    ])

    return results.every(valid => valid)
  }

  const resetValidation = () => {
    step1Form.value?.resetValidation()
    step2Form.value?.resetValidation()
    step3Form.value?.resetValidation()
    step4Form.value?.resetValidation()
    step5Form.value?.resetValidation()
  }

  return {
    // Form refs
    step1Form,
    step2Form,
    step3Form,
    step4Form,
    step5Form,

    // Validation methods
    validateStep,
    validateAllSteps,
    resetValidation,
  }
}
