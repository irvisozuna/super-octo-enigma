import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

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

interface DirectionalMeasurement {
  id?: string
  depth: number
  azimuth: number
  inclination: number
  measurement_interval: number
  notes?: string
  measured_at?: string
  measured_by?: string
}

interface ToolAssignment {
  tool_id: string | null
  shift: string
  tool_category: string
  start_depth_meters: number
  end_depth_meters: number
  wear_pattern: string
  matrix: string
  reamer_id: string | null
}

// Nueva interfaz para brocas dentro de un grupo
interface ToolBit {
  tool_id: string | null
  tool_category: 'diamond_bit' | 'tricone'
  shift: string
  start_depth_meters: number
  end_depth_meters: number
  wear_pattern: string
  matrix: string
  recovery: number | null
}

// Nueva interfaz para grupos de herramientas (escarreador + brocas)
export interface ToolGroup {
  id: string
  reamer: {
    tool_id: string | null
    shift: string
    start_depth_meters: number
    end_depth_meters: number
    wear_pattern: string
    matrix: string
  }
  bits: ToolBit[]
}

export interface ReportWizardData extends PersonnelData {
  report_date: string
  shift: string
  equipment_id: string | null
  observations: string
  activities: Activity[]
  directional_measurements: DirectionalMeasurement[]
  consumptions: Consumption[]
  tool_assignments: ToolAssignment[]
  tool_groups: ToolGroup[]
  drilling_depth_start: number | null
  drilling_depth_end: number | null
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
    directional_measurements: [],
    consumptions: [],
    tool_assignments: [],
    tool_groups: [],
    drilling_depth_start: null,
    drilling_depth_end: null,
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

  // Validation for directional measurements step (optional)
  const isDirectionalMeasurementsStepValid = computed(() => {
    // Step is optional - if no measurements added, step is valid
    if (formData.value.directional_measurements.length === 0)
      return true

    // If measurements exist, all must have required fields
    return formData.value.directional_measurements.every(measurement =>
      measurement.depth !== null
      && measurement.depth !== undefined
      && measurement.depth >= 0
      && measurement.azimuth !== null
      && measurement.azimuth !== undefined
      && measurement.azimuth >= 0
      && measurement.azimuth <= 360
      && measurement.inclination !== null
      && measurement.inclination !== undefined
      && measurement.inclination >= 0
      && measurement.inclination <= 90
      && measurement.measurement_interval !== null
      && measurement.measurement_interval !== undefined
      && measurement.measurement_interval > 0.1,
    )
  })

  // Computed para validación de profundidad de brocas
  const totalDrillBitDepth = computed(() => {
    return formData.value.tool_assignments
      .filter(tool => tool.tool_category === 'diamond_bit' || tool.tool_category === 'tricone')
      .reduce((sum, tool) => {
        const metersDrilled = (tool.end_depth_meters || 0) - (tool.start_depth_meters || 0)

        return sum + metersDrilled
      }, 0)
  })

  const totalDrillingDepth = computed(() => {
    if (formData.value.drilling_depth_start === null || formData.value.drilling_depth_end === null)
      return 0

    return formData.value.drilling_depth_end - formData.value.drilling_depth_start
  })

  // Computed para convertir tool_groups a tool_assignments (compatibilidad backend)
  const flattenedToolAssignments = computed((): ToolAssignment[] => {
    const assignments: ToolAssignment[] = []

    for (const group of formData.value.tool_groups) {
      // Solo agregar escarreador si tiene tool_id (filtro defensivo)
      if (!group.reamer.tool_id)
        continue

      assignments.push({
        tool_id: group.reamer.tool_id,
        tool_category: 'reamer',
        shift: group.reamer.shift,
        start_depth_meters: group.reamer.start_depth_meters,
        end_depth_meters: group.reamer.end_depth_meters,
        wear_pattern: group.reamer.wear_pattern,
        matrix: group.reamer.matrix,
        reamer_id: null,
      })

      // Agregar brocas vinculadas (solo las que tienen tool_id)
      for (const bit of group.bits) {
        // Filtro defensivo: no enviar bits sin tool_id
        if (!bit.tool_id)
          continue

        assignments.push({
          tool_id: bit.tool_id,
          tool_category: bit.tool_category,
          shift: bit.shift,
          start_depth_meters: bit.start_depth_meters,
          end_depth_meters: bit.end_depth_meters,
          wear_pattern: bit.wear_pattern,
          matrix: bit.matrix,
          reamer_id: group.reamer.tool_id,
        })
      }
    }

    return assignments
  })

