import type { Well } from '../../domain/entities/WellEntity'
import { WELL_DIAMETER_OPTIONS, WELL_ENVIRONMENTAL_CONDITIONS, WELL_GEOLOGY_TYPES, WELL_METRICS, WELL_PHASES, WELL_STATUS, WELL_TYPES } from '../constants/WellConstants'

export function getWellStatusLabel(status: string): string {
  return WELL_STATUS.find(s => s.value === status)?.label || status
}

export function getWellStatusColor(status: string): string {
  return WELL_STATUS.find(s => s.value === status)?.color || '#6B7280'
}

export function getWellStatusBgColor(status: string): string {
  return WELL_STATUS.find(s => s.value === status)?.bgColor || '#F3F4F6'
}

export function getWellStatusIcon(status: string): string {
  return WELL_STATUS.find(s => s.value === status)?.icon || '❓'
}

export function getWellTypeLabel(type: string): string {
  return WELL_TYPES.find(t => t.value === type)?.label || type
}

export function getWellTypeIcon(type: string): string {
  return WELL_TYPES.find(t => t.value === type)?.icon || '❓'
}

export function getWellTypeDescription(type: string): string {
  return WELL_TYPES.find(t => t.value === type)?.description || ''
}

export function getWellPhaseLabel(phase: string): string {
  return WELL_PHASES.find(p => p.value === phase)?.label || phase
}

export function getWellPhaseIcon(phase: string): string {
  return WELL_PHASES.find(p => p.value === phase)?.icon || '❓'
}

export function getWellPhaseDescription(phase: string): string {
  return WELL_PHASES.find(p => p.value === phase)?.description || ''
}

export function getWellGeologyLabel(geology: string): string {
  return WELL_GEOLOGY_TYPES.find(g => g.value === geology)?.label || geology
}

export function getWellGeologyColor(geology: string): string {
  return WELL_GEOLOGY_TYPES.find(g => g.value === geology)?.color || '#6B7280'
}

export function getWellEnvironmentalLabel(environment: string): string {
  return WELL_ENVIRONMENTAL_CONDITIONS.find(e => e.value === environment)?.label || environment
}

export function getWellEnvironmentalColor(environment: string): string {
  return WELL_ENVIRONMENTAL_CONDITIONS.find(e => e.value === environment)?.color || '#6B7280'
}

export function getWellEnvironmentalIcon(environment: string): string {
  return WELL_ENVIRONMENTAL_CONDITIONS.find(e => e.value === environment)?.icon || '❓'
}

export function getWellDepthCategory(depth: number): string {
  const category = WELL_METRICS.DEPTH_RANGES.find(r => depth >= r.min && depth < r.max)

  return category?.label || 'No especificado'
}

export function getWellDiameterCategory(diameter: number): string {
  const category = WELL_METRICS.DIAMETER_RANGES.find(r => diameter >= r.min && diameter < r.max)

  return category?.label || 'No especificado'
}

export function getWellCostCategory(cost: number): string {
  const category = WELL_METRICS.COST_RANGES.find(r => cost >= r.min && cost < r.max)

  return category?.label || 'No especificado'
}

export function calculateWellProgress(well: Well): number {
  if (!well.depth_planned || !well.depth_actual)
    return 0

  return Math.round((well.depth_actual / well.depth_planned) * 100)
}

export function getWellDepthRemaining(well: Well): number {
  if (!well.depth_planned || !well.depth_actual)
    return well.depth_planned || 0

  return Math.max(0, well.depth_planned - well.depth_actual)
}

export function isWellCompleted(well: Well): boolean {
  return well.status === 'completed' || (well.depth_actual && well.depth_planned && well.depth_actual >= well.depth_planned)
}

export function isWellOverdue(well: Well): boolean {
  if (!well.start_date || !well.completion_date)
    return false

  const completionDate = new Date(well.completion_date)
  const now = new Date()

  return now > completionDate && well.status !== 'completed'
}

export function formatWellDepth(depth: number, unit = 'm'): string {
  return `${depth.toLocaleString()} ${unit}`
}

/**
 * Obtiene el código de diámetro desde un valor en pulgadas
 * @param inches - Valor en pulgadas
 * @returns Código del diámetro o null si no coincide con ninguna opción
 */
