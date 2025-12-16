import type { Tool } from '../../domain/entities/ToolEntity'
import { TOOL_CATEGORIES, TOOL_CONDITIONS, TOOL_MAINTENANCE_TYPES, TOOL_MATERIALS, TOOL_METRICS, TOOL_STATUS, TOOL_TYPES, TOOL_WEAR_PATTERNS } from '../constants/ToolConstants'

export function getToolTypeLabel(type: string): string {
  return TOOL_TYPES.find(t => t.value === type)?.label || type
}

export function getToolTypeIcon(type: string): string {
  return TOOL_TYPES.find(t => t.value === type)?.icon || '❓'
}

export function getToolTypeCategory(type: string): string {
  return TOOL_TYPES.find(t => t.value === type)?.category || 'misc'
}

export function getToolStatusLabel(status: string): string {
  return TOOL_STATUS.find(s => s.value === status)?.label || status
}

export function getToolStatusColor(status: string): string {
  return TOOL_STATUS.find(s => s.value === status)?.color || '#6B7280'
}

export function getToolStatusBgColor(status: string): string {
  return TOOL_STATUS.find(s => s.value === status)?.bgColor || '#F3F4F6'
}

export function getToolStatusIcon(status: string): string {
  return TOOL_STATUS.find(s => s.value === status)?.icon || '❓'
}

export function getToolCategoryLabel(category: string): string {
  return TOOL_CATEGORIES.find(c => c.value === category)?.label || category
}

export function getToolCategoryIcon(category: string): string {
  return TOOL_CATEGORIES.find(c => c.value === category)?.icon || '❓'
}

export function getToolCategoryColor(category: string): string {
  return TOOL_CATEGORIES.find(c => c.value === category)?.color || '#6B7280'
}

export function getToolMaterialLabel(material: string): string {
  return TOOL_MATERIALS.find(m => m.value === material)?.label || material
}

export function getToolMaterialColor(material: string): string {
  return TOOL_MATERIALS.find(m => m.value === material)?.color || '#6B7280'
}

export function getToolConditionLabel(condition: string): string {
  return TOOL_CONDITIONS.find(c => c.value === condition)?.label || condition
}

export function getToolConditionColor(condition: string): string {
  return TOOL_CONDITIONS.find(c => c.value === condition)?.color || '#6B7280'
}

export function getToolConditionIcon(condition: string): string {
  return TOOL_CONDITIONS.find(c => c.value === condition)?.icon || '❓'
}

export function getToolWearPatternLabel(pattern: string): string {
  return TOOL_WEAR_PATTERNS.find(p => p.value === pattern)?.label || pattern
}

export function getToolWearPatternIcon(pattern: string): string {
  return TOOL_WEAR_PATTERNS.find(p => p.value === pattern)?.icon || '❓'
}

export function getToolMaintenanceTypeLabel(type: string): string {
  return TOOL_MAINTENANCE_TYPES.find(t => t.value === type)?.label || type
}

export function getToolMaintenanceTypeColor(type: string): string {
  return TOOL_MAINTENANCE_TYPES.find(t => t.value === type)?.color || '#6B7280'
}

export function getToolMaintenanceTypeIcon(type: string): string {
  return TOOL_MAINTENANCE_TYPES.find(t => t.value === type)?.icon || '❓'
}

export function getToolDiameterCategory(diameter: number): string {
  const category = TOOL_METRICS.DIAMETER_RANGES.find(r => diameter >= r.min && diameter < r.max)

  return category?.label || 'No especificado'
}

export function getToolLengthCategory(length: number): string {
  const category = TOOL_METRICS.LENGTH_RANGES.find(r => length >= r.min && length < r.max)

  return category?.label || 'No especificado'
}

export function getToolWeightCategory(weight: number): string {
  const category = TOOL_METRICS.WEIGHT_RANGES.find(r => weight >= r.min && weight < r.max)

  return category?.label || 'No especificado'
}

export function getToolCostCategory(cost: number): string {
  const category = TOOL_METRICS.COST_RANGES.find(r => cost >= r.min && cost < r.max)

  return category?.label || 'No especificado'
}

export function isToolAvailable(tool: Tool): boolean {
  return tool.status === 'available'
}

export function isToolInUse(tool: Tool): boolean {
  return tool.status === 'in_use'
}

export function isToolInMaintenance(tool: Tool): boolean {
  return tool.status === 'maintenance'
}

export function isToolRetired(tool: Tool): boolean {
  return tool.status === 'retired'
}

export function isToolWarrantyExpired(tool: Tool): boolean {
  if (!tool.warranty_expiry)
    return false

  const expiryDate = new Date(tool.warranty_expiry)
  const now = new Date()

  return now > expiryDate
}

export function isToolWarrantyExpiring(tool: Tool, daysThreshold = 30): boolean {
  if (!tool.warranty_expiry)
    return false

  const expiryDate = new Date(tool.warranty_expiry)
  const now = new Date()
  const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000))

  return expiryDate <= thresholdDate && expiryDate > now
}

export function formatToolDiameter(diameter: number, unit = 'in'): string {
  return `${diameter.toFixed(1)} ${unit}`
}

export function formatToolLength(length: number, unit = 'm'): string {
  return `${length.toFixed(1)} ${unit}`
}

export function formatToolWeight(weight: number, unit = 'kg'): string {
  return `${weight.toFixed(1)} ${unit}`
}

