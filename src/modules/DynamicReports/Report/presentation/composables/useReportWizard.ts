import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Report } from '../../domain/entities/Report'

export interface WizardStep {
  id: number
  title: string
  description: string
  icon: string
  isValid: boolean
  isCompleted: boolean
}

export interface ReportWizardData {

  // Paso 1: Información Básica
  basicInfo: {
    name: string
    description: string
    dataSourceId: string
    isActive: boolean
    isPublic: boolean
  }

  // Paso 2: Selección de Campos
  selectedFields: Array<{
    field: string
    alias: string
    format: 'text' | 'number' | 'currency' | 'date' | 'datetime'
    width: number
    aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
    sortable: boolean
    filterable: boolean
    order: number
  }>

  // Paso 3: Configuración de Filtros
  filters: Array<{
    id: string
    field: string
    type: 'text' | 'number' | 'date' | 'select' | 'range'
    operator: string
    defaultValue: any
    required: boolean
    placeholder: string
    options?: Array<{ value: any; label: string }>
  }>

  // Paso 4: Ordenamiento
  sorting: {
    primary: { field: string; direction: 'ASC' | 'DESC' }
    secondary?: { field: string; direction: 'ASC' | 'DESC' }
    tertiary?: { field: string; direction: 'ASC' | 'DESC' }
  }

  // Paso 5: Opciones de Exportación
  exportOptions: {
    excel: {
      enabled: boolean
      includeCharts: boolean
      autoFilter: boolean
    }
    pdf: {
      enabled: boolean
      orientation: 'portrait' | 'landscape'
      pageSize: 'A4' | 'A3' | 'Letter'
      margins: number
    }
    csv: {
      enabled: boolean
      delimiter: string
      encoding: 'UTF-8' | 'ISO-8859-1'
    }
  }

  // Paso 6: Permisos y Metadatos
  metadata: {
    permissions: string[]
    tags: string[]
    department: string
    category: string
    cacheEnabled: boolean
    cacheDuration: number
  }
}

