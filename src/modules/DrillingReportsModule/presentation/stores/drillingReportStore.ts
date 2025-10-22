/**
 * Drilling Report Store
 *
 * Pinia store for managing drilling reports state
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'
import type { Activity, Consumption, CreateReportDto, DrillingReport, Signature, ToolAssignment, UpdateReportDto } from '../../domain/entities/DrillingReportEntity'

export const useDrillingReportStore = defineStore('drillingReport', () => {
  // State
  const reports = ref<DrillingReport[]>([])
  const currentReport = ref<DrillingReport | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  const filters = ref({
    search: '',
    project_id: '',
    well_id: '',
    status: '',
    date_from: '',
    date_to: '',
    shift: '',
  })

  // Dropdown data
  const projects = ref<any[]>([])
  const wells = ref<any[]>([])
  const employees = ref<any[]>([])
  const equipment = ref<any[]>([])
  const tools = ref<any[]>([])
  const documents = ref<any[]>([])

  // Related entities pagination
  const projectsPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  const wellsPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  const employeesPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  const equipmentPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  const toolsPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  const documentsPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  })

  // Getters
  const getReportsByStatus = computed(() => (status: string) => {
    return reports.value.filter(report => report.status === status)
  })

  const getReportById = computed(() => (id: string) => {
    return reports.value.find(report => report.id === id) || currentReport.value
  })

  const getReportsByProject = computed(() => (projectId: string) => {
    return reports.value.filter(report => report.project.id === projectId)
  })

  const getReportsByWell = computed(() => (wellId: string) => {
    return reports.value.filter(report => report.well.id === wellId)
  })

  const getTotalHours = computed(() => {
    if (!currentReport.value)
      return 0

    return currentReport.value.activities.reduce((total, activity) => total + activity.hours, 0)
  })

  const getTotalMeters = computed(() => {
    if (!currentReport.value)
      return 0

    return currentReport.value.tool_assignments.reduce((total, assignment) => {
      return total + (assignment.depth_range?.meters_drilled || 0)
    }, 0)
  })

  const canEditReport = computed(() => (report: DrillingReport) => {
    return report.status === 'draft'
  })

  const canCompleteReport = computed(() => (report: DrillingReport) => {
    return report.status === 'draft'
           && report.activities.length > 0
           && (report.personnel.operator_day || report.personnel.operator_night)
  })

  const canApproveReport = computed(() => (report: DrillingReport) => {
    return report.status === 'completed'
           && report.signatures.some(s => s.signature_type === 'operator')
  })

  const canRejectReport = computed(() => (report: DrillingReport) => {
    return report.status === 'completed'
  })

  // Actions
  const fetchReports = async (params: any = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await DrillingReportApiService.getReports({
        ...filters.value,
        ...params,
      })

      reports.value = response.data
      pagination.value = response.meta
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching reports'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const fetchReportById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const report = await DrillingReportApiService.getReportById(id)

      currentReport.value = report

      // Update in reports array if exists
      const index = reports.value.findIndex(r => r.id === id)
      if (index !== -1)
        reports.value[index] = report

      return report
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error fetching report'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const createReport = async (data: CreateReportDto) => {
    loading.value = true
    error.value = null

    try {
      const report = await DrillingReportApiService.createReport(data)

      reports.value.unshift(report)
      currentReport.value = report

      return report
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error creating report'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateReport = async (id: string, data: UpdateReportDto) => {
    loading.value = true
    error.value = null

    try {
      const report = await DrillingReportApiService.updateReport(id, data)

      // Update in reports array
      const index = reports.value.findIndex(r => r.id === id)
      if (index !== -1)
        reports.value[index] = report

      if (currentReport.value?.id === id)
        currentReport.value = report

      return report
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error updating report'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteReport = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await DrillingReportApiService.deleteReport(id)
      reports.value = reports.value.filter(r => r.id !== id)

      if (currentReport.value?.id === id)
        currentReport.value = null
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting report'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const addActivity = async (reportId: string, activity: Omit<Activity, 'id'>) => {
    try {
      const newActivity = await DrillingReportApiService.addActivity(reportId, activity)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value.activities.push(newActivity)

      // Update in reports array
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1)
        reports.value[reportIndex].activities.push(newActivity)

      return newActivity
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error adding activity'
      throw err
    }
  }

  const updateActivity = async (reportId: string, activityId: string, activity: Partial<Activity>) => {
    try {
      const updatedActivity = await DrillingReportApiService.updateActivity(reportId, activityId, activity)

      // Update current report
      if (currentReport.value?.id === reportId) {
        const index = currentReport.value.activities.findIndex(a => a.id === activityId)
        if (index !== -1)
          currentReport.value.activities[index] = updatedActivity
      }

      // Update in reports array
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1) {
        const activityIndex = reports.value[reportIndex].activities.findIndex(a => a.id === activityId)
        if (activityIndex !== -1)
          reports.value[reportIndex].activities[activityIndex] = updatedActivity
      }

      return updatedActivity
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error updating activity'
      throw err
    }
  }

  const deleteActivity = async (reportId: string, activityId: string) => {
    try {
      await DrillingReportApiService.deleteActivity(reportId, activityId)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value.activities = currentReport.value.activities.filter(a => a.id !== activityId)

      // Update in reports array
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1)
        reports.value[reportIndex].activities = reports.value[reportIndex].activities.filter(a => a.id !== activityId)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting activity'
      throw err
    }
  }

  const recordConsumption = async (reportId: string, consumption: Omit<Consumption, 'id'>) => {
    try {
      const newConsumption = await DrillingReportApiService.recordConsumption(reportId, consumption)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value.consumptions.push(newConsumption)

      // Update in reports array
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1)
        reports.value[reportIndex].consumptions.push(newConsumption)

      return newConsumption
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error recording consumption'
      throw err
    }
  }

  const updateConsumption = async (reportId: string, consumptionId: string, consumption: Partial<Consumption>) => {
    try {
      const updatedConsumption = await DrillingReportApiService.updateConsumption(reportId, consumptionId, consumption)

      // Update current report
      if (currentReport.value?.id === reportId) {
        const index = currentReport.value.consumptions.findIndex(c => c.id === consumptionId)
        if (index !== -1)
          currentReport.value.consumptions[index] = updatedConsumption
      }

      // Update in reports array
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1) {
        const consumptionIndex = reports.value[reportIndex].consumptions.findIndex(c => c.id === consumptionId)
        if (consumptionIndex !== -1)
          reports.value[reportIndex].consumptions[consumptionIndex] = updatedConsumption
      }

      return updatedConsumption
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error updating consumption'
      throw err
    }
  }

  const deleteConsumption = async (reportId: string, consumptionId: string) => {
    try {
      await DrillingReportApiService.deleteConsumption(reportId, consumptionId)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value.consumptions = currentReport.value.consumptions.filter(c => c.id !== consumptionId)

      // Update in reports array
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1)
        reports.value[reportIndex].consumptions = reports.value[reportIndex].consumptions.filter(c => c.id !== consumptionId)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting consumption'
      throw err
    }
  }

  const assignTool = async (reportId: string, toolAssignment: Omit<ToolAssignment, 'id'>) => {
    try {
      const newAssignment = await DrillingReportApiService.assignTool(reportId, toolAssignment)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value.tool_assignments.push(newAssignment)

      // Update in reports array
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1)
        reports.value[reportIndex].tool_assignments.push(newAssignment)

      return newAssignment
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error assigning tool'
      throw err
    }
  }

  const updateToolAssignment = async (reportId: string, assignmentId: string, toolAssignment: Partial<ToolAssignment>) => {
    try {
      const updatedAssignment = await DrillingReportApiService.updateToolAssignment(reportId, assignmentId, toolAssignment)

      // Update current report
      if (currentReport.value?.id === reportId) {
        const index = currentReport.value.tool_assignments.findIndex(a => a.id === assignmentId)
        if (index !== -1)
          currentReport.value.tool_assignments[index] = updatedAssignment
      }

      // Update in reports array
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1) {
        const assignmentIndex = reports.value[reportIndex].tool_assignments.findIndex(a => a.id === assignmentId)
        if (assignmentIndex !== -1)
          reports.value[reportIndex].tool_assignments[assignmentIndex] = updatedAssignment
      }

      return updatedAssignment
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error updating tool assignment'
      throw err
    }
  }

  const deleteToolAssignment = async (reportId: string, assignmentId: string) => {
    try {
      await DrillingReportApiService.deleteToolAssignment(reportId, assignmentId)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value.tool_assignments = currentReport.value.tool_assignments.filter(a => a.id !== assignmentId)

      // Update in reports array
      const reportIndex = reports.value.findIndex(r => r.id === reportId)
      if (reportIndex !== -1)
        reports.value[reportIndex].tool_assignments = reports.value[reportIndex].tool_assignments.filter(a => a.id !== assignmentId)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error deleting tool assignment'
      throw err
    }
  }

  const completeReport = async (projectId: string, reportId: string, data: { horometer_end_day?: number; horometer_end_night?: number }) => {
    try {
      const report = await DrillingReportApiService.completeReport(projectId, reportId)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value = report

      // Update in reports array
      const index = reports.value.findIndex(r => r.id === reportId)
      if (index !== -1)
        reports.value[index] = report

      return report
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error completing report'
      throw err
    }
  }

  const approveReport = async (projectId: string, reportId: string, data?: { approved_by?: string }) => {
    try {
      const report = await DrillingReportApiService.approveReport(projectId, reportId, data)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value = report

      // Update in reports array
      const index = reports.value.findIndex(r => r.id === reportId)
      if (index !== -1)
        reports.value[index] = report

      return report
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error approving report'
      throw err
    }
  }

  const rejectReport = async (reportId: string, reason: string) => {
    try {
      const report = await DrillingReportApiService.rejectReport(reportId, reason)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value = report

      // Update in reports array
      const index = reports.value.findIndex(r => r.id === reportId)
      if (index !== -1)
        reports.value[index] = report

      return report
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error rejecting report'
      throw err
    }
  }

  const signReport = async (reportId: string, signature: Omit<Signature, 'id' | 'signed_at'>) => {
    try {
      const newSignature = await DrillingReportApiService.signReport(reportId, signature)

      // Update current report
      if (currentReport.value?.id === reportId)
        currentReport.value.signatures.push(newSignature)

      // Update in reports array
      const index = reports.value.findIndex(r => r.id === reportId)
      if (index !== -1)
        reports.value[index].signatures.push(newSignature)

      return newSignature
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error signing report'
      throw err
    }
  }

  const exportReportToPDF = async (reportId: string) => {
    try {
      const blob = await DrillingReportApiService.exportReportToPDF(reportId)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `reporte-perforacion-${reportId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Error exporting report'
      throw err
    }
  }

  // Simple dropdown data actions (for forms and selectors)
  const fetchProjectsSimple = async () => {
    try {
      const data = await DrillingReportApiService.getProjects()

      projects.value = data
    }
    catch (err: any) {
      console.error('Error fetching projects:', err)
    }
  }

  const fetchWellsByProjectSimple = async (projectId: string) => {
    try {
      const data = await DrillingReportApiService.getWellsByProject(projectId)

      wells.value = data
    }
    catch (err: any) {
      console.error('Error fetching wells:', err)
    }
  }

  const fetchToolsSimple = async () => {
    try {
      const data = await DrillingReportApiService.getTools()

      tools.value = data
    }
    catch (err: any) {
      console.error('Error fetching tools:', err)
    }
  }

  const fetchEquipmentSimple = async () => {
    try {
      const data = await DrillingReportApiService.getEquipment()

      equipment.value = data
    }
    catch (err: any) {
      console.error('Error fetching equipment:', err)
    }
  }

  const fetchDocumentsByEntity = async (entityType: string, entityId: string, params: any = {}) => {
    try {
      const response = await DrillingReportApiService.getDocumentsByEntity(entityType, entityId, params)

      documents.value = response.data
      documentsPagination.value = {
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total,
      }
    }
    catch (err: any) {
      console.error('Error fetching documents by entity:', err)
    }
  }

  const uploadDocument = async (file: File, metadata: {
    name: string
    description?: string
    document_type: string
    related_entity_type: string
    related_entity_id: string
  }) => {
    try {
      return await DrillingReportApiService.uploadDocument(file, metadata)
    }
    catch (err: any) {
      console.error('Error uploading document:', err)
      throw err
    }
  }

  const downloadDocument = async (documentId: string) => {
    try {
      return await DrillingReportApiService.downloadDocument(documentId)
    }
    catch (err: any) {
      console.error('Error downloading document:', err)
      throw err
    }
  }

  // Utility actions
  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      project_id: '',
      well_id: '',
      status: '',
      date_from: '',
      date_to: '',
      shift: '',
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    reports.value = []
    currentReport.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    }
    clearFilters()
  }

  return {
    // State
    reports,
    currentReport,
    loading,
    error,
    pagination,
    filters,
    projects,
    wells,
    employees,
    equipment,
    tools,
    documents,
    projectsPagination,
    wellsPagination,
    employeesPagination,
    equipmentPagination,
    toolsPagination,
    documentsPagination,

    // Getters
    getReportsByStatus,
    getReportById,
    getReportsByProject,
    getReportsByWell,
    getTotalHours,
    getTotalMeters,
    canEditReport,
    canCompleteReport,
    canApproveReport,
    canRejectReport,

    // Actions
    fetchReports,
    fetchReportById,
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
    fetchProjectsSimple,
    fetchWellsByProjectSimple,
    fetchToolsSimple,
    fetchEquipmentSimple,
    fetchDocumentsByEntity,
    uploadDocument,
    downloadDocument,
    setFilters,
    clearFilters,
    clearError,
    reset,
  }
})