  // Computed para suma de profundidad de brocas desde tool_groups
  const totalDrillBitDepthFromGroups = computed(() => {
    return formData.value.tool_groups.reduce((sum, group) => {
      return sum + group.bits.reduce((bitSum, bit) => {
        return bitSum + (bit.end_depth_meters - bit.start_depth_meters)
      }, 0)
    }, 0)
  })

  // Validation for tools step
  const isToolsStepValid = computed(() => {
    // Tools are optional - if no tools added, step is valid
    if (formData.value.tool_assignments.length === 0)
      return true

    // Validar profundidad avanzada
    if (formData.value.drilling_depth_start === null || formData.value.drilling_depth_end === null)
      return false

    if (formData.value.drilling_depth_end <= formData.value.drilling_depth_start)
      return false

    // Validar que el primer tool sea reamer
    if (formData.value.tool_assignments.length > 0) {
      const firstTool = formData.value.tool_assignments[0]
      if (firstTool.tool_category !== 'reamer')
        return false
    }

    // Validar que todas las brocas tengan reamer_id
    const drillBits = formData.value.tool_assignments.filter(
      tool => tool.tool_category === 'diamond_bit' || tool.tool_category === 'tricone',
    )

    const allDrillBitsHaveReamer = drillBits.every(tool => tool.reamer_id !== null && tool.reamer_id !== '')

    if (!allDrillBitsHaveReamer)
      return false

    // Validar que la suma de profundidades de brocas coincida con la profundidad avanzada
    const depthMatch = Math.abs(totalDrillBitDepth.value - totalDrillingDepth.value) < 0.01

    if (!depthMatch)
      return false

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

  // Validation for tools step usando tool_groups (nueva interfaz jerárquica)
  const isToolGroupsStepValid = computed(() => {
    const hasDepthStart = formData.value.drilling_depth_start !== null
    const hasDepthEnd = formData.value.drilling_depth_end !== null
    const hasAnyDepth = hasDepthStart || hasDepthEnd
    const hasGroups = formData.value.tool_groups.length > 0

    // CASO 1: Sin profundidad y sin grupos → Válido (herramientas opcionales)
    if (!hasAnyDepth && !hasGroups)
      return true

    // CASO 2: Con profundidad pero sin grupos → INVÁLIDO (si capturaron profundidad, deben agregar herramientas)
    if (hasAnyDepth && !hasGroups)
      return false

    // CASO 3: Con grupos → Validar todo
    // Validar que ambas profundidades estén capturadas
    if (!hasDepthStart || !hasDepthEnd)
      return false

    if (formData.value.drilling_depth_end! <= formData.value.drilling_depth_start!)
      return false

    // Validar cada grupo
    const allGroupsValid = formData.value.tool_groups.every(group => {
      // Escarreador debe estar seleccionado
      if (!group.reamer.tool_id)
        return false

      // Si tiene brocas, validarlas
      return group.bits.every(bit =>
        bit.tool_id
        && bit.end_depth_meters > bit.start_depth_meters,
      )
    })

    if (!allGroupsValid)
      return false

    // Validar que la suma de profundidades de brocas coincida con la profundidad avanzada
    return Math.abs(totalDrillBitDepthFromGroups.value - totalDrillingDepth.value) < 0.01
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
    const steps = ['1', '2', '3', '4', '5', '6', '7']
    const currentIndex = steps.indexOf(currentStep.value)
    if (currentIndex < steps.length - 1)
      currentStep.value = steps[currentIndex + 1]
  }

  const previousStep = () => {
    const steps = ['1', '2', '3', '4', '5', '6', '7']
    const currentIndex = steps.indexOf(currentStep.value)
    if (currentIndex > 0)
      currentStep.value = steps[currentIndex - 1]
  }

  const updateFormData = (data: Partial<ReportWizardData>) => {
    formData.value = { ...formData.value, ...data }
    isDirty.value = true
  }

  const clearError = () => {
    errorMessage.value = ''
    errorTitle.value = 'Error'
    validationErrors.value = {}
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
      directional_measurements: [],
      consumptions: [],
      tool_assignments: [],
      tool_groups: [],
      drilling_depth_start: null,
      drilling_depth_end: null,
    }

    // Reset wizard state
    currentStep.value = '1'
    isDirty.value = false
    draftLoadedMessage.value = ''

    // Clear all errors
    clearError()
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

  // Directional Measurement Management
  const addDirectionalMeasurement = (measurement?: Partial<DirectionalMeasurement>) => {
    formData.value.directional_measurements.push({
      depth: measurement?.depth ?? 0,
      azimuth: measurement?.azimuth ?? 0,
      inclination: measurement?.inclination ?? 0,
      measurement_interval: measurement?.measurement_interval ?? 50,
      notes: measurement?.notes || '',
    })
    isDirty.value = true
  }

  const removeDirectionalMeasurement = (index: number) => {
    formData.value.directional_measurements.splice(index, 1)
    isDirty.value = true
  }

  const updateDirectionalMeasurement = (index: number, measurement: Partial<DirectionalMeasurement>) => {
    formData.value.directional_measurements[index] = {
      ...formData.value.directional_measurements[index],
      ...measurement,
    }
    isDirty.value = true
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

  // Helper functions para tool management
  const getLastDepth = () => {
    if (formData.value.tool_assignments.length === 0)
      return 0
    const lastTool = formData.value.tool_assignments[formData.value.tool_assignments.length - 1]

    return lastTool.end_depth_meters || 0
  }

  const getLastReamerId = (): string | null => {
    // Buscar el último reamer asignado
    for (let i = formData.value.tool_assignments.length - 1; i >= 0; i--) {
      const tool = formData.value.tool_assignments[i]
      if (tool.tool_category === 'reamer' && tool.tool_id)
        return tool.tool_id
    }

    return null
  }

  const suggestNextToolCategory = (): string => {
    if (formData.value.tool_assignments.length === 0)
      return 'reamer' // El primer tool debe ser reamer

    const lastTool = formData.value.tool_assignments[formData.value.tool_assignments.length - 1]

    // Si el último tool fue un reamer, sugerir broca
    if (lastTool.tool_category === 'reamer')
      return 'diamond_bit'

    // Si el último tool fue una broca, sugerir otra broca (puede que se haya acabado)
    if (lastTool.tool_category === 'diamond_bit' || lastTool.tool_category === 'tricone')
      return 'diamond_bit'

    // Por defecto, sugerir reamer
    return 'reamer'
  }

  // Tool Assignment Management
  const addToolAssignment = (tool?: Partial<ToolAssignment>) => {
    const defaultShift = formData.value.shift === 'mixed' ? 'day' : formData.value.shift
    const lastDepth = getLastDepth()
    const suggestedCategory = suggestNextToolCategory()
    const lastReamerId = getLastReamerId()

    const newTool: ToolAssignment = {
      tool_id: tool?.tool_id || null,
      shift: tool?.shift || defaultShift,
      tool_category: tool?.tool_category || suggestedCategory,
      start_depth_meters: tool?.start_depth_meters !== undefined ? tool.start_depth_meters : lastDepth,
      end_depth_meters: tool?.end_depth_meters !== undefined ? tool.end_depth_meters : lastDepth,
      wear_pattern: tool?.wear_pattern || '',
      matrix: tool?.matrix || '',
      reamer_id: tool?.reamer_id !== undefined ? tool.reamer_id : null,
    }

    // Auto-asignar reamer_id si es una broca y hay un reamer disponible
    if ((newTool.tool_category === 'diamond_bit' || newTool.tool_category === 'tricone') && lastReamerId && !newTool.reamer_id)
      newTool.reamer_id = lastReamerId

    formData.value.tool_assignments.push(newTool)
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

  // ============================================
  // Tool Group Management (Nueva interfaz jerárquica)
  // ============================================

  // Agregar nuevo grupo (escarreador)
  const addToolGroup = () => {
    const lastGroup = formData.value.tool_groups[formData.value.tool_groups.length - 1]
    const startDepth = lastGroup?.reamer.end_depth_meters || formData.value.drilling_depth_start || 0

    formData.value.tool_groups.push({
      id: crypto.randomUUID(),
      reamer: {
        tool_id: null,
        shift: formData.value.shift === 'mixed' ? 'day' : formData.value.shift,
        start_depth_meters: startDepth,
        end_depth_meters: startDepth,
        wear_pattern: '',
        matrix: '',
      },
      bits: [],
    })
    isDirty.value = true
  }

  // Agregar broca a un grupo específico
  const addBitToGroup = (groupIndex: number) => {
    const group = formData.value.tool_groups[groupIndex]
    const lastBit = group.bits[group.bits.length - 1]
    const minDepth = formData.value.drilling_depth_start || 0
    const maxDepth = formData.value.drilling_depth_end || 9999

    // Calcular profundidad de inicio
    let startDepth = lastBit?.end_depth_meters || group.reamer.start_depth_meters || minDepth
    startDepth = Math.max(minDepth, Math.min(startDepth, maxDepth))

    // Calcular profundidad de fin (sin exceder el máximo)
    let endDepth = startDepth + 15 // Sugerir 15m por defecto
    endDepth = Math.min(endDepth, maxDepth)

    // Si no hay espacio suficiente, ajustar
    if (endDepth <= startDepth)
      endDepth = startDepth + 0.01

    group.bits.push({
      tool_id: null,
      tool_category: 'diamond_bit',
      shift: group.reamer.shift,
      start_depth_meters: startDepth,
      end_depth_meters: endDepth,
      wear_pattern: '',
      matrix: '',
      recovery: endDepth - startDepth, // Auto-inicializar con metros perforados
    })

    // Auto-actualizar profundidad final del escarreador
    updateReamerEndDepth(groupIndex)
    isDirty.value = true
  }

  // Actualizar profundidad final del escarreador basado en sus brocas
  const updateReamerEndDepth = (groupIndex: number) => {
    const group = formData.value.tool_groups[groupIndex]
    if (group.bits.length > 0) {
      const maxDepth = Math.max(...group.bits.map(b => b.end_depth_meters))

      group.reamer.end_depth_meters = maxDepth
    }
  }

  // Remover broca de un grupo
  const removeBitFromGroup = (groupIndex: number, bitIndex: number) => {
    formData.value.tool_groups[groupIndex].bits.splice(bitIndex, 1)
    updateReamerEndDepth(groupIndex)
    isDirty.value = true
  }

  // Remover grupo completo
  const removeToolGroup = (groupIndex: number) => {
    formData.value.tool_groups.splice(groupIndex, 1)
    isDirty.value = true
  }

  // Actualizar escarreador de un grupo
  const updateToolGroupReamer = (groupIndex: number, reamerData: Partial<ToolGroup['reamer']>) => {
    formData.value.tool_groups[groupIndex].reamer = {
      ...formData.value.tool_groups[groupIndex].reamer,
      ...reamerData,
    }
    isDirty.value = true
  }

  // Actualizar broca dentro de un grupo
  const updateBitInGroup = (groupIndex: number, bitIndex: number, bitData: Partial<ToolBit>) => {
    formData.value.tool_groups[groupIndex].bits[bitIndex] = {
      ...formData.value.tool_groups[groupIndex].bits[bitIndex],
      ...bitData,
    }

    // Si se actualizó la profundidad final, actualizar el escarreador
    if (bitData.end_depth_meters !== undefined)
      updateReamerEndDepth(groupIndex)

    isDirty.value = true
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

    // Auto-update all tool groups
    formData.value.tool_groups.forEach(group => {
      group.reamer.shift = defaultShift
      group.bits.forEach(bit => {
        bit.shift = defaultShift
      })
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
    isDirectionalMeasurementsStepValid,
    isToolsStepValid,
    isToolGroupsStepValid,
    availableShiftOptions,
    totalDrillBitDepth,
    totalDrillingDepth,
    totalDrillBitDepthFromGroups,
    flattenedToolAssignments,

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

    // Directional Measurement Management
    addDirectionalMeasurement,
    removeDirectionalMeasurement,
    updateDirectionalMeasurement,

    // Consumption Management
    addConsumption,
    removeConsumption,
    updateConsumption,

    // Tool Management (legacy)
    addToolAssignment,
    removeToolAssignment,
    updateToolAssignment,
    getLastDepth,
    getLastReamerId,
    suggestNextToolCategory,

    // Tool Group Management (nueva interfaz jerárquica)
    addToolGroup,
    addBitToGroup,
    removeBitFromGroup,
    removeToolGroup,
    updateToolGroupReamer,
    updateBitInGroup,

    // Utilities
    handleShiftChange,
    saveDraft,
    loadDraft,
    clearDraft,
  }
})