export const useReportWizard = (initialData?: Partial<ReportWizardData>) => {
  const { t } = useI18n()

  // Estado del wizard
  const currentStep = ref(1)
  const isSubmitting = ref(false)

  const wizardData = ref<ReportWizardData>({
    basicInfo: {
      name: '',
      description: '',
      dataSourceId: '',
      isActive: true,
      isPublic: false,
    },
    selectedFields: [],
    filters: [],
    sorting: {
      primary: { field: '', direction: 'ASC' },
    },
    exportOptions: {
      excel: { enabled: true, includeCharts: false, autoFilter: true },
      pdf: { enabled: true, orientation: 'portrait', pageSize: 'A4', margins: 10 },
      csv: { enabled: true, delimiter: ',', encoding: 'UTF-8' },
    },
    metadata: {
      permissions: [],
      tags: [],
      department: '',
      category: '',
      cacheEnabled: false,
      cacheDuration: 3600,
    },
    ...initialData,
  })

  // Definición de pasos
  const steps: WizardStep[] = [
    {
      id: 1,
      title: t('DynamicReports.report.wizard.step1.title'),
      description: t('DynamicReports.report.wizard.step1.description'),
      icon: 'tabler-info-circle',
      isValid: false,
      isCompleted: false,
    },
    {
      id: 2,
      title: t('DynamicReports.report.wizard.step2.title'),
      description: t('DynamicReports.report.wizard.step2.description'),
      icon: 'tabler-columns',
      isValid: false,
      isCompleted: false,
    },
    {
      id: 3,
      title: t('DynamicReports.report.wizard.step3.title'),
      description: t('DynamicReports.report.wizard.step3.description'),
      icon: 'tabler-filter',
      isValid: false,
      isCompleted: false,
    },
    {
      id: 4,
      title: t('DynamicReports.report.wizard.step4.title'),
      description: t('DynamicReports.report.wizard.step4.description'),
      icon: 'tabler-sort-ascending',
      isValid: false,
      isCompleted: false,
    },
    {
      id: 5,
      title: t('DynamicReports.report.wizard.step5.title'),
      description: t('DynamicReports.report.wizard.step5.description'),
      icon: 'tabler-download',
      isValid: false,
      isCompleted: false,
    },
    {
      id: 6,
      title: t('DynamicReports.report.wizard.step6.title'),
      description: t('DynamicReports.report.wizard.step6.description'),
      icon: 'tabler-settings',
      isValid: false,
      isCompleted: false,
    },
  ]

  // Validaciones por paso
  const validateStep1 = () => {
    const { name, dataSourceId } = wizardData.value.basicInfo

    return name.trim().length > 0 && dataSourceId.trim().length > 0
  }

  const validateStep2 = () => {
    return wizardData.value.selectedFields.length > 0
  }

  const validateStep3 = () => {
    // Los filtros son opcionales
    return true
  }

  const validateStep4 = () => {
    const { primary } = wizardData.value.sorting

    return primary.field.trim().length > 0
  }

  const validateStep5 = () => {
    const { excel, pdf, csv } = wizardData.value.exportOptions

    return excel.enabled || pdf.enabled || csv.enabled
  }

  const validateStep6 = () => {
    // Los metadatos son opcionales
    return true
  }

  // Validación del paso actual
  const currentStepValidation = computed(() => {
    switch (currentStep.value) {
      case 1: return validateStep1()
      case 2: return validateStep2()
      case 3: return validateStep3()
      case 4: return validateStep4()
      case 5: return validateStep5()
      case 6: return validateStep6()
      default: return false
    }
  })

  // Navegación
  const nextStep = () => {
    if (currentStepValidation.value && currentStep.value < steps.length) {
      steps[currentStep.value - 1].isCompleted = true
      currentStep.value++
    }
  }

  const previousStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  const goToStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= steps.length)
      currentStep.value = stepNumber
  }

  // Actualizar validación de pasos
  const updateStepValidation = () => {
    steps[0].isValid = validateStep1()
    steps[1].isValid = validateStep2()
    steps[2].isValid = validateStep3()
    steps[3].isValid = validateStep4()
    steps[4].isValid = validateStep5()
    steps[5].isValid = validateStep6()
  }

  // Observar cambios en los datos para actualizar validación
  watch(wizardData, updateStepValidation, { deep: true })

  // Métodos para manipular datos
  const addField = (field: any) => {
    const newField = {
      field: field.name,
      alias: field.label || field.name,
      format: 'text' as const,
      width: 150,
      sortable: true,
      filterable: true,
      order: wizardData.value.selectedFields.length,
    }

    wizardData.value.selectedFields.push(newField)
  }

  const removeField = (index: number) => {
    wizardData.value.selectedFields.splice(index, 1)

    // Reordenar
    wizardData.value.selectedFields.forEach((field, idx) => {
      field.order = idx
    })
  }

  const addFilter = () => {
    const newFilter = {
      id: `filter_${Date.now()}`,
      field: '',
      type: 'text' as const,
      operator: '=',
      defaultValue: '',
      required: false,
      placeholder: '',
    }

    wizardData.value.filters.push(newFilter)
  }

  const removeFilter = (index: number) => {
    wizardData.value.filters.splice(index, 1)
  }

  const submitWizard = async () => {
    isSubmitting.value = true
    try {
      // Aquí se enviaría la data al store o API
      return {
        ...wizardData.value.basicInfo,
        configuration: {
          fields: wizardData.value.selectedFields,
          filters: wizardData.value.filters,
          sorting: wizardData.value.sorting,
          exportOptions: wizardData.value.exportOptions,
          metadata: wizardData.value.metadata,
        },
      }
    }
    finally {
      isSubmitting.value = false
    }
  }

  // Computed properties
  const canGoNext = computed(() => currentStepValidation.value)
  const canGoPrevious = computed(() => currentStep.value > 1)
  const isFirstStep = computed(() => currentStep.value === 1)
  const isLastStep = computed(() => currentStep.value === steps.length)
  const progressPercentage = computed(() => (currentStep.value / steps.length) * 100)

  return {
    // State
    currentStep: readonly(currentStep),
    isSubmitting: readonly(isSubmitting),
    wizardData,
    steps,

    // Computed
    currentStepValidation,
    canGoNext,
    canGoPrevious,
    isFirstStep,
    isLastStep,
    progressPercentage,

    // Methods
    nextStep,
    previousStep,
    goToStep,
    addField,
    removeField,
    addFilter,
    removeFilter,
    submitWizard,
    updateStepValidation,
  }
}
