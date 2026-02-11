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
      && measurement.inclination >= -90
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
        // Only add positive depth differences (safeguard against invalid depths)
        const depthDiff = Number(bit.end_depth_meters) - Number(bit.start_depth_meters)

        return bitSum + (depthDiff > 0 ? depthDiff : 0)
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

  // Load report data into wizard form
  const loadReportData = (report: any) => {
    console.log('🔄 loadReportData called with report:', report)
    console.log('📊 Report structure check:', {
      hasReportDate: !!report.report_date,
      hasShift: !!report.shift,
      hasActivities: Array.isArray(report.activities),
      activitiesCount: report.activities?.length || 0,
      hasConsumptions: Array.isArray(report.consumptions),
      consumptionsCount: report.consumptions?.length || 0,
      hasToolAssignments: Array.isArray(report.tool_assignments),
      toolAssignmentsCount: report.tool_assignments?.length || 0,
      hasTools: !!report.tools,
      hasPersonnel: !!report.personnel,
    })

    // Basic information
    formData.value.report_date = report.report_date || new Date().toISOString().split('T')[0]
    formData.value.shift = report.shift || 'day'
    formData.value.equipment_id = report.equipment?.id || report.equipment_id || null
    formData.value.observations = report.observations || ''

    console.log('Basic info loaded:', {
      report_date: formData.value.report_date,
      shift: formData.value.shift,
      equipment_id: formData.value.equipment_id,
    })

    console.log('🔍 Personnel structure:', {
      personnel: report.personnel,
      personnelDay: report.personnel?.day,
      personnelNight: report.personnel?.night,
    })

    // Personnel - API structure: {day: {operator: {...}, helpers: [...]}, night: {...}}
    // Also supports legacy structure: {operator_day: {...}, helper1_day: {...}, ...}
    const personnelDay = report.personnel?.day || {}
    const personnelNight = report.personnel?.night || {}

    console.log('🔍 Extracted personnel:', {
      dayOperator: personnelDay.operator,
      dayHelpers: personnelDay.helpers,
      nightOperator: personnelNight.operator,
      nightHelpers: personnelNight.helpers,
    })

    // Operator - try new structure first, then legacy
    formData.value.operator_day_id = personnelDay.operator?.id
      || report.personnel?.operator_day?.id
      || report.operator_day_id
      || null

    formData.value.operator_night_id = personnelNight.operator?.id
      || report.personnel?.operator_night?.id
      || report.operator_night_id
      || null

    // Helpers - convert from helpers array to helper_day_ids array
    const helperDayIds: string[] = []
    if (personnelDay.helpers && Array.isArray(personnelDay.helpers)) {
      // New structure: helpers is an array
      helperDayIds.push(...personnelDay.helpers.map((h: any) => {
        return h.id || h.employee?.id || h.employee_id || h
      }).filter((id: any) => id))
    }

    // Fallback to individual helper IDs if helpers array doesn't exist (legacy structure)
    if (helperDayIds.length === 0) {
      if (report.personnel?.helper1_day?.id || report.helper1_day_id)
        helperDayIds.push(report.personnel?.helper1_day?.id || report.helper1_day_id)
      if (report.personnel?.helper2_day?.id || report.helper2_day_id)
        helperDayIds.push(report.personnel?.helper2_day?.id || report.helper2_day_id)
    }
    formData.value.helper_day_ids = helperDayIds

    const helperNightIds: string[] = []
    if (personnelNight.helpers && Array.isArray(personnelNight.helpers)) {
      // New structure: helpers is an array
      helperNightIds.push(...personnelNight.helpers.map((h: any) => {
        return h.id || h.employee?.id || h.employee_id || h
      }).filter((id: any) => id))
    }

    // Fallback to individual helper IDs if helpers array doesn't exist (legacy structure)
    if (helperNightIds.length === 0) {
      if (report.personnel?.helper1_night?.id || report.helper1_night_id)
        helperNightIds.push(report.personnel?.helper1_night?.id || report.helper1_night_id)
      if (report.personnel?.helper2_night?.id || report.helper2_night_id)
        helperNightIds.push(report.personnel?.helper2_night?.id || report.helper2_night_id)
    }
    formData.value.helper_night_ids = helperNightIds

    console.log('Personnel loaded:', {
      operator_day_id: formData.value.operator_day_id,
      operator_night_id: formData.value.operator_night_id,
      helper_day_ids: formData.value.helper_day_ids,
      helper_night_ids: formData.value.helper_night_ids,
    })

    // Horometer - API structure: {day: {start: ..., end: ...}, night: {start: ..., end: ...}}
    console.log('🔍 Horometer structure:', report.horometer)

    formData.value.horometer_start_day = report.horometer?.day?.start
      || report.horometer?.day?.initial
      || report.horometer_start_day
      || null

    formData.value.horometer_start_night = report.horometer?.night?.start
      || report.horometer?.night?.initial
      || report.horometer_start_night
      || null

    formData.value.horometer_end_day = report.horometer?.day?.end
      || report.horometer?.day?.final
      || report.horometer_end_day
      || null

    formData.value.horometer_end_night = report.horometer?.night?.end
      || report.horometer?.night?.final
      || report.horometer_end_night
      || null

    console.log('Horometer loaded:', {
      start_day: formData.value.horometer_start_day,
      end_day: formData.value.horometer_end_day,
      start_night: formData.value.horometer_start_night,
      end_night: formData.value.horometer_end_night,
    })

    // RPM - API structure: parameters: {rpm_pull_down: ..., rpm_rotation: ...}
    formData.value.rpm_pull_down = report.parameters?.rpm_pull_down
      || report.parameters?.pull_down
      || report.rpm?.pull_down
      || report.rpm_pull_down
      || null

    formData.value.rpm_rotation = report.parameters?.rpm_rotation
      || report.parameters?.rotation
      || report.rpm?.rotation
      || report.rpm_rotation
      || null

    console.log('RPM loaded:', {
      rpm_pull_down: formData.value.rpm_pull_down,
      rpm_rotation: formData.value.rpm_rotation,
    })

    // Activities
    formData.value.activities = (report.activities || []).map((act: any) => ({
      activity_type: act.activity_type || 'drilling',
      shift: act.shift || formData.value.shift,
      hours: act.hours || 0,
      start_time: act.start_time || '',
      end_time: act.end_time || '',
      description: act.description || '',
    }))

    // Consumptions - check both consumptions array and additives array
    const consumptionsList = report.consumptions || report.additives || []

    formData.value.consumptions = consumptionsList.map((cons: any) => ({
      consumable_type: cons.consumable_type || cons.type || '',
      shift: cons.shift || formData.value.shift,
      quantity: cons.quantity || cons.amount || 0,
      unit: cons.unit || 'kg',
    }))

    // Directional measurements
    formData.value.directional_measurements = (report.directional_measurements || []).map((meas: any) => ({
      depth: meas.depth || 0,
      azimuth: meas.azimuth || 0,
      inclination: meas.inclination || 0,
      measurement_interval: meas.measurement_interval || 0,
      notes: meas.notes || '',
      measured_at: meas.measured_at || null,
    }))

    // Drilling depths - API structure: depths: {drilling_start: ..., drilling_end: ..., depth_from: ..., depth_to: ...}
    formData.value.drilling_depth_start = report.depths?.drilling_start || report.depths?.depth_from || report.drilling_depth_start || null
    formData.value.drilling_depth_end = report.depths?.drilling_end || report.depths?.depth_to || report.drilling_depth_end || null

    // Tools - Convert tool_assignments to tool_groups
    formData.value.tool_groups = []

    console.log('🔍 Tools structure:', {
      tools: report.tools,
      tool_assignments: report.tool_assignments,
      drilling_details: report.drilling_details,
    })

    // Get tools from report (could be in tools.reamers/tools.bits or tool_assignments or drilling_details)
    const toolAssignments = report.tool_assignments || []

    const reamers = report.tools?.reamers || toolAssignments.filter((t: any) =>
      t.tool_category === 'reamer' || t.tool?.type === 'reamer' || t.tool?.type?.includes('reamer'),
    )

    const bits = report.tools?.bits || toolAssignments.filter((t: any) =>
      t.tool_category === 'diamond_bit' || t.tool_category === 'tricone'
      || t.tool?.type === 'diamond_bit' || t.tool?.type === 'tricone',
    )

    // Also check drilling_details for bits (they might be there)
    const drillingDetailsBits = (report.drilling_details || []).filter((d: any) =>
      d.affects_well_depth === true
      && d.tool?.type !== 'reamer'
      && d.group_position !== 'reamer'
      && (d.tool?.type === 'diamond_bit' || d.tool?.type === 'tricone' || d.tool_category === 'diamond_bit' || d.tool_category === 'tricone'),
    )

    // Combine bits from both sources and deduplicate by composite key (tool_id + depth)
    // Use a Map to ensure each bit usage (same tool at different depths) is preserved
    const bitsMap = new Map<string, any>()

    // Helper to create unique key for each bit usage
    const getBitUniqueKey = (bit: any) => {
      const toolId = bit.tool?.id || bit.tool_id
      const depthFrom = bit.depth_from ?? bit.start_depth_meters ?? 0
      const depthTo = bit.depth_to ?? bit.end_depth_meters ?? 0

      return `${toolId}_${depthFrom}_${depthTo}`
    }

    // Add bits from tools.bits or tool_assignments first
    bits.forEach((bit: any) => {
      const uniqueKey = getBitUniqueKey(bit)
      if (!bitsMap.has(uniqueKey))
        bitsMap.set(uniqueKey, bit)
    })

    // Add bits from drilling_details, but don't overwrite if already exists
    drillingDetailsBits.forEach((bit: any) => {
      const uniqueKey = getBitUniqueKey(bit)
      if (!bitsMap.has(uniqueKey))
        bitsMap.set(uniqueKey, bit)
    })

    // Convert map back to array
    const allBits = Array.from(bitsMap.values())

    console.log('🔍 Extracted tools:', {
      reamersCount: reamers.length,
      reamers,
      bitsCount: allBits.length,
      bits: allBits,
      bitsBeforeDedup: bits.length + drillingDetailsBits.length,
      bitsAfterDedup: allBits.length,
    })

    // Track which bits have been assigned to avoid duplicates (using composite key)
    const assignedBitKeys = new Set<string>()

    // Group reamers with their bits
    // Try multiple strategies to match bits with reamers:
    // 1. By tool_group_id (most reliable)
    // 2. By reamer_id field
    // 3. By group_index/group_position
    // 4. By depth ranges (bits within reamer depth range)
    reamers.forEach((reamer: any, index: number) => {
      const reamerId = reamer.tool?.id || reamer.tool_id
      const reamerToolGroupId = reamer.tool_group_id

      // API uses depth_from/depth_to, not start_depth_meters/end_depth_meters
      const reamerStartDepth = reamer.depth_from ?? reamer.start_depth_meters ?? 0
      const reamerEndDepth = reamer.depth_to ?? reamer.end_depth_meters ?? 0

      console.log(`🔍 Processing reamer ${index + 1}:`, {
        reamerId,
        reamerToolGroupId,
        reamerStartDepth,
        reamerEndDepth,
        reamerRaw: reamer,
      })

      // Try to find bits associated with this reamer (only unassigned bits)
      let reamerBits = allBits.filter((bit: any) => {
        const bitUniqueKey = getBitUniqueKey(bit)

        // Skip if this bit has already been assigned to another reamer
        if (assignedBitKeys.has(bitUniqueKey))
          return false

        // Strategy 1: Match by tool_group_id (most reliable for API data)
        if (bit.tool_group_id && reamerToolGroupId && bit.tool_group_id === reamerToolGroupId) {
          console.log(`  ✅ Bit matched by tool_group_id: ${bit.tool?.id || bit.tool_id} (${bit.depth_from}-${bit.depth_to})`)

          return true
        }

        // Check all possible reamer_id fields
        const bitReamerId = bit.reamer_id
          || bit.tool?.reamer_id
          || bit.reamer?.id
          || bit.reamer_id
          || bit.group_reamer_id
          || bit.parent_reamer_id

        const bitGroupIndex = bit.group_index
        const bitGroupPosition = bit.group_position

        console.log(`  🔍 Checking bit ${bit.tool?.id || bit.tool_id}:`, {
          bitReamerId,
          reamerId,
          bitToolGroupId: bit.tool_group_id,
          reamerToolGroupId,
          bitGroupIndex,
          bitGroupPosition,
          bitDepthFrom: bit.depth_from,
          bitDepthTo: bit.depth_to,
          reamerStartDepth,
          reamerEndDepth,
        })

        // Strategy 2: Direct reamer_id match
        if (bitReamerId && bitReamerId === reamerId) {
          console.log(`  ✅ Bit matched by reamer_id: ${bit.tool?.id || bit.tool_id}`)

          return true
        }

        // Strategy 3: Group index/position match
        if (bitGroupPosition === 'bit' && bitGroupIndex === index) {
          console.log(`  ✅ Bit matched by group_index: ${bit.tool?.id || bit.tool_id}`)

          return true
        }

        // Strategy 3: Depth range match (bit is within reamer's depth range)
        // API uses depth_from/depth_to
        const bitStartDepth = Number(bit.depth_from ?? bit.start_depth_meters ?? 0)
        const bitEndDepth = Number(bit.depth_to ?? bit.end_depth_meters ?? 0)
        const reamerStartNum = Number(reamerStartDepth)
        const reamerEndNum = Number(reamerEndDepth)

        // Check if bit depth range overlaps or is within reamer range
        if (reamerStartNum > 0 && reamerEndNum > 0) {
          // Bit starts within reamer range OR bit ends within reamer range OR bit completely contains reamer range
          const bitStartsInRange = bitStartDepth >= reamerStartNum && bitStartDepth <= reamerEndNum
          const bitEndsInRange = bitEndDepth >= reamerStartNum && bitEndDepth <= reamerEndNum
          const bitContainsRange = bitStartDepth <= reamerStartNum && bitEndDepth >= reamerEndNum

          if (bitStartsInRange || bitEndsInRange || bitContainsRange) {
            console.log(`  ✅ Bit matched by depth range: ${bit.tool?.id || bit.tool_id} (${bitStartDepth}-${bitEndDepth} overlaps ${reamerStartNum}-${reamerEndNum})`)

            return true
          }
        }

        return false
      })

      // If no bits found by association, try to match by depth if there's only one reamer
      // Only assign unassigned bits
      if (reamerBits.length === 0 && reamers.length === 1) {
        const unassignedBits = allBits.filter((bit: any) => {
          const bitUniqueKey = getBitUniqueKey(bit)

          return !assignedBitKeys.has(bitUniqueKey)
        })

        if (unassignedBits.length > 0) {
          console.log('⚠️ No bits found by association, assigning all unassigned bits to single reamer')
          reamerBits = unassignedBits
        }
      }

      // Mark all matched bits as assigned
      reamerBits.forEach((bit: any) => {
        const bitUniqueKey = getBitUniqueKey(bit)

        assignedBitKeys.add(bitUniqueKey)
      })

      console.log(`✅ Found ${reamerBits.length} bits for reamer ${index + 1}:`, reamerBits.map(b => ({
        tool_id: b.tool?.id || b.tool_id,
        depth_from: b.depth_from,
        depth_to: b.depth_to,
        start_depth_meters: b.start_depth_meters,
        end_depth_meters: b.end_depth_meters,
      })))

      formData.value.tool_groups.push({
        id: `group-${index}`,
        reamer: {
          tool_id: reamerId,
          shift: reamer.shift || formData.value.shift,

          // Convert depth_from/depth_to to start_depth_meters/end_depth_meters
          // Ensure start_depth < end_depth (swap if needed)
          start_depth_meters: Number(reamerStartDepth) <= Number(reamerEndDepth) ? Number(reamerStartDepth) : Number(reamerEndDepth),
          end_depth_meters: Number(reamerEndDepth) >= Number(reamerStartDepth) ? Number(reamerEndDepth) : Number(reamerStartDepth),
          wear_pattern: reamer.wear_pattern || '',
          matrix: reamer.matrix || '',
        },
        bits: reamerBits.map((bit: any) => {
          const bitToolId = bit.tool?.id || bit.tool_id
          const bitCategory = bit.tool_category || (bit.tool?.type === 'tricone' ? 'tricone' : 'diamond_bit')

          // API uses depth_from/depth_to, convert to start_depth_meters/end_depth_meters
          const bitStartDepth = bit.depth_from ?? bit.start_depth_meters ?? 0
          const bitEndDepth = bit.depth_to ?? bit.end_depth_meters ?? 0

          console.log('  📍 Mapping bit:', {
            tool_id: bitToolId,
            depth_from: bit.depth_from,
            depth_to: bit.depth_to,
            start_depth_meters: bit.start_depth_meters,
            end_depth_meters: bit.end_depth_meters,
            mapped_start: bitStartDepth,
            mapped_end: bitEndDepth,
          })

          // Ensure start_depth < end_depth (swap if needed)
          let finalStartDepth = Number(bitStartDepth)
          let finalEndDepth = Number(bitEndDepth)

          if (finalStartDepth > finalEndDepth && finalEndDepth > 0) {
            console.warn(`⚠️ Bit ${bitToolId} has inverted depths (${finalStartDepth} > ${finalEndDepth}), swapping`)

            const temp = finalStartDepth

            finalStartDepth = finalEndDepth
            finalEndDepth = temp
          }

          return {
            tool_id: bitToolId,
            tool_category: bitCategory,
            shift: bit.shift || formData.value.shift,
            start_depth_meters: finalStartDepth,
            end_depth_meters: finalEndDepth,
            wear_pattern: bit.wear_pattern || '',
            matrix: bit.matrix || '',
            recovery: (bit.recovery ?? bit.meters_drilled ?? (finalEndDepth - finalStartDepth)) || null,
          }
        }),
      })
    })

    // If no reamers but there are bits, create a group without reamer
    if (reamers.length === 0 && allBits.length > 0) {
      console.log('⚠️ No reamers found, creating group with bits only')

      const firstBitStart = allBits[0]?.depth_from ?? allBits[0]?.start_depth_meters ?? 0
      const lastBitEnd = allBits[allBits.length - 1]?.depth_to ?? allBits[allBits.length - 1]?.end_depth_meters ?? 0

      formData.value.tool_groups.push({
        id: 'group-0',
        reamer: {
          tool_id: null,
          shift: formData.value.shift,
          start_depth_meters: Number(firstBitStart),
          end_depth_meters: Number(lastBitEnd),
          wear_pattern: '',
          matrix: '',
        },
        bits: allBits.map((bit: any) => {
          const bitStartDepth = bit.depth_from ?? bit.start_depth_meters ?? 0
          const bitEndDepth = bit.depth_to ?? bit.end_depth_meters ?? 0

          return {
            tool_id: bit.tool?.id || bit.tool_id,
            tool_category: bit.tool_category || (bit.tool?.type === 'tricone' ? 'tricone' : 'diamond_bit'),
            shift: bit.shift || formData.value.shift,
            start_depth_meters: Number(bitStartDepth),
            end_depth_meters: Number(bitEndDepth),
            wear_pattern: bit.wear_pattern || '',
            matrix: bit.matrix || '',
            recovery: (bit.recovery ?? bit.meters_drilled ?? (Number(bitEndDepth) - Number(bitStartDepth))) || null,
          }
        }),
      })
    }

    console.log('✅ Tool groups created:', {
      groupsCount: formData.value.tool_groups.length,
      groups: formData.value.tool_groups.map(g => ({
        reamerId: g.reamer.tool_id,
        bitsCount: g.bits.length,
        bits: g.bits.map(b => ({ tool_id: b.tool_id, category: b.tool_category })),
      })),
    })

    isDirty.value = false

    console.log('✅ Report data loaded into wizard form:', {
      report_date: formData.value.report_date,
      shift: formData.value.shift,
      activities_count: formData.value.activities.length,
      consumptions_count: formData.value.consumptions.length,
      tool_groups_count: formData.value.tool_groups.length,
      total_bits_loaded: formData.value.tool_groups.reduce((sum, g) => sum + g.bits.length, 0),
      directional_measurements_count: formData.value.directional_measurements.length,
      tool_groups_detail: formData.value.tool_groups.map((g, idx) => ({
        group: idx + 1,
        reamer_id: g.reamer.tool_id,
        bits_count: g.bits.length,
        bits_ids: g.bits.map(b => b.tool_id),
      })),
    })
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

  // Actualizar profundidad final del escarreador basado en sus brocas
  const updateReamerEndDepth = (groupIndex: number) => {
    const group = formData.value.tool_groups[groupIndex]
    if (group.bits.length > 0) {
      const maxDepth = Math.max(...group.bits.map(b => b.end_depth_meters))

      group.reamer.end_depth_meters = maxDepth
    }
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
    loadReportData,

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
