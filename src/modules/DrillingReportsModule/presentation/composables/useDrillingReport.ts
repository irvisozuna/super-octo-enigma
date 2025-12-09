/**
 * Drilling Report Composable
 *
 * Main composable for drilling report functionality
 */

import { computed, ref } from 'vue'
import { useDrillingReportStore } from '../stores/drillingReportStore'
import type { Activity, Consumption, CreateReportDto, DrillingReport, Signature, ToolAssignment, UpdateReportDto } from '../../domain/entities/DrillingReportEntity'
import { useDrillingReportPermissions } from './useDrillingReportPermissions'
import { useDrillingReportStatusTransition } from './useDrillingReportStatusTransition'

export function useDrillingReport(reportId?: string) {
  const store = useDrillingReportStore()
  const permissions = useDrillingReportPermissions()

  // Local state
  const selectedReport = ref<DrillingReport | null>(null)
  const isEditing = ref(false)
  const isCreating = ref(false)
  const isCompleting = ref(false)
  const isApproving = ref(false)
  const isRejecting = ref(false)
  const isSigning = ref(false)

  // Computed
  const currentReport = computed(() => selectedReport.value || store.currentReport)
  const reports = computed(() => store.reports)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const pagination = computed(() => store.pagination)
  const filters = computed(() => store.filters)

  // Dropdown data
  const projects = computed(() => store.projects)
  const wells = computed(() => store.wells)
  const employees = computed(() => store.employees)
  const equipment = computed(() => store.equipment)
  const tools = computed(() => store.tools)

  // Report calculations
  const totalHours = computed(() => {
    if (!currentReport.value)
      return 0

    return currentReport.value.activities.reduce((total, activity) => total + activity.hours, 0)
  })

  const totalMeters = computed(() => {
    if (!currentReport.value)
      return 0

    return currentReport.value.tool_assignments.reduce((total, assignment) => {
      return total + (assignment.depth_range?.meters_drilled || 0)
    }, 0)
  })

  const activitiesByShift = computed(() => {
    if (!currentReport.value)
      return { day: [], night: [] }

    return {
      day: currentReport.value.activities.filter(a => a.shift === 'day'),
      night: currentReport.value.activities.filter(a => a.shift === 'night'),
    }
  })

  const consumptionsByShift = computed(() => {
    if (!currentReport.value)
      return { day: [], night: [] }

    return {
      day: currentReport.value.consumptions.filter(c => c.shift === 'day'),
      night: currentReport.value.consumptions.filter(c => c.shift === 'night'),
    }
  })

  const toolAssignmentsByShift = computed(() => {
    if (!currentReport.value)
      return { day: [], night: [] }

    return {
      day: currentReport.value.tool_assignments.filter(t => t.shift === 'day'),
      night: currentReport.value.tool_assignments.filter(t => t.shift === 'night'),
    }
  })

  // Status and permissions
  const statusTransition = computed(() => {
    if (!currentReport.value)
      return null

    return useDrillingReportStatusTransition(currentReport.value)
  })

  const canEdit = computed(() => {
    if (!currentReport.value)
      return false

    return permissions.canEdit(currentReport.value) && currentReport.value.status === 'draft'
  })

  const canDelete = computed(() => {
    if (!currentReport.value)
      return false

    return permissions.canDelete(currentReport.value) && currentReport.value.status === 'draft'
  })

  const canComplete = computed(() => {
    if (!currentReport.value)
      return false

    return permissions.canComplete(currentReport.value) && store.canCompleteReport(currentReport.value)
  })

  const canApprove = computed(() => {
    if (!currentReport.value)
      return false

    return permissions.canApprove(currentReport.value) && store.canApproveReport(currentReport.value)
  })

  const canReject = computed(() => {
    if (!currentReport.value)
      return false

    return permissions.canReject(currentReport.value) && store.canRejectReport(currentReport.value)
  })

  const canSign = computed(() => {
    if (!currentReport.value)
      return false

    return permissions.canSign(currentReport.value)
  })

  const canExport = computed(() => {
    if (!currentReport.value)
      return false

    return permissions.canExport(currentReport.value)
  })

  // Methods
  const loadReport = async (id: string) => {
    try {
      const report = await store.fetchReportById(id)

      selectedReport.value = report

      return report
    }
    catch (error) {
      console.error('Error loading report:', error)
      throw error
    }
  }

  const loadReports = async (params?: any) => {
    try {
      await store.fetchReports(params)
    }
    catch (error) {
      console.error('Error loading reports:', error)
      throw error
    }
  }

  const createReport = async (data: CreateReportDto) => {
    try {
      isCreating.value = true

      const report = await store.createReport(data)

      selectedReport.value = report

      return report
    }
    catch (error) {
      console.error('Error creating report:', error)
      throw error
    }
    finally {
      isCreating.value = false
    }
  }

  const updateReport = async (id: string, data: UpdateReportDto) => {
    try {
      isEditing.value = true

      const report = await store.updateReport(id, data)
      if (selectedReport.value?.id === id)
        selectedReport.value = report

      return report
    }
    catch (error) {
      console.error('Error updating report:', error)
      throw error
    }
    finally {
      isEditing.value = false
    }
  }

  const deleteReport = async (id: string) => {
    try {
      await store.deleteReport(id)
      if (selectedReport.value?.id === id)
        selectedReport.value = null
    }
    catch (error) {
      console.error('Error deleting report:', error)
      throw error
    }
  }

  const addActivity = async (reportId: string, activity: Omit<Activity, 'id'>) => {
    try {
      return await store.addActivity(reportId, activity)
    }
    catch (error) {
      console.error('Error adding activity:', error)
      throw error
    }
  }

  const updateActivity = async (reportId: string, activityId: string, activity: Partial<Activity>) => {
    try {
      return await store.updateActivity(reportId, activityId, activity)
    }
    catch (error) {
      console.error('Error updating activity:', error)
      throw error
    }
  }

  const deleteActivity = async (reportId: string, activityId: string) => {
    try {
      await store.deleteActivity(reportId, activityId)
    }
    catch (error) {
      console.error('Error deleting activity:', error)
      throw error
    }
  }

  const recordConsumption = async (reportId: string, consumption: Omit<Consumption, 'id'>) => {
    try {
      return await store.recordConsumption(reportId, consumption)
    }
    catch (error) {
      console.error('Error recording consumption:', error)
      throw error
    }
  }

  const updateConsumption = async (reportId: string, consumptionId: string, consumption: Partial<Consumption>) => {
    try {
      return await store.updateConsumption(reportId, consumptionId, consumption)
    }
    catch (error) {
      console.error('Error updating consumption:', error)
      throw error
    }
  }

  const deleteConsumption = async (reportId: string, consumptionId: string) => {
    try {
      await store.deleteConsumption(reportId, consumptionId)
    }
    catch (error) {
      console.error('Error deleting consumption:', error)
      throw error
    }
  }

  const assignTool = async (reportId: string, toolAssignment: Omit<ToolAssignment, 'id'>) => {
    try {
      return await store.assignTool(reportId, toolAssignment)
    }
    catch (error) {
      console.error('Error assigning tool:', error)
      throw error
    }
  }

  const updateToolAssignment = async (reportId: string, assignmentId: string, toolAssignment: Partial<ToolAssignment>) => {
    try {
      return await store.updateToolAssignment(reportId, assignmentId, toolAssignment)
    }
    catch (error) {
      console.error('Error updating tool assignment:', error)
      throw error
    }
  }

  const deleteToolAssignment = async (reportId: string, assignmentId: string) => {
    try {
      await store.deleteToolAssignment(reportId, assignmentId)
    }
    catch (error) {
      console.error('Error deleting tool assignment:', error)
      throw error
    }
  }

  const completeReport = async (reportId: string, data: { horometer_end_day?: number; horometer_end_night?: number }) => {
    try {
      isCompleting.value = true

      const report = await store.completeReport(reportId, data)
      if (selectedReport.value?.id === reportId)
        selectedReport.value = report

      return report
    }
    catch (error) {
      console.error('Error completing report:', error)
      throw error
    }
    finally {
      isCompleting.value = false
    }
  }

  const approveReport = async (reportId: string) => {
    try {
      isApproving.value = true

      const report = await store.approveReport(reportId)
      if (selectedReport.value?.id === reportId)
        selectedReport.value = report

      return report
    }
    catch (error) {
      console.error('Error approving report:', error)
      throw error
    }
    finally {
      isApproving.value = false
    }
  }

  const rejectReport = async (reportId: string, reason: string) => {
    try {
      isRejecting.value = true

      const report = await store.rejectReport(reportId, reason)
      if (selectedReport.value?.id === reportId)
        selectedReport.value = report

      return report
    }
    catch (error) {
      console.error('Error rejecting report:', error)
      throw error
    }
    finally {
      isRejecting.value = false
    }
  }

  const signReport = async (reportId: string, signature: Omit<Signature, 'id' | 'signed_at'>) => {
    try {
      isSigning.value = true

      return await store.signReport(reportId, signature)
    }
    catch (error) {
      console.error('Error signing report:', error)
      throw error
    }
    finally {
      isSigning.value = false
    }
  }

  const exportReportToPDF = async (reportId: string) => {
    try {
      await store.exportReportToPDF(reportId)
    }
    catch (error) {
      console.error('Error exporting report:', error)
      throw error
    }
  }

  // Dropdown data methods
  const loadProjects = async () => {
    try {
      await store.fetchProjectsSimple()
    }
    catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadWellsByProject = async (projectId: string) => {
    try {
      await store.fetchWellsByProject(projectId)
    }
    catch (error) {
      console.error('Error loading wells:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      await store.fetchEmployees()
    }
    catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const loadEquipment = async () => {
    try {
      await store.fetchEquipment()
    }
    catch (error) {
      console.error('Error loading equipment:', error)
    }
  }

  const loadAvailableTools = async (params?: any) => {
    try {
      await store.fetchAvailableTools(params)
    }
    catch (error) {
      console.error('Error loading tools:', error)
    }
  }

  // Filter methods
  const setFilters = (newFilters: Partial<typeof store.filters>) => {
    store.setFilters(newFilters)
  }

  const clearFilters = () => {
    store.clearFilters()
  }

  const clearError = () => {
    store.clearError()
  }

  // Utility methods
  const reset = () => {
    selectedReport.value = null
    isEditing.value = false
    isCreating.value = false
    isCompleting.value = false
    isApproving.value = false
    isRejecting.value = false
    isSigning.value = false
    store.reset()
  }

  // Auto-load report if reportId is provided
  if (reportId)
    loadReport(reportId)

  return {
    // State
    selectedReport,
    isEditing,
    isCreating,
    isCompleting,
    isApproving,
    isRejecting,
    isSigning,

    // Computed
    currentReport,
    reports,
    loading,
    error,
    pagination,
    filters,
    projects,
    wells,
    employees,
    equipment,
    tools,
    totalHours,
    totalMeters,
    activitiesByShift,
    consumptionsByShift,
    toolAssignmentsByShift,
    statusTransition,
    canEdit,
    canDelete,
    canComplete,
    canApprove,
    canReject,
    canSign,
    canExport,

    // Methods
    loadReport,
    loadReports,
    createReport,
    updateReport,
    deleteReport,
    addActivity,
    updateActivity,
    deleteActivity,
    recordConsumption,
    updateConsumption,
    deleteConsumption,
    assignTool,
    updateToolAssignment,
    deleteToolAssignment,
    completeReport,
    approveReport,
    rejectReport,
    signReport,
    exportReportToPDF,
    loadProjects,
    loadWellsByProject,
    loadEmployees,
    loadEquipment,
    loadAvailableTools,
    setFilters,
    clearFilters,
    clearError,
    reset,
  }
}
