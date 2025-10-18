/**
 * Label Utilities
 *
 * Utility functions for getting labels and icons
 */

import {
  ACTIVITY_TYPES,
  CONSUMABLE_TYPES,
  MATRIX_CONDITIONS,
  SHIFTS,
  SIGNATURE_TYPES,
  TOOL_CATEGORIES,
  WEAR_PATTERNS,
} from '../constants/DrillingConstants'

// Activity type utilities
export const getActivityIcon = (activityType: string): string => {
  const activity = ACTIVITY_TYPES.find(a => a.value === activityType)

  return activity?.icon || 'mdi-help-circle'
}

export const getActivityTypeLabel = (activityType: string): string => {
  const activity = ACTIVITY_TYPES.find(a => a.value === activityType)

  return activity?.label || activityType
}

// Consumable type utilities
export const getConsumableIcon = (consumableType: string): string => {
  const consumable = CONSUMABLE_TYPES.find(c => c.value === consumableType)

  return consumable?.icon || 'mdi-package-variant'
}

export const getConsumableTypeLabel = (consumableType: string): string => {
  const consumable = CONSUMABLE_TYPES.find(c => c.value === consumableType)

  return consumable?.label || consumableType
}

// Tool category utilities
export const getToolCategoryIcon = (category: string): string => {
  const toolCategory = TOOL_CATEGORIES.find(t => t.value === category)

  return toolCategory?.icon || 'mdi-tools'
}

export const getToolCategoryLabel = (category: string): string => {
  const toolCategory = TOOL_CATEGORIES.find(t => t.value === category)

  return toolCategory?.label || category
}

// Tool status utilities
export const getToolStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    available: 'success',
    in_use: 'warning',
    maintenance: 'error',
    retired: 'grey',
  }

  return statusColors[status] || 'grey'
}

export const getToolStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    in_use: 'En Uso',
    maintenance: 'Mantenimiento',
    retired: 'Retirado',
  }

  return statusLabels[status] || status
}

// Wear pattern utilities
export const getWearPatternIcon = (pattern: string): string => {
  const wearPattern = WEAR_PATTERNS.find(w => w.value === pattern)

  return wearPattern?.icon || 'mdi-help-circle'
}

export const getWearPatternLabel = (pattern: string): string => {
  const wearPattern = WEAR_PATTERNS.find(w => w.value === pattern)

  return wearPattern?.label || pattern
}

export const getWearPatternDescription = (pattern: string): string => {
  const wearPattern = WEAR_PATTERNS.find(w => w.value === pattern)

  return wearPattern?.description || ''
}

// Matrix condition utilities
export const getMatrixConditionIcon = (condition: string): string => {
  const matrixCondition = MATRIX_CONDITIONS.find(m => m.value === condition)

  return matrixCondition?.icon || 'mdi-help-circle'
}

export const getMatrixConditionLabel = (condition: string): string => {
  const matrixCondition = MATRIX_CONDITIONS.find(m => m.value === condition)

  return matrixCondition?.label || condition
}

export const getMatrixConditionColor = (condition: string): string => {
  const matrixCondition = MATRIX_CONDITIONS.find(m => m.value === condition)

  return matrixCondition?.color || '#6B7280'
}

export const getMatrixConditionDescription = (condition: string): string => {
  const matrixCondition = MATRIX_CONDITIONS.find(m => m.value === condition)

  return matrixCondition?.description || ''
}

// Signature type utilities
export const getSignatureTypeIcon = (type: string): string => {
  const signatureType = SIGNATURE_TYPES.find(s => s.value === type)

  return signatureType?.icon || 'mdi-signature'
}

export const getSignatureTypeLabel = (type: string): string => {
  const signatureType = SIGNATURE_TYPES.find(s => s.value === type)

  return signatureType?.label || type
}

export const getSignatureTypeDescription = (type: string): string => {
  const signatureType = SIGNATURE_TYPES.find(s => s.value === type)

  return signatureType?.description || ''
}

export const getSignatureTypeRequired = (type: string): boolean => {
  const signatureType = SIGNATURE_TYPES.find(s => s.value === type)

  return signatureType?.required || false
}

