import type { Equipment } from '../../domain/entities/EquipmentEntity'
import { EQUIPMENT_CATEGORIES, EQUIPMENT_CONDITIONS, EQUIPMENT_MAINTENANCE_TYPES, EQUIPMENT_METRICS, EQUIPMENT_STATUS, EQUIPMENT_TYPES } from '../constants/EquipmentConstants'

export function getEquipmentTypeLabel(type: string): string {
  return EQUIPMENT_TYPES.find(t => t.value === type)?.label || type
}

export function getEquipmentTypeIcon(type: string): string {
  return EQUIPMENT_TYPES.find(t => t.value === type)?.icon || '❓'
}

export function getEquipmentTypeCategory(type: string): string {
  return EQUIPMENT_TYPES.find(t => t.value === type)?.category || 'misc'
}

export function getEquipmentStatusLabel(status: string): string {
  return EQUIPMENT_STATUS.find(s => s.value === status)?.label || status
}

export function getEquipmentStatusColor(status: string): string {
  return EQUIPMENT_STATUS.find(s => s.value === status)?.color || '#6B7280'
}

export function getEquipmentStatusBgColor(status: string): string {
  return EQUIPMENT_STATUS.find(s => s.value === status)?.bgColor || '#F3F4F6'
}

export function getEquipmentStatusIcon(status: string): string {
  return EQUIPMENT_STATUS.find(s => s.value === status)?.icon || '❓'
}

export function getEquipmentCategoryLabel(category: string): string {
  return EQUIPMENT_CATEGORIES.find(c => c.value === category)?.label || category
}

export function getEquipmentCategoryIcon(category: string): string {
  return EQUIPMENT_CATEGORIES.find(c => c.value === category)?.icon || '❓'
}

export function getEquipmentCategoryColor(category: string): string {
  return EQUIPMENT_CATEGORIES.find(c => c.value === category)?.color || '#6B7280'
}

export function getEquipmentConditionLabel(condition: string): string {
  return EQUIPMENT_CONDITIONS.find(c => c.value === condition)?.label || condition
}

export function getEquipmentConditionColor(condition: string): string {
  return EQUIPMENT_CONDITIONS.find(c => c.value === condition)?.color || '#6B7280'
}

export function getEquipmentConditionIcon(condition: string): string {
  return EQUIPMENT_CONDITIONS.find(c => c.value === condition)?.icon || '❓'
}

export function getEquipmentMaintenanceTypeLabel(type: string): string {
  return EQUIPMENT_MAINTENANCE_TYPES.find(t => t.value === type)?.label || type
}

export function getEquipmentMaintenanceTypeColor(type: string): string {
  return EQUIPMENT_MAINTENANCE_TYPES.find(t => t.value === type)?.color || '#6B7280'
}

export function getEquipmentMaintenanceTypeIcon(type: string): string {
  return EQUIPMENT_MAINTENANCE_TYPES.find(t => t.value === type)?.icon || '❓'
}

export function getEquipmentPowerCategory(power: number): string {
  const category = EQUIPMENT_METRICS.POWER_RANGES.find(r => power >= r.min && power < r.max)

  return category?.label || 'No especificado'
}

export function getEquipmentCapacityCategory(capacity: number): string {
  const category = EQUIPMENT_METRICS.CAPACITY_RANGES.find(r => capacity >= r.min && capacity < r.max)

  return category?.label || 'No especificado'
}

export function getEquipmentWeightCategory(weight: number): string {
  const category = EQUIPMENT_METRICS.WEIGHT_RANGES.find(r => weight >= r.min && weight < r.max)

  return category?.label || 'No especificado'
}

export function getEquipmentCostCategory(cost: number): string {
  const category = EQUIPMENT_METRICS.COST_RANGES.find(r => cost >= r.min && cost < r.max)

  return category?.label || 'No especificado'
}

export function getEquipmentAgeCategory(age: number): string {
  const category = EQUIPMENT_METRICS.AGE_RANGES.find(r => age >= r.min && age < r.max)

  return category?.label || 'No especificado'
}

export function isEquipmentAvailable(equipment: Equipment): boolean {
  return equipment.status === 'available'
}

export function isEquipmentInUse(equipment: Equipment): boolean {
  return equipment.status === 'in_use'
}

export function isEquipmentInMaintenance(equipment: Equipment): boolean {
  return equipment.status === 'maintenance'
}

export function isEquipmentRetired(equipment: Equipment): boolean {
  return equipment.status === 'retired'
}

export function isEquipmentWarrantyExpired(equipment: Equipment): boolean {
  if (!equipment.warranty_expiry)
    return false

  const expiryDate = new Date(equipment.warranty_expiry)
  const now = new Date()

  return now > expiryDate
}

export function isEquipmentWarrantyExpiring(equipment: Equipment, daysThreshold = 30): boolean {
  if (!equipment.warranty_expiry)
    return false

  const expiryDate = new Date(equipment.warranty_expiry)
  const now = new Date()
  const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000))

  return expiryDate <= thresholdDate && expiryDate > now
}

export function calculateEquipmentAge(equipment: Equipment): number {
  if (!equipment.purchase_date)
    return 0

  const purchaseDate = new Date(equipment.purchase_date)
  const now = new Date()

  return Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
}

export function formatEquipmentPower(power: number, unit = 'HP'): string {
  return `${power.toFixed(1)} ${unit}`
}

export function formatEquipmentCapacity(capacity: number, unit = 'units'): string {
  return `${capacity.toLocaleString()} ${unit}`
}

export function formatEquipmentWeight(weight: number, unit = 'kg'): string {
  return `${weight.toLocaleString()} ${unit}`
}

export function formatEquipmentCost(cost: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cost)
}

export function getEquipmentStatusBadgeClass(status: string): string {
  const statusConfig = EQUIPMENT_STATUS.find(s => s.value === status)
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

export function getEquipmentConditionBadgeClass(condition: string): string {
  const conditionConfig = EQUIPMENT_CONDITIONS.find(c => c.value === condition)
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

export function sortEquipmentByStatus(equipment: Equipment[]): Equipment[] {
  const statusOrder = ['available', 'in_use', 'maintenance', 'retired']

  return equipment.sort((a, b) => {
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

export function sortEquipmentByCondition(equipment: Equipment[]): Equipment[] {
  const conditionOrder = ['excellent', 'good', 'fair', 'poor', 'critical']

  return equipment.sort((a, b) => {
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

export function filterEquipmentByStatus(equipment: Equipment[], status: string): Equipment[] {
  return equipment.filter(eq => eq.status === status)
}

export function filterEquipmentByType(equipment: Equipment[], type: string): Equipment[] {
  return equipment.filter(eq => eq.equipment_type === type)
}

export function filterEquipmentByCategory(equipment: Equipment[], category: string): Equipment[] {
  return equipment.filter(eq => {
    const equipmentType = EQUIPMENT_TYPES.find(t => t.value === eq.equipment_type)

    return equipmentType?.category === category
  })
}

export function searchEquipment(equipment: Equipment[], query: string): Equipment[] {
  if (!query.trim())
    return equipment

  const lowercaseQuery = query.toLowerCase()

  return equipment.filter(eq =>
    eq.name.toLowerCase().includes(lowercaseQuery)
    || eq.manufacturer.toLowerCase().includes(lowercaseQuery)
    || eq.model.toLowerCase().includes(lowercaseQuery)
    || eq.serial_number.toLowerCase().includes(lowercaseQuery)
    || eq.location.toLowerCase().includes(lowercaseQuery),
  )
}
