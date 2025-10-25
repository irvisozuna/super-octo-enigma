export const EQUIPMENT_TYPES = [
  { value: 'drill_rig', label: 'Perforadora', icon: '🔩', category: 'drilling' },
  { value: 'core_drill', label: 'Perforadora de núcleo', icon: '🔩', category: 'drilling' },
  { value: 'rotary_drill', label: 'Perforadora rotatoria', icon: '🔩', category: 'drilling' },
  { value: 'pump', label: 'Bomba', icon: '⚡', category: 'mechanical' },
  { value: 'generator', label: 'Generador', icon: '🔌', category: 'electrical' },
  { value: 'compressor', label: 'Compresor', icon: '💨', category: 'mechanical' },
  { value: 'crane', label: 'Grúa', icon: '🏗️', category: 'lifting' },
  { value: 'vehicle', label: 'Vehículo', icon: '🚗', category: 'lifting' },
  { value: 'other', label: 'Otro', icon: '🔧', category: 'misc' },

]

export const EQUIPMENT_STATUS = [
  { value: 'available', label: 'Disponible', color: '#10B981', bgColor: '#D1FAE5', icon: '✅' },
  { value: 'in_use', label: 'En Uso', color: '#3B82F6', bgColor: '#DBEAFE', icon: '⚡' },
  { value: 'maintenance', label: 'Mantenimiento', color: '#F59E0B', bgColor: '#FEF3C7', icon: '🔧' },
  { value: 'retired', label: 'Retirado', color: '#6B7280', bgColor: '#F3F4F6', icon: '❌' },
]

export const EQUIPMENT_CATEGORIES = [
  { value: 'drilling', label: 'Perforación', icon: '🔩', color: '#3B82F6' },
  { value: 'mechanical', label: 'Mecánico', icon: '⚡', color: '#10B981' },
  { value: 'electrical', label: 'Eléctrico', icon: '🔌', color: '#F59E0B' },
  { value: 'lifting', label: 'Elevación', icon: '🏗️', color: '#8B5CF6' },
  { value: 'misc', label: 'Misceláneo', icon: '🔧', color: '#6B7280' },
]

export const EQUIPMENT_CONDITIONS = [
  { value: 'excellent', label: 'Excelente', color: '#10B981', icon: '🟢' },
  { value: 'good', label: 'Bueno', color: '#3B82F6', icon: '🔵' },
  { value: 'fair', label: 'Regular', color: '#F59E0B', icon: '🟡' },
  { value: 'poor', label: 'Malo', color: '#EF4444', icon: '🔴' },
  { value: 'critical', label: 'Crítico', color: '#7C2D12', icon: '🚨' },
]

export const EQUIPMENT_MAINTENANCE_TYPES = [
  { value: 'preventive', label: 'Preventivo', color: '#10B981', icon: '🛠️' },
  { value: 'corrective', label: 'Correctivo', color: '#F59E0B', icon: '🔧' },
  { value: 'emergency', label: 'Emergencia', color: '#EF4444', icon: '🚨' },
  { value: 'scheduled', label: 'Programado', color: '#3B82F6', icon: '📅' },
  { value: 'predictive', label: 'Predictivo', color: '#8B5CF6', icon: '🔮' },
]

export const EQUIPMENT_POWER_RANGES = [
  { min: 0, max: 50, label: 'Baja Potencia (0-50HP)', color: '#10B981' },
  { min: 50, max: 200, label: 'Media Potencia (50-200HP)', color: '#3B82F6' },
  { min: 200, max: 500, label: 'Alta Potencia (200-500HP)', color: '#F59E0B' },
  { min: 500, max: 1000, label: 'Muy Alta Potencia (500-1000HP)', color: '#EF4444' },
  { min: 1000, max: Number.POSITIVE_INFINITY, label: 'Ultra Alta Potencia (>1000HP)', color: '#7C2D12' },
]

export const EQUIPMENT_CAPACITY_RANGES = [
  { min: 0, max: 100, label: 'Baja Capacidad (0-100)', color: '#10B981' },
  { min: 100, max: 500, label: 'Media Capacidad (100-500)', color: '#3B82F6' },
  { min: 500, max: 1000, label: 'Alta Capacidad (500-1000)', color: '#F59E0B' },
  { min: 1000, max: 5000, label: 'Muy Alta Capacidad (1000-5000)', color: '#EF4444' },
  { min: 5000, max: Number.POSITIVE_INFINITY, label: 'Ultra Alta Capacidad (>5000)', color: '#7C2D12' },
]