// Signature method utilities
export const getSignatureMethodIcon = (method: string): string => {
  const methodIcons: Record<string, string> = {
    digital: 'mdi-signature',
    physical: 'mdi-pen',
    electronic: 'mdi-certificate',
  }

  return methodIcons[method] || 'mdi-signature'
}

export const getSignatureMethodLabel = (method: string): string => {
  const methodLabels: Record<string, string> = {
    digital: 'Digital',
    physical: 'Física',
    electronic: 'Electrónica',
  }

  return methodLabels[method] || method
}

// Shift utilities
export const getShiftIcon = (shift: string): string => {
  const shiftData = SHIFTS.find(s => s.value === shift)

  return shiftData?.icon || 'mdi-help-circle'
}

export const getShiftLabel = (shift: string): string => {
  const shiftData = SHIFTS.find(s => s.value === shift)

  return shiftData?.label || shift
}

export const getShiftColor = (shift: string): string => {
  const shiftData = SHIFTS.find(s => s.value === shift)

  return shiftData?.color || '#6B7280'
}

// Unit utilities
export const getUnitIcon = (unit: string): string => {
  const unitIcons: Record<string, string> = {
    kg: 'mdi-weight',
    bags: 'mdi-package-variant',
    liters: 'mdi-water',
    gallons: 'mdi-water',
    units: 'mdi-counter',
    meters: 'mdi-ruler',
    pieces: 'mdi-counter',
  }

  return unitIcons[unit] || 'mdi-help-circle'
}

export const getUnitLabel = (unit: string): string => {
  const unitLabels: Record<string, string> = {
    kg: 'Kilogramos',
    bags: 'Sacos',
    liters: 'Litros',
    gallons: 'Galones',
    units: 'Unidades',
    meters: 'Metros',
    pieces: 'Piezas',
  }

  return unitLabels[unit] || unit
}

export const getUnitSymbol = (unit: string): string => {
  const unitSymbols: Record<string, string> = {
    kg: 'kg',
    bags: 'bags',
    liters: 'L',
    gallons: 'gal',
    units: 'u',
    meters: 'm',
    pieces: 'pcs',
  }

  return unitSymbols[unit] || unit
}

// Report status utilities
export const getReportStatusIcon = (status: string): string => {
  const statusIcons: Record<string, string> = {
    draft: 'mdi-pencil',
    completed: 'mdi-check-circle',
    approved: 'mdi-check',
    rejected: 'mdi-close-circle',
  }

  return statusIcons[status] || 'mdi-help-circle'
}

export const getReportStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    draft: 'Borrador',
    completed: 'Completado',
    approved: 'Aprobado',
    rejected: 'Rechazado',
  }

  return statusLabels[status] || status
}

export const getReportStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    draft: '#FCD34D',
    completed: '#60A5FA',
    approved: '#34D399',
    rejected: '#F87171',
  }

  return statusColors[status] || '#6B7280'
}

export const getReportStatusBgColor = (status: string): string => {
  const statusBgColors: Record<string, string> = {
    draft: '#FEF3C7',
    completed: '#DBEAFE',
    approved: '#D1FAE5',
    rejected: '#FEE2E2',
  }

  return statusBgColors[status] || '#F3F4F6'
}

// Generic utilities
export const getDisplayName = (item: any, nameField: string = 'name'): string => {
  return item?.[nameField] || 'Sin nombre'
}

export const getDisplayValue = (value: any, fallback: string = 'N/A'): string => {
  return value !== null && value !== undefined ? String(value) : fallback
}

export const formatNumber = (value: number, decimals: number = 2): string => {
  if (isNaN(value))
    return '0'

  return value.toFixed(decimals)
}

export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (isNaN(value))
    return '0%'

  return `${value.toFixed(decimals)}%`
}

export const getCapacityPercentage = (used: number, total: number): number => {
  if (!total || total === 0)
    return 0

  return Math.round((used / total) * 100)
}

export const getCapacityStatus = (percentage: number): string => {
  if (percentage >= 90)
    return 'critical'
  if (percentage >= 70)
    return 'warning'
  if (percentage >= 50)
    return 'info'

  return 'success'
}

export const getCapacityColor = (percentage: number): string => {
  if (percentage >= 90)
    return '#DC2626'
  if (percentage >= 70)
    return '#F59E0B'
  if (percentage >= 50)
    return '#3B82F6'

  return '#10B981'
}
