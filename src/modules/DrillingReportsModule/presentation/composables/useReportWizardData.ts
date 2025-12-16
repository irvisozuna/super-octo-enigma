import { ref } from 'vue'
import { DrillingReportApiService } from '../../infrastructure/api/services/DrillingReportApiService'

export interface WizardDataOptions {
  title: string
  value: string
  type?: string
}

export const useReportWizardData = () => {
  const loadingEquipment = ref(false)
  const loadingEmployees = ref(false)
  const loadingTools = ref(false)

  const equipmentOptions = ref<WizardDataOptions[]>([])
  const employeeOptions = ref<WizardDataOptions[]>([])
  const toolOptions = ref<WizardDataOptions[]>([])

  const loadEquipment = async () => {
    loadingEquipment.value = true
    try {
      const response = await DrillingReportApiService.getEquipment?.() || { data: [] }

      equipmentOptions.value = (response.data || response || []).map((eq: any) => ({
        title: eq.name || eq.equipment_name,
        value: eq.id,
      }))

      return equipmentOptions.value
    }
    catch (error) {
      console.error('Error loading equipment:', error)
      equipmentOptions.value = []
      throw error
    }
    finally {
      loadingEquipment.value = false
    }
  }

  const loadEmployees = async () => {
    loadingEmployees.value = true
    try {
      const response = await DrillingReportApiService.getEmployees?.() || { data: [] }

      employeeOptions.value = (response.data || response || []).map((emp: any) => ({
        title: emp.full_name || `${emp.first_name} ${emp.last_name}`,
        value: emp.id,
      }))

      return employeeOptions.value
    }
    catch (error) {
      console.error('Error loading employees:', error)
      employeeOptions.value = []
      throw error
    }
    finally {
      loadingEmployees.value = false
    }
  }

  const loadTools = async () => {
    loadingTools.value = true
    try {
      const response = await DrillingReportApiService.getTools?.() || { data: [] }

      toolOptions.value = (response.data || response || []).map((tool: any) => ({
        title: tool.name || tool.tool_name,
        value: tool.id,
        type: tool.type || tool.tool_type || tool.tool_category,
      }))

      return toolOptions.value
    }
    catch (error) {
      console.error('Error loading tools:', error)
      toolOptions.value = []
      throw error
    }
    finally {
      loadingTools.value = false
    }
  }

  const loadAllData = async () => {
    await Promise.all([
      loadEquipment(),
      loadEmployees(),
      loadTools(),
    ])
  }

  return {
    // Loading states
    loadingEquipment,
    loadingEmployees,
    loadingTools,

    // Options data
    equipmentOptions,
    employeeOptions,
    toolOptions,

    // Loaders
    loadEquipment,
    loadEmployees,
    loadTools,
    loadAllData,
  }
}