export const EQUIPMENT_WEIGHT_RANGES = [
  { min: 0, max: 1000, label: 'Ligero (0-1000kg)', color: '#10B981' },
  { min: 1000, max: 5000, label: 'Mediano (1000-5000kg)', color: '#3B82F6' },
  { min: 5000, max: 20000, label: 'Pesado (5000-20000kg)', color: '#F59E0B' },
  { min: 20000, max: 100000, label: 'Muy Pesado (20000-100000kg)', color: '#EF4444' },
  { min: 100000, max: Number.POSITIVE_INFINITY, label: 'Ultra Pesado (>100000kg)', color: '#7C2D12' },
]

export const EQUIPMENT_METRICS = {
  POWER_RANGES: EQUIPMENT_POWER_RANGES,
  CAPACITY_RANGES: EQUIPMENT_CAPACITY_RANGES,
  WEIGHT_RANGES: EQUIPMENT_WEIGHT_RANGES,
  COST_RANGES: [
    { min: 0, max: 10000, label: 'Económico (<$10K)', color: '#10B981' },
    { min: 10000, max: 50000, label: 'Medio ($10K-$50K)', color: '#3B82F6' },
    { min: 50000, max: 200000, label: 'Caro ($50K-$200K)', color: '#F59E0B' },
    { min: 200000, max: 1000000, label: 'Muy Caro ($200K-$1M)', color: '#EF4444' },
    { min: 1000000, max: Number.POSITIVE_INFINITY, label: 'Ultra Caro (>$1M)', color: '#7C2D12' },
  ],
  AGE_RANGES: [
    { min: 0, max: 2, label: 'Nuevo (0-2 años)', color: '#10B981' },
    { min: 2, max: 5, label: 'Joven (2-5 años)', color: '#3B82F6' },
    { min: 5, max: 10, label: 'Maduro (5-10 años)', color: '#F59E0B' },
    { min: 10, max: 20, label: 'Viejo (10-20 años)', color: '#EF4444' },
    { min: 20, max: Number.POSITIVE_INFINITY, label: 'Antiguo (>20 años)', color: '#7C2D12' },
  ],
}

export const EQUIPMENT_FILTERS = {
  TYPE: EQUIPMENT_TYPES,
  STATUS: EQUIPMENT_STATUS,
  CATEGORY: EQUIPMENT_CATEGORIES,
  CONDITION: EQUIPMENT_CONDITIONS,
  MAINTENANCE_TYPE: EQUIPMENT_MAINTENANCE_TYPES,
  POWER_RANGE: EQUIPMENT_METRICS.POWER_RANGES,
  CAPACITY_RANGE: EQUIPMENT_METRICS.CAPACITY_RANGES,
  WEIGHT_RANGE: EQUIPMENT_METRICS.WEIGHT_RANGES,
  COST_RANGE: EQUIPMENT_METRICS.COST_RANGES,
  AGE_RANGE: EQUIPMENT_METRICS.AGE_RANGES,
}

export const EQUIPMENT_PERMISSIONS = {
  CREATE: 'equipment.create',
  VIEW: 'equipment.view',
  UPDATE: 'equipment.update',
  DELETE: 'equipment.delete',
  ASSIGN: 'equipment.assign',
  MAINTAIN: 'equipment.maintain',
  RETIRE: 'equipment.retire',
  EXPORT: 'equipment.export',
}

export const EQUIPMENT_NOTIFICATIONS = {
  CREATED: 'equipment_created',
  UPDATED: 'equipment_updated',
  ASSIGNED: 'equipment_assigned',
  RETURNED: 'equipment_returned',
  MAINTENANCE_DUE: 'equipment_maintenance_due',
  MAINTENANCE_OVERDUE: 'equipment_maintenance_overdue',
  RETIRED: 'equipment_retired',
  WARRANTY_EXPIRING: 'equipment_warranty_expiring',
  WARRANTY_EXPIRED: 'equipment_warranty_expired',
  CONDITION_CRITICAL: 'equipment_condition_critical',
}
