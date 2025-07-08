import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

interface WizardData {
  basicInfo: {
    name: string
    description: string
    dataSourceId: string
    isActive: boolean
    isPublic: boolean
  }
  selectedFields: any[]
  filters: any[]
  sorting: {
    primary: { field: string; direction: 'ASC' | 'DESC' }
    secondary?: { field: string; direction: 'ASC' | 'DESC' }
    tertiary?: { field: string; direction: 'ASC' | 'DESC' }
    nullsHandling: 'FIRST' | 'LAST'
    caseSensitive: boolean
  }
  exportOptions: {
    excel: {
      enabled: boolean
      includeCharts: boolean
      autoFilter: boolean
      includeHeaders: boolean
      includeTotals: boolean
    }
    pdf: {
      enabled: boolean
      orientation: 'portrait' | 'landscape'
      pageSize: 'A4' | 'A3' | 'Letter'
      margins: number
      includeHeaders: boolean
      includeTotals: boolean
    }
    csv: {
      enabled: boolean
      delimiter: string
      encoding: 'UTF-8' | 'ISO-8859-1'
      includeHeaders: boolean
    }
    general: {
      filenameTemplate: string
      compressionLevel: 'none' | 'low' | 'medium' | 'high'
    }
  }
  advanced: {
    columns: any[]
    footer: {
      enabled: boolean
      showTotals: boolean
      showSubtotals: boolean
      showCount: boolean
      showAverage: boolean
      showMin: boolean
      showMax: boolean
      customText: string
    }
    display: {
      showGridLines: boolean
      showAlternateRows: boolean
      alternateRowColor: string
      headerStyle: 'default' | 'bold' | 'colored'
      rowHeight: number
      maxRowsPerPage: number
      enablePagination: boolean
    }
    grouping: {
      enabled: boolean
      showGroupHeaders: boolean
      showGroupFooters: boolean
      collapseGroups: boolean
      groupByFields: any[]
    }
    styling: {
      theme: 'default' | 'dark' | 'light' | 'custom'
      primaryColor: string
      secondaryColor: string
      fontFamily: string
      fontSize: number
    }
  }
}

const stepCount = 7 // Number of steps in the wizard

const defaultWizardData: WizardData = {
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
    secondary: undefined,
    tertiary: undefined,
    nullsHandling: 'LAST',
    caseSensitive: false,
  },
  exportOptions: {
    excel: {
      enabled: true,
      includeCharts: false,
      autoFilter: true,
      includeHeaders: true,
      includeTotals: true,
    },
    pdf: {
      enabled: true,
      orientation: 'portrait',
      pageSize: 'A4',
      margins: 10,
      includeHeaders: true,
      includeTotals: true,
    },
    csv: {
      enabled: true,
      delimiter: ',',
      encoding: 'UTF-8',
      includeHeaders: true,
    },
    general: {
      filenameTemplate: 'report_{date}_{time}',
      compressionLevel: 'medium',
    },
  },
  advanced: {
    columns: [],
    footer: {
      enabled: true,
      showTotals: true,
      showSubtotals: false,
      showCount: true,
      showAverage: false,
      showMin: false,
      showMax: false,
      customText: '',
    },
    display: {
      showGridLines: true,
      showAlternateRows: true,
      alternateRowColor: '#f5f5f5',
      headerStyle: 'default',
      rowHeight: 40,
      maxRowsPerPage: 50,
      enablePagination: true,
    },
    grouping: {
      enabled: false,
      showGroupHeaders: true,
      showGroupFooters: true,
      collapseGroups: false,
      groupByFields: [],
    },
    styling: {
      theme: 'default',
      primaryColor: '#1976d2',
      secondaryColor: '#424242',
      fontFamily: 'Arial',
      fontSize: 12,
    },
  },
}

