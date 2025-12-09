import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Ref } from 'vue'

interface PersonnelData {
  operator_day_id: string | null
  helper_day_ids: string[]
  operator_night_id: string | null
  helper_night_ids: string[]
  horometer_start_day: number | null
  horometer_start_night: number | null
  horometer_end_day: number | null
  horometer_end_night: number | null
  rpm_pull_down: number | null
  rpm_rotation: number | null
}

interface Activity {
  activity_type: string
  shift: string
  hours: number
  start_time: string
  end_time: string
  description: string
}

interface Consumption {
  consumable_type: string
  shift: string
  quantity: number
  unit: string
}

interface ToolAssignment {
  tool_id: string | null
  shift: string
  tool_category: string
  start_depth_meters: number
  end_depth_meters: number
  wear_pattern: string
  matrix: string
}

export interface ReportWizardData extends PersonnelData {
  report_date: string
  shift: string
  equipment_id: string | null
  observations: string
  activities: Activity[]
  consumptions: Consumption[]
  tool_assignments: ToolAssignment[]
}

interface WizardState {
  currentStep: Ref<string>
  formData: Ref<ReportWizardData>
  isDirty: Ref<boolean>
  validationErrors: Ref<Record<string, string[]>>
  isLoading: Ref<boolean>
  errorMessage: Ref<string>
  errorTitle: Ref<string>
  draftLoadedMessage: Ref<string>
}