export function getDiameterCodeFromInches(inches: number | null | undefined): string | null {
  if (inches === null || inches === undefined)
    return null

  // Buscar la opción que coincida con el valor (con tolerancia de 0.01 para errores de redondeo)
  const option = WELL_DIAMETER_OPTIONS.find(opt => Math.abs(opt.inches - inches) < 0.01)

  return option?.code || null
}

/**
 * Obtiene el valor en pulgadas desde un código de diámetro
 * @param code - Código del diámetro (BQ, NQ, etc.)
 * @returns Valor en pulgadas o null si el código no existe
 */
export function getDiameterInchesFromCode(code: string | null | undefined): number | null {
  if (!code)
    return null

  const option = WELL_DIAMETER_OPTIONS.find(opt => opt.code === code)

  return option?.inches || null
}

/**
 * Formatea el diámetro mostrando el código y el valor en pulgadas si hay código conocido,
 * o solo el valor numérico si no hay código
 * @param diameter - Valor en pulgadas o código del diámetro
 * @param unit - Unidad de medida (default: 'in')
 * @returns String formateado (ej: "BQ (2.36")" o "2.36 in")
 */
export function formatWellDiameter(diameter: number | string | null | undefined, unit = 'in'): string {
  if (diameter === null || diameter === undefined)
    return '-'

  // Si es un string, podría ser un código
  if (typeof diameter === 'string') {
    const inches = getDiameterInchesFromCode(diameter)
    if (inches !== null) {
      const option = WELL_DIAMETER_OPTIONS.find(opt => opt.code === diameter)

      return option?.label || `${diameter} (${inches.toFixed(2)}${unit})`
    }

    // Si no es un código válido, tratar como número
    const numValue = Number.parseFloat(diameter)
    if (!isNaN(numValue))
      return `${numValue.toFixed(2)} ${unit}`

    return '-'
  }

  // Si es un número, buscar si corresponde a un código conocido
  const code = getDiameterCodeFromInches(diameter)
  if (code) {
    const option = WELL_DIAMETER_OPTIONS.find(opt => opt.code === code)

    return option?.label || `${code} (${diameter.toFixed(2)}${unit})`
  }

  // Si no hay código, mostrar solo el número
  return `${diameter.toFixed(2)} ${unit}`
}

export function formatWellCost(cost: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cost)
}

export function getWellStatusBadgeClass(status: string): string {
  const statusConfig = WELL_STATUS.find(s => s.value === status)
  if (!statusConfig)
    return 'bg-gray-100 text-gray-800'

  const colorMap: Record<string, string> = {
    '#6B7280': 'bg-gray-100 text-gray-800',
    '#3B82F6': 'bg-blue-100 text-blue-800',
    '#10B981': 'bg-green-100 text-green-800',
    '#EF4444': 'bg-red-100 text-red-800',
  }

  return colorMap[statusConfig.color] || 'bg-gray-100 text-gray-800'
}

export function getWellTypeBadgeClass(type: string): string {
  const typeConfig = WELL_TYPES.find(t => t.value === type)
  if (!typeConfig)
    return 'bg-gray-100 text-gray-800'

  return 'bg-blue-100 text-blue-800'
}

export function sortWellsByStatus(wells: Well[]): Well[] {
  const statusOrder = ['drilling', 'planned', 'completed', 'abandoned']

  return wells.sort((a, b) => {
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

export function sortWellsByDepth(wells: Well[]): Well[] {
  return wells.sort((a, b) => (b.depth_actual || 0) - (a.depth_actual || 0))
}

export function filterWellsByStatus(wells: Well[], status: string): Well[] {
  return wells.filter(well => well.status === status)
}

export function filterWellsByType(wells: Well[], type: string): Well[] {
  return wells.filter(well => well.well_type === type)
}

export function searchWells(wells: Well[], query: string): Well[] {
  if (!query.trim())
    return wells

  const lowercaseQuery = query.toLowerCase()

  return wells.filter(well =>
    well.name.toLowerCase().includes(lowercaseQuery)
    || well.project_name.toLowerCase().includes(lowercaseQuery),
  )
}
