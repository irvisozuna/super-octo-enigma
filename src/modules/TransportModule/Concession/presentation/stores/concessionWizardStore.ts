/**
 * Concession Wizard Store - Presentation Layer
 *
 * Pinia store for managing concession wizard state
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AuthorizedService, ConcessionCreateDto, RestrictionItem } from '../../application/dtos/ConcessionDtos'

export interface ConcessionWizardData extends ConcessionCreateDto {

  // Additional wizard-specific data
  validationErrors?: Record<string, string[]>
}

// Helper function to map status from API to wizard format
const mapStatusForWizard = (apiStatus: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'ACTIVE',
    UNDER_REVIEW: 'ACTIVE',
    APPROVED: 'ACTIVE',
    REJECTED: 'SUSPENDED',
    CANCELLED: 'SUSPENDED',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    EXPIRED: 'EXPIRED',
    INACTIVE: 'SUSPENDED',
  }

  return statusMap[apiStatus?.toUpperCase()] || 'ACTIVE'
}

export const useConcessionWizardStore = defineStore('transport-concession-wizard', () => {
  // State
  const wizardData = ref<ConcessionWizardData>({
    holder_id: '',
    number: '',
    modality: 'URBAN',
    municipality: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    status: 'PENDING',
    route_or_site: '',
    authorized_services: [],
    restrictions: [],
    metadata: {},
  })

  const currentStep = ref(0)
  const isInitialized = ref(false)
  const lastSaved = ref<string | null>(null)

  // Step validation states
  const stepValidations = ref<Record<number, boolean>>({
    0: false, // Holder selection
    1: false, // Basic info
    2: false, // Location & service
    3: false, // Validity dates
    4: true, // Services (optional)
    5: true, // Restrictions (optional)
    6: true, // Summary (always valid for review)
  })

  // Computed
  const isValid = computed(() => {
    return Object.values(stepValidations.value).every(valid => valid)
  })

  const completedSteps = computed(() => {
    return Object.entries(stepValidations.value)
      .filter(([_, isValid]) => isValid)
      .map(([step, _]) => Number(step))
  })

  const totalSteps = computed(() => Object.keys(stepValidations.value).length)

  const progress = computed(() => {
    return (completedSteps.value.length / totalSteps.value) * 100
  })

  // Actions
  const initializeWizard = (isEdit: boolean = false, concessionId?: string) => {
    if (isEdit && concessionId) {
      // Load existing concession data
      console.log('Loading concession for edit:', concessionId)

      // Don't generate new number for edit mode
    }
    else {
      // Initialize new concession
      generateConcessionNumber()
    }

    isInitialized.value = true
    autoSave()
  }

  const loadConcessionForEdit = (concessionData: any) => {
    // Helper function to convert date from ISO format to YYYY-MM-DD
    const formatDateForInput = (isoDate: string) => {
      if (!isoDate)
        return ''
      try {
        return new Date(isoDate).toISOString().split('T')[0]
      }
      catch (error) {
        console.warn('Invalid date format:', isoDate)

        return ''
      }
    }

    // Map concession data from API to wizard format
    wizardData.value = {
      holder_id: concessionData.holder_id || '',
      number: concessionData.number || '',
      modality: concessionData.modality || 'URBAN',
      municipality: concessionData.municipality || '',
      valid_from: formatDateForInput(concessionData.valid_from),
      valid_to: formatDateForInput(concessionData.valid_to),
      status: mapStatusForWizard(concessionData.status) || 'ACTIVE',
      route_or_site: concessionData.route_or_site || '',
      authorized_services: concessionData.authorized_services || [] as AuthorizedService[],
      restrictions: concessionData.restrictions || [] as RestrictionItem[],
      metadata: concessionData.metadata || {},
    }

    // Validate all steps after loading data
    validateAllSteps()

    // Auto-save the loaded data
    autoSave()

    console.log('Concession data loaded for editing:', wizardData.value)
    console.log('Mapped dates:', {
      valid_from_original: concessionData.valid_from,
      valid_from_mapped: wizardData.value.valid_from,
      valid_to_original: concessionData.valid_to,
      valid_to_mapped: wizardData.value.valid_to,
    })
  }

  const generateConcessionNumber = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const timestamp = Date.now().toString().slice(-6)

    wizardData.value.number = `CON-${year}${month}${day}-${timestamp}`
  }

  const updateHolderInfo = (holderId: string) => {
    wizardData.value.holder_id = holderId
    validateStep(0)
    autoSave()
  }

  const updateBasicInfo = (data: { number: string; modality: string; status?: string }) => {
    wizardData.value.number = data.number
    wizardData.value.modality = data.modality as any
    if (data.status)
      wizardData.value.status = data.status as any

    validateStep(1)
    autoSave()
  }

  const updateLocationInfo = (data: { municipality: string; route_or_site?: string }) => {
    wizardData.value.municipality = data.municipality
    wizardData.value.route_or_site = data.route_or_site
    validateStep(2)
    autoSave()
  }

  const updateValidityDates = (data: { valid_from: string; valid_to: string }) => {
    wizardData.value.valid_from = data.valid_from
    wizardData.value.valid_to = data.valid_to
    validateStep(3)
    autoSave()
  }

  const updateServices = (services: AuthorizedService[]) => {
    wizardData.value.authorized_services = services
    validateStep(4)
    autoSave()
  }

  const updateRestrictions = (restrictions: RestrictionItem[]) => {
    wizardData.value.restrictions = restrictions
    validateStep(4)
    autoSave()
  }

  const updateMetadata = (metadata: Record<string, any>) => {
    wizardData.value.metadata = { ...wizardData.value.metadata, ...metadata }
    autoSave()
  }

  const validateStep = (stepIndex: number): boolean => {
    let isStepValid = false

    switch (stepIndex) {
      case 0: // Holder selection
        isStepValid = !!wizardData.value.holder_id
        break
      case 1: // Basic info
        isStepValid = !!(wizardData.value.number && wizardData.value.modality)
        break
      case 2: // Location
        isStepValid = !!wizardData.value.municipality
        break
      case 3: // Validity dates
        isStepValid = !!(wizardData.value.valid_from && wizardData.value.valid_to)
        break
      case 4: // Services (optional)
        isStepValid = true
        break
      case 5: // Restrictions (optional)
        isStepValid = true
        break
      case 6: // Summary
        isStepValid = true
        break
      default:
        isStepValid = false
    }

    stepValidations.value[stepIndex] = isStepValid

    return isStepValid
  }

  const validateAllSteps = () => {
    for (let i = 0; i < totalSteps.value; i++)
      validateStep(i)
  }

  const setCurrentStep = (step: number) => {
    if (step >= 0 && step < totalSteps.value)
      currentStep.value = step
  }

  const nextStep = () => {
    if (currentStep.value < totalSteps.value - 1) {
      currentStep.value++
    }
  }

  const previousStep = () => {
    if (currentStep.value > 0) {
      currentStep.value--
    }
  }

  const canNavigateToStep = (stepIndex: number): boolean => {
    if (stepIndex <= currentStep.value)
      return true // Can always go back

    // Check if all previous steps are valid
    for (let i = 0; i < stepIndex; i++) {
      if (!stepValidations.value[i])
        return false
    }

    return true
  }

  const autoSave = () => {
    // Save to localStorage for draft functionality
    const draftKey = `concession_wizard_draft_${wizardData.value.holder_id || 'new'}`
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        data: wizardData.value,
        timestamp: new Date().toISOString(),
        step: currentStep.value,
      }))
      lastSaved.value = new Date().toISOString()
    }
    catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  const loadDraft = (holderId?: string): boolean => {
    const draftKey = `concession_wizard_draft_${holderId || 'new'}`
    try {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        const { data, step } = JSON.parse(draft)

        wizardData.value = data
        currentStep.value = step
        validateAllSteps()

        return true
      }
    }
    catch (error) {
      console.error('Error loading draft:', error)
    }

    return false
  }

  const clearDraft = (holderId?: string) => {
    const draftKey = `concession_wizard_draft_${holderId || 'new'}`
    try {
      localStorage.removeItem(draftKey)
      lastSaved.value = null
    }
    catch (error) {
      console.error('Error clearing draft:', error)
    }
  }

  const resetWizard = () => {
    wizardData.value = {
      holder_id: '',
      number: '',
      modality: 'URBAN',
      municipality: '',
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: '',
      status: 'PENDING',
      route_or_site: '',
      authorized_services: [],
      restrictions: [],
      metadata: {},
    }

    currentStep.value = 0
    stepValidations.value = {
      0: false,
      1: false,
      2: false,
      3: false,
      4: true,
      5: true,
      6: true,
    }

    generateConcessionNumber()
    autoSave()
  }

  return {
    // State
    wizardData,
    currentStep,
    isInitialized,
    lastSaved,
    stepValidations,

    // Computed
    isValid,
    completedSteps,
    totalSteps,
    progress,

    // Actions
    initializeWizard,
    loadConcessionForEdit,
    generateConcessionNumber,
    updateHolderInfo,
    updateBasicInfo,
    updateLocationInfo,
    updateValidityDates,
    updateServices,
    updateRestrictions,
    updateMetadata,
    validateStep,
    validateAllSteps,
    setCurrentStep,
    nextStep,
    previousStep,
    canNavigateToStep,
    autoSave,
    loadDraft,
    clearDraft,
    resetWizard,
  }
})