export const useReportWizardStore = defineStore('reportWizard', () => {
  // State
  const currentStep = ref('1')
  const isDirty = ref(false)
  const validationErrors = ref<Record<string, string[]>>({})
  const isLoading = ref(false)
  const errorMessage = ref('')
  const errorTitle = ref('Error')
  const draftLoadedMessage = ref('')

  const formData = ref<ReportWizardData>({
    report_date: new Date().toISOString().split('T')[0],
    shift: 'day',
    equipment_id: null,
    operator_day_id: null,
    helper_day_ids: [],
    operator_night_id: null,
    helper_night_ids: [],
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
  })

  // Computed
  const showDayShift = computed(() =>
    formData.value.shift === 'day' || formData.value.shift === 'mixed',
  )

  const showNightShift = computed(() =>
    formData.value.shift === 'night' || formData.value.shift === 'mixed',
  )

  const totalHoursWorked = computed(() =>
    formData.value.activities.reduce((sum, act) => sum + (act.hours || 0), 0),
  )

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

  // Validation for activities step
  const isActivitiesStepValid = computed(() => {
    // Must have at least one activity
    if (formData.value.activities.length === 0)
      return false

    // All activities must have required fields
    return formData.value.activities.every(activity =>
      activity.activity_type
      && activity.shift
      && activity.hours !== null
      && activity.hours > 0,
    )
  })

  // Validation for tools step
  const isToolsStepValid = computed(() => {
    // Tools are optional - if no tools added, step is valid
    if (formData.value.tool_assignments.length === 0)
      return true

    // All tools must have required fields
    return formData.value.tool_assignments.every(tool =>
      tool.tool_id
      && tool.tool_category
      && tool.shift
      && tool.start_depth_meters !== null
      && tool.end_depth_meters !== null
      && tool.end_depth_meters > tool.start_depth_meters,
    )
  })

  const availableShiftOptions = computed(() => {
    // Si el turno del reporte es "mixed", solo mostrar "day" y "night"
    if (formData.value.shift === 'mixed') {
      return [
        { value: 'day', title: 'Día' },
        { value: 'night', title: 'Noche' },
      ]
    }

    // Si el turno del reporte es específico (day/night), solo mostrar ese turno
    return [
      { value: formData.value.shift, title: formData.value.shift === 'day' ? 'Día' : 'Noche' },
    ]
  })

  // Actions
  const setStep = (step: string) => {
    currentStep.value = step
  }

  const nextStep = () => {
    const steps = ['1', '2', '3', '4', '5', '6']
    const currentIndex = steps.indexOf(currentStep.value)
    if (currentIndex < steps.length - 1)
      currentStep.value = steps[currentIndex + 1]
  }

  const previousStep = () => {
    const steps = ['1', '2', '3', '4', '5', '6']
    const currentIndex = steps.indexOf(currentStep.value)
    if (currentIndex > 0)
      currentStep.value = steps[currentIndex - 1]
  }

  const updateFormData = (data: Partial<ReportWizardData>) => {
    formData.value = { ...formData.value, ...data }
    isDirty.value = true
  }

  const resetForm = () => {
    // Reset all form data to initial values
    formData.value = {
      report_date: new Date().toISOString().split('T')[0],
      shift: 'day',
      equipment_id: null,
      operator_day_id: null,
      helper_day_ids: [],
      operator_night_id: null,
      helper_night_ids: [],
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

    // Reset wizard state
    currentStep.value = '1'
    isDirty.value = false
    draftLoadedMessage.value = ''

    // Clear all errors
    clearError()
  }

  const clearError = () => {
    errorMessage.value = ''
    errorTitle.value = 'Error'
    validationErrors.value = {}
  }

  const setError = (title: string, message: string, errors: Record<string, string[]> = {}) => {
    errorTitle.value = title
    errorMessage.value = message
    validationErrors.value = errors
  }

  // Activity Management
  const addActivity = (activity?: Partial<Activity>) => {
    const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift

    formData.value.activities.push({
      activity_type: activity?.activity_type || 'drilling',
      shift: activity?.shift || defaultShift,
      hours: activity?.hours || 1,
      start_time: activity?.start_time || '',
      end_time: activity?.end_time || '',
      description: activity?.description || '',
    })
    isDirty.value = true
  }

  const removeActivity = (index: number) => {
    formData.value.activities.splice(index, 1)
    isDirty.value = true
  }

  const updateActivity = (index: number, activity: Partial<Activity>) => {
    formData.value.activities[index] = {
      ...formData.value.activities[index],
      ...activity,
    }
    isDirty.value = true
  }

  // Time calculation functions
  const calculateEndTime = (startTime: string, hours: number): string => {
    if (!startTime || !hours)
      return ''

    const [hoursStr, minutesStr] = startTime.split(':')
    const startDate = new Date()

    startDate.setHours(Number.parseInt(hoursStr), Number.parseInt(minutesStr), 0, 0)

    const endDate = new Date(startDate.getTime() + (hours * 60 * 60 * 1000))

    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  }

  const calculateHoursFromTimes = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime)
      return 0

    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)

    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes

    // Handle case where end time is next day
    let diffMinutes = endTotalMinutes - startTotalMinutes
    if (diffMinutes < 0)
      diffMinutes += 24 * 60 // Add 24 hours

    return diffMinutes / 60
  }

  const updateActivityWithTimeCalculation = (index: number, field: string, value: any) => {
    const activity = formData.value.activities[index]
    const updatedActivity = { ...activity, [field]: value }

    // If updating hours and we have start time, calculate end time
    if (field === 'hours' && value && activity.start_time)
      updatedActivity.end_time = calculateEndTime(activity.start_time, value)

    // If updating start time and we have hours, calculate end time
    if (field === 'start_time' && value && activity.hours)
      updatedActivity.end_time = calculateEndTime(value, activity.hours)

    // If updating end time, calculate hours
    if (field === 'end_time' && value && activity.start_time)
      updatedActivity.hours = calculateHoursFromTimes(activity.start_time, value)

    // If updating start time and we have end time, calculate hours
    if (field === 'start_time' && value && activity.end_time)
      updatedActivity.hours = calculateHoursFromTimes(value, activity.end_time)

    updateActivity(index, updatedActivity)
  }

  // Consumption Management
  const addConsumption = (consumption?: Partial<Consumption>) => {
    const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift

    formData.value.consumptions.push({
      consumable_type: consumption?.consumable_type || 'bentonite',
      shift: consumption?.shift || defaultShift,
      quantity: consumption?.quantity || 1,
      unit: consumption?.unit || 'bags',
    })
    isDirty.value = true
  }

  const removeConsumption = (index: number) => {
    formData.value.consumptions.splice(index, 1)
    isDirty.value = true
  }

  const updateConsumption = (index: number, consumption: Partial<Consumption>) => {
    formData.value.consumptions[index] = {
      ...formData.value.consumptions[index],
      ...consumption,
    }
    isDirty.value = true
  }

  // Tool Assignment Management
  const addToolAssignment = (tool?: Partial<ToolAssignment>) => {
    const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift
    const lastDepth = getLastDepth()

    formData.value.tool_assignments.push({
      tool_id: tool?.tool_id || null,
      shift: tool?.shift || defaultShift,
      tool_category: tool?.tool_category || 'diamond_bit',
      start_depth_meters: tool?.start_depth_meters || lastDepth,
      end_depth_meters: tool?.end_depth_meters || lastDepth,
      wear_pattern: tool?.wear_pattern || '',
      matrix: tool?.matrix || '',
    })
    isDirty.value = true
  }

  const removeToolAssignment = (index: number) => {
    formData.value.tool_assignments.splice(index, 1)
    isDirty.value = true
  }

  const updateToolAssignment = (index: number, tool: Partial<ToolAssignment>) => {
    formData.value.tool_assignments[index] = {
      ...formData.value.tool_assignments[index],
      ...tool,
    }
    isDirty.value = true
  }

  const getLastDepth = () => {
    if (formData.value.tool_assignments.length === 0)
      return 0
    const lastTool = formData.value.tool_assignments[formData.value.tool_assignments.length - 1]

    return lastTool.end_depth_meters || 0
  }

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

    isDirty.value = true
  }

  // Draft Management
  const saveDraft = (projectId: string, wellId: string) => {
    try {
      const draftKey = `report_draft_${projectId}_${wellId}`

      const draft = {
        formData: formData.value,
        currentStep: currentStep.value,
        timestamp: new Date().toISOString(),
      }

      localStorage.setItem(draftKey, JSON.stringify(draft))
    }
    catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  const loadDraft = (projectId: string, wellId: string) => {
    try {
      const draftKey = `report_draft_${projectId}_${wellId}`
      const saved = localStorage.getItem(draftKey)

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

        return true
      }

      return false
    }
    catch (error) {
      console.error('Error loading draft:', error)

      return false
    }
  }

  const clearDraft = (projectId: string, wellId: string) => {
    try {
      const draftKey = `report_draft_${projectId}_${wellId}`

      localStorage.removeItem(draftKey)

      // Also clear the draft loaded message if any
      draftLoadedMessage.value = ''
    }
    catch (error) {
      console.error('Error clearing draft:', error)
    }
  }

  return {
    // State
    currentStep,
    formData,
    isDirty,
    validationErrors,
    isLoading,
    errorMessage,
    errorTitle,
    draftLoadedMessage,

    // Computed
    showDayShift,
    showNightShift,
    totalHoursWorked,
    calculatedHorometerEnd,
    isFormValid,
    isActivitiesStepValid,
    isToolsStepValid,
    availableShiftOptions,

    // Actions
    setStep,
    nextStep,
    previousStep,
    updateFormData,
    resetForm,
    clearError,
    setError,

    // Activity Management
    addActivity,
    removeActivity,
    updateActivity,
    updateActivityWithTimeCalculation,
    calculateEndTime,
    calculateHoursFromTimes,

    // Consumption Management
    addConsumption,
    removeConsumption,
    updateConsumption,

    // Tool Management
    addToolAssignment,
    removeToolAssignment,
    updateToolAssignment,
    getLastDepth,

    // Utilities
    handleShiftChange,
    saveDraft,
    loadDraft,
    clearDraft,
  }
})