export function formatToolCost(cost: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cost)
}

export function getToolStatusBadgeClass(status: string): string {
  const statusConfig = TOOL_STATUS.find(s => s.value === status)
  if (!statusConfig)
    return 'bg-gray-100 text-gray-800'

  const colorMap: Record<string, string> = {
    '#10B981': 'bg-green-100 text-green-800',
    '#3B82F6': 'bg-blue-100 text-blue-800',
    '#F59E0B': 'bg-yellow-100 text-yellow-800',
    '#6B7280': 'bg-gray-100 text-gray-800',
  }

  return colorMap[statusConfig.color] || 'bg-gray-100 text-gray-800'
}

export function getToolConditionBadgeClass(condition: string): string {
  const conditionConfig = TOOL_CONDITIONS.find(c => c.value === condition)
  if (!conditionConfig)
    return 'bg-gray-100 text-gray-800'

  const colorMap: Record<string, string> = {
    '#10B981': 'bg-green-100 text-green-800',
    '#3B82F6': 'bg-blue-100 text-blue-800',
    '#F59E0B': 'bg-yellow-100 text-yellow-800',
    '#EF4444': 'bg-red-100 text-red-800',
    '#7C2D12': 'bg-red-200 text-red-900',
  }

  return colorMap[conditionConfig.color] || 'bg-gray-100 text-gray-800'
}

export function sortToolsByStatus(tools: Tool[]): Tool[] {
  const statusOrder = ['available', 'in_use', 'maintenance', 'retired']

  return tools.sort((a, b) => {
    const aIndex = statusOrder.indexOf(a.status)
    const bIndex = statusOrder.indexOf(b.status)

    if (aIndex === -1 && bIndex === -1)
      return 0
    if (aIndex === -1)
      return 1
    if (bIndex === -1)
      return -1

    return aIndex - bIndex
  })
}

export function sortToolsByCondition(tools: Tool[]): Tool[] {
  const conditionOrder = ['excellent', 'good', 'fair', 'poor', 'critical']

  return tools.sort((a, b) => {
    const aIndex = conditionOrder.indexOf(a.status)
    const bIndex = conditionOrder.indexOf(b.status)

    if (aIndex === -1 && bIndex === -1)
      return 0
    if (aIndex === -1)
      return 1
    if (bIndex === -1)
      return -1

    return aIndex - bIndex
  })
}

export function filterToolsByStatus(tools: Tool[], status: string): Tool[] {
  return tools.filter(tool => tool.status === status)
}

export function filterToolsByType(tools: Tool[], type: string): Tool[] {
  return tools.filter(tool => tool.tool_type === type)
}

export function filterToolsByCategory(tools: Tool[], category: string): Tool[] {
  return tools.filter(tool => {
    const toolType = TOOL_TYPES.find(t => t.value === tool.tool_type)

    return toolType?.category === category
  })
}

export function searchTools(tools: Tool[], query: string): Tool[] {
  if (!query.trim())
    return tools

  const lowercaseQuery = query.toLowerCase()

  return tools.filter(tool =>
    tool.name.toLowerCase().includes(lowercaseQuery)
    || tool.manufacturer.toLowerCase().includes(lowercaseQuery)
    || tool.model.toLowerCase().includes(lowercaseQuery)
    || tool.serial_number.toLowerCase().includes(lowercaseQuery)
    || tool.location.toLowerCase().includes(lowercaseQuery),
  )
}

/**
 * Mapea tool_type (de la API) a tool_category (del wizard)
 * @param toolType - El tipo de herramienta desde la API (type, tool_type, etc.)
 * @param toolName - Opcional: nombre de la herramienta para ayudar en el mapeo
 * @returns La categoría correspondiente para el wizard o null si no hay mapeo
 */
export function mapToolTypeToCategory(toolType: string | undefined | null, toolName?: string): string | null {
  if (!toolType)
    return null

  const normalizedType = toolType.toLowerCase().trim()
  const normalizedName = toolName?.toLowerCase().trim() || ''

  // Mapeo directo de tipos específicos
  const directMapping: Record<string, string> = {
    diamond_bit: 'diamond_bit',
    tricone: 'tricone',
    tricone_bit: 'tricone',
    reamer: 'reamer',
    drill_pipe: 'drill_pipe',
    pipe: 'drill_pipe',
  }

  if (directMapping[normalizedType])
    return directMapping[normalizedType]

  // Si el tipo es 'drill_bit', intentar determinar por el nombre
  if (normalizedType === 'drill_bit') {
    // Si el nombre contiene "tricone" o "tricono", es tricone
    if (normalizedName.includes('tricone') || normalizedName.includes('tricono'))
      return 'tricone'

    // Si el nombre contiene "diamond" o "diamante", es diamond_bit
    if (normalizedName.includes('diamond') || normalizedName.includes('diamante'))
      return 'diamond_bit'

    // Por defecto, usar diamond_bit (el usuario puede cambiarlo manualmente)
    return 'diamond_bit'
  }

  // Mapeo de otros tipos genéricos
  const genericMapping: Record<string, string> = {
    casing: 'drill_pipe',
    pump: 'drill_pipe', // O la categoría apropiada según el contexto
    other: null, // No mapear 'other', dejar que el usuario seleccione
  }

  return genericMapping[normalizedType] || null
}