export const useReportWizardStore = defineStore('reportWizard', () => {
  // State
  const wizardData = ref<WizardData>(JSON.parse(JSON.stringify(defaultWizardData)))
  const currentStep = ref(0) // Use number index
  const isEditing = ref(false)
  const reportId = ref<string | null>(null)
  const lastSaved = ref<Date | null>(null)
  const hasUnsavedChanges = ref(false)
  const autoSaveEnabled = ref(true)
  const isTransitioning = ref(false)

  // Debounce timer for auto-save
  let saveTimer: NodeJS.Timeout | null = null

  // Computed
  const isFirstStep = computed(() => currentStep.value === 0)
  const isLastStep = computed(() => currentStep.value === stepCount - 1)
  const currentStepIndex = computed(() => currentStep.value)

  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 0:
        return wizardData.value.basicInfo.name.trim() !== '' && wizardData.value.basicInfo.dataSourceId !== ''
      case 1:
        return Array.isArray(wizardData.value.selectedFields) && wizardData.value.selectedFields.length > 0
      default:
        return true
    }
  })

  // Auto-save functionality with debounce
  const saveToLocalStorage = () => {
    if (!autoSaveEnabled.value)
      return

    // Clear existing timer
    if (saveTimer)
      clearTimeout(saveTimer)

    // Set new timer
    saveTimer = setTimeout(() => {
      const saveData = {
        wizardData: wizardData.value,
        currentStep: currentStep.value,
        isEditing: isEditing.value,
        reportId: reportId.value,
        timestamp: new Date().toISOString(),
      }

      try {
        localStorage.setItem('reportWizardProgress', JSON.stringify(saveData))
        lastSaved.value = new Date()
        hasUnsavedChanges.value = false
      }
      catch (error) {
        console.error('Error saving wizard progress:', error)
      }
    }, 500) // Debounce for 500ms
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('reportWizardProgress')
      if (saved) {
        const data = JSON.parse(saved)

        wizardData.value = data.wizardData
        currentStep.value = data.currentStep
        isEditing.value = data.isEditing
        reportId.value = data.reportId
        lastSaved.value = new Date(data.timestamp)
        hasUnsavedChanges.value = false

        return true
      }
    }
    catch (error) {
      console.error('Error loading wizard progress:', error)
    }

    return false
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('reportWizardProgress')
    lastSaved.value = null
    hasUnsavedChanges.value = false

    // Clear save timer
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  }

  // Actions
  const initializeWizard = (editMode = false, existingReportId?: string) => {
    isEditing.value = editMode
    reportId.value = existingReportId || null

    if (editMode && existingReportId) {
      // Load existing report data
      console.log('Loading existing report for editing:', existingReportId)
    }
    else {
      // Check for saved progress
      const hasProgress = loadFromLocalStorage()
      if (!hasProgress) {
        // Start fresh
        resetWizard()
      }
    }
  }

  const resetWizard = () => {
    wizardData.value = JSON.parse(JSON.stringify(defaultWizardData))
    currentStep.value = 0
    isEditing.value = false
    reportId.value = null
    lastSaved.value = null
    hasUnsavedChanges.value = false
    isTransitioning.value = false
    clearLocalStorage()
  }

  // NEW METHOD: Set current step with validation
  const setCurrentStep = (step: number) => {
    if (typeof step !== 'number' || step < 0 || step >= stepCount)
      return

    // Only allow going back or staying on the same step
    if (step > currentStep.value)
      return
    if (currentStep.value === step)
      return
    currentStep.value = step
    hasUnsavedChanges.value = true
    saveToLocalStorage()
  }

  // Updated navigation methods
  const nextStep = () => {
    if (isTransitioning.value)
      return
    if (currentStep.value < stepCount - 1 && canProceed.value) {
      isTransitioning.value = true

      const newStep = currentStep.value + 1
      if (currentStep.value !== newStep) {
        currentStep.value = newStep
        hasUnsavedChanges.value = true
        saveToLocalStorage()
      }
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    }
  }

  const previousStep = () => {
    if (isTransitioning.value)
      return
    if (currentStep.value > 0) {
      isTransitioning.value = true

      const newStep = currentStep.value - 1
      if (currentStep.value !== newStep) {
        currentStep.value = newStep
        hasUnsavedChanges.value = true
        saveToLocalStorage()
      }
      setTimeout(() => {
        isTransitioning.value = false
      }, 300)
    }
  }

  const goToStep = (step: number) => {
    if (typeof step !== 'number' || step < 0 || step >= stepCount)
      return
    if (currentStep.value === step)
      return
    if (isTransitioning.value)
      return
    isTransitioning.value = true

    const previousStep = currentStep.value

    currentStep.value = step
    if (previousStep !== step) {
      hasUnsavedChanges.value = true
      saveToLocalStorage()
    }
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }

  const updateWizardData = (section: keyof WizardData, data: any) => {
    // Prevent unnecessary updates by checking if data actually changed
    const currentSection = wizardData.value[section]
    const newSection = { ...currentSection, ...data }

    if (JSON.stringify(currentSection) !== JSON.stringify(newSection)) {
      wizardData.value[section] = newSection
      hasUnsavedChanges.value = true
      saveToLocalStorage()
    }
  }

  const updateBasicInfo = (data: Partial<WizardData['basicInfo']>) => {
    updateWizardData('basicInfo', data)
  }

  const updateSelectedFields = (fields: any[]) => {
    // Prevent unnecessary updates by checking if array actually changed
    if (JSON.stringify(wizardData.value.selectedFields) !== JSON.stringify(fields)) {
      wizardData.value.selectedFields = fields
      hasUnsavedChanges.value = true
      saveToLocalStorage()
    }
  }

  const updateFilters = (filters: any[]) => {
    // Prevent unnecessary updates by checking if array actually changed
    if (JSON.stringify(wizardData.value.filters) !== JSON.stringify(filters)) {
      wizardData.value.filters = filters
      hasUnsavedChanges.value = true
      saveToLocalStorage()
    }
  }

  const updateSorting = (sorting: WizardData['sorting']) => {
    // Prevent unnecessary updates by checking if object actually changed
    if (JSON.stringify(wizardData.value.sorting) !== JSON.stringify(sorting)) {
      wizardData.value.sorting = sorting
      hasUnsavedChanges.value = true
      saveToLocalStorage()
    }
  }

  const updateExportOptions = (options: WizardData['exportOptions']) => {
    // Prevent unnecessary updates by checking if object actually changed
    if (JSON.stringify(wizardData.value.exportOptions) !== JSON.stringify(options)) {
      wizardData.value.exportOptions = options
      hasUnsavedChanges.value = true
      saveToLocalStorage()
    }
  }

  const updateAdvanced = (advanced: WizardData['advanced']) => {
    // Prevent unnecessary updates by checking if object actually changed
    if (JSON.stringify(wizardData.value.advanced) !== JSON.stringify(advanced)) {
      wizardData.value.advanced = advanced
      hasUnsavedChanges.value = true
      saveToLocalStorage()
    }
  }

  const getWizardData = () => {
    return wizardData.value
  }

  const setAutoSave = (enabled: boolean) => {
    autoSaveEnabled.value = enabled
    if (enabled)
      saveToLocalStorage()
  }

  // Watch for changes to auto-save with debounce - FIXED to prevent infinite loops
  let watchTimer: NodeJS.Timeout | null = null
  let isSaving = false // Prevent recursive saves

  watch(wizardData, () => {
    if (autoSaveEnabled.value && !isSaving) {
      hasUnsavedChanges.value = true

      // Clear existing timer
      if (watchTimer)
        clearTimeout(watchTimer)

      // Set new timer
      watchTimer = setTimeout(() => {
        if (!isSaving) {
          isSaving = true
          saveToLocalStorage()
          isSaving = false
        }
      }, 1000) // Debounce for 1 second
    }
  }, { deep: true })

  // Cleanup function
  const cleanup = () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (watchTimer) {
      clearTimeout(watchTimer)
      watchTimer = null
    }
    isSaving = false
  }

  return {
    // State
    wizardData,
    currentStep,
    isEditing,
    reportId,
    lastSaved,
    hasUnsavedChanges,
    autoSaveEnabled,
    isTransitioning,

    // Computed
    isFirstStep,
    isLastStep,
    canProceed,
    currentStepIndex,

    // Actions
    initializeWizard,
    resetWizard,
    setCurrentStep,
    nextStep,
    previousStep,
    goToStep,
    updateWizardData,
    updateBasicInfo,
    updateSelectedFields,
    updateFilters,
    updateSorting,
    updateExportOptions,
    updateAdvanced,
    getWizardData,
    setAutoSave,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    cleanup,
  }
})
