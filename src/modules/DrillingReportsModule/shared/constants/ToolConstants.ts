export const TOOL_TYPES = [
  { value: 'drill_bit', label: 'Broca de Perforación', icon: '🔩', category: 'drilling', translationKey: 'DrillingReportsModule.toolCategory.drill_bit' },
  { value: 'casing', label: 'Revestimiento', icon: '🛡️', category: 'protection', translationKey: 'DrillingReportsModule.tools.casing' },
  { value: 'cement', label: 'Cemento', icon: '🧱', category: 'sealing', translationKey: 'DrillingReportsModule.consumableType.cement' },
  { value: 'mud', label: 'Lodo', icon: '🌊', category: 'fluid', translationKey: 'DrillingReportsModule.tools.mud' },
  { value: 'pump', label: 'Bomba', icon: '⚡', category: 'mechanical', translationKey: 'DrillingReportsModule.tools.pump' },
  { value: 'other', label: 'Otro', icon: '🔧', category: 'misc', translationKey: 'DrillingReportsModule.common.other' },
]

export const TOOL_STATUS = [
  { value: 'available', label: 'Disponible', color: '#10B981', bgColor: '#D1FAE5', icon: '✅', translationKey: 'DrillingReportsModule.common.available' },
  { value: 'in_use', label: 'En Uso', color: '#3B82F6', bgColor: '#DBEAFE', icon: '⚡', translationKey: 'DrillingReportsModule.tools.inUse' },
  { value: 'maintenance', label: 'Mantenimiento', color: '#F59E0B', bgColor: '#FEF3C7', icon: '🔧', translationKey: 'DrillingReportsModule.common.maintenance' },
  { value: 'retired', label: 'Retirado', color: '#6B7280', bgColor: '#F3F4F6', icon: '❌', translationKey: 'DrillingReportsModule.common.retired' },
  { value: 'lost', label: 'Perdido', color: '#EF4444', bgColor: '#FEE2E2', icon: '🚫', translationKey: 'DrillingReportsModule.tools.lost' },
  { value: 'damaged', label: 'Dañado', color: '#7C2D12', bgColor: '#FEF2F2', icon: '⚠️', translationKey: 'DrillingReportsModule.tools.damaged' },
]

export const TOOL_CATEGORIES = [
  { value: 'drilling', label: 'Perforación', icon: '🔩', color: '#3B82F6' },
  { value: 'protection', label: 'Protección', icon: '🛡️', color: '#10B981' },
  { value: 'sealing', label: 'Sellado', icon: '🧱', color: '#F59E0B' },
  { value: 'fluid', label: 'Fluido', icon: '🌊', color: '#8B5CF6' },
  { value: 'mechanical', label: 'Mecánico', icon: '⚡', color: '#EF4444' },
  { value: 'misc', label: 'Misceláneo', icon: '🔧', color: '#6B7280' },
]

// Tool categories for report wizard
export const TOOL_WIZARD_CATEGORIES = [
  {
    title: 'Broca de diamante',
    value: 'diamond_bit',
    icon: 'tabler-diamond',
    color: '#8B5CF6',
    category: 'drilling_bit',
    translationKey: 'DrillingReportsModule.tools.drill_bit_diamond',
  },
  {
    title: 'Tricono',
    value: 'tricone',
    icon: 'tabler-circle',
    color: '#3B82F6',
    category: 'drilling_bit',
    translationKey: 'DrillingReportsModule.tools.drill_bit_tricone',
  },
  {
    title: 'Escariador',
    value: 'reamer',
    icon: 'tabler-tool',
    color: '#F59E0B',
    category: 'drilling_tool',
    translationKey: 'DrillingReportsModule.tools.reamer',
  },
  {
    title: 'Tubería de perforación',
    value: 'drill_pipe',
    icon: 'tabler-pipe',
    color: '#10B981',
    category: 'pipe',
    translationKey: 'DrillingReportsModule.tools.drill_pipe',
  },
]

export const TOOL_MATERIALS = [
  { value: 'drill_bit_pdc', label: 'PDC Bit', color: '#6B7280', translationKey: 'DrillingReportsModule.tools.drill_bit_pdc' },
  { value: 'drill_bit_tricone', label: 'Tricone Bit', color: '#374151', translationKey: 'DrillingReportsModule.tools.drill_bit_tricone' },
  { value: 'drill_bit_diamond', label: 'Diamond Bit', color: '#8B5CF6', translationKey: 'DrillingReportsModule.tools.drill_bit_diamond' },
  { value: 'casing', label: 'Casing', color: '#F59E0B', translationKey: 'DrillingReportsModule.tools.casing' },
  { value: 'drill_pipe', label: 'Drill Pipe', color: '#3B82F6', translationKey: 'DrillingReportsModule.tools.drill_pipe' },
  { value: 'stabilizer', label: 'Stabilizer', color: '#9CA3AF', translationKey: 'DrillingReportsModule.tools.stabilizer' },
  { value: 'reamer', label: 'Reamer', color: '#9CA3AF', translationKey: 'DrillingReportsModule.tools.reamer' },
  { value: 'jar', label: 'Jar', color: '#9CA3AF', translationKey: 'DrillingReportsModule.tools.jar' },
  { value: 'motor', label: 'Motor', color: '#9CA3AF', translationKey: 'DrillingReportsModule.tools.motor' },
  { value: 'sub', label: 'Sub', color: '#9CA3AF', translationKey: 'DrillingReportsModule.tools.sub' },
]

export const TOOL_CONDITIONS = [
  { value: 'new', label: 'Nuevo', color: '#10B981', icon: '🟢', translationKey: 'DrillingReportsModule.tools.new' },
  { value: 'light', label: 'Leve', color: '#3B82F6', icon: '🔵', translationKey: 'DrillingReportsModule.tools.light' },
  { value: 'moderate', label: 'Moderado', color: '#F59E0B', icon: '🟡', translationKey: 'DrillingReportsModule.tools.moderate' },
  { value: 'severe', label: 'Malo', color: '#EF4444', icon: '🔴', translationKey: 'DrillingReportsModule.tools.severe' },
  { value: 'critical', label: 'Crítico', color: '#7C2D12', icon: '🚨', translationKey: 'DrillingReportsModule.tools.critical' },
]

export const TOOL_WEAR_PATTERNS = [
  { value: 'uniform', label: 'Uniforme', icon: '⚪' },
  { value: 'concentric', label: 'Concéntrico', icon: '⭕' },
  { value: 'eccentric', label: 'Excéntrico', icon: '🔄' },
  { value: 'irregular', label: 'Irregular', icon: '🔀' },
  { value: 'severe', label: 'Severo', icon: '⚠️' },
]

export const TOOL_MAINTENANCE_TYPES = [
  { value: 'preventive', label: 'Preventivo', color: '#10B981', icon: '🛠️' },
  { value: 'corrective', label: 'Correctivo', color: '#F59E0B', icon: '🔧' },
  { value: 'emergency', label: 'Emergencia', color: '#EF4444', icon: '🚨' },
  { value: 'scheduled', label: 'Programado', color: '#3B82F6', icon: '📅' },
]

export const TOOL_METRICS = {
  DIAMETER_RANGES: [
    { min: 0, max: 5, label: 'Pequeño (0-5")', color: '#10B981' },
    { min: 5, max: 10, label: 'Mediano (5-10")', color: '#3B82F6' },
    { min: 10, max: 20, label: 'Grande (10-20")', color: '#F59E0B' },
    { min: 20, max: Number.POSITIVE_INFINITY, label: 'Muy Grande (>20")', color: '#EF4444' },
  ],
  LENGTH_RANGES: [
    { min: 0, max: 1, label: 'Corto (0-1m)', color: '#10B981' },
    { min: 1, max: 5, label: 'Mediano (1-5m)', color: '#3B82F6' },
    { min: 5, max: 10, label: 'Largo (5-10m)', color: '#F59E0B' },
    { min: 10, max: Number.POSITIVE_INFINITY, label: 'Muy Largo (>10m)', color: '#EF4444' },
  ],
  WEIGHT_RANGES: [
    { min: 0, max: 10, label: 'Ligero (0-10kg)', color: '#10B981' },
    { min: 10, max: 50, label: 'Mediano (10-50kg)', color: '#3B82F6' },
    { min: 50, max: 100, label: 'Pesado (50-100kg)', color: '#F59E0B' },
    { min: 100, max: Number.POSITIVE_INFINITY, label: 'Muy Pesado (>100kg)', color: '#EF4444' },
  ],
  COST_RANGES: [
    { min: 0, max: 1000, label: 'Económico (<$1K)', color: '#10B981' },
    { min: 1000, max: 5000, label: 'Medio ($1K-$5K)', color: '#3B82F6' },
    { min: 5000, max: 20000, label: 'Caro ($5K-$20K)', color: '#F59E0B' },
    { min: 20000, max: Number.POSITIVE_INFINITY, label: 'Muy Caro (>$20K)', color: '#EF4444' },
  ],
}

export const TOOL_FILTERS = {
  TYPE: TOOL_TYPES,
  STATUS: TOOL_STATUS,
  CATEGORY: TOOL_CATEGORIES,
  MATERIAL: TOOL_MATERIALS,
  CONDITION: TOOL_CONDITIONS,
  WEAR_PATTERN: TOOL_WEAR_PATTERNS,
  MAINTENANCE_TYPE: TOOL_MAINTENANCE_TYPES,
  DIAMETER_RANGE: TOOL_METRICS.DIAMETER_RANGES,
  LENGTH_RANGE: TOOL_METRICS.LENGTH_RANGES,
  WEIGHT_RANGE: TOOL_METRICS.WEIGHT_RANGES,
  COST_RANGE: TOOL_METRICS.COST_RANGES,
}

export const TOOL_PERMISSIONS = {
  CREATE: 'tools.create',
  VIEW: 'tools.view',
  UPDATE: 'tools.update',
  DELETE: 'tools.delete',
  ASSIGN: 'tools.assign',
  MAINTAIN: 'tools.maintain',
  RETIRE: 'tools.retire',
  EXPORT: 'tools.export',
}

export const TOOL_NOTIFICATIONS = {
  CREATED: 'tool_created',
  UPDATED: 'tool_updated',
  ASSIGNED: 'tool_assigned',
  RETURNED: 'tool_returned',
  MAINTENANCE_DUE: 'tool_maintenance_due',
  MAINTENANCE_OVERDUE: 'tool_maintenance_overdue',
  RETIRED: 'tool_retired',
  WARRANTY_EXPIRING: 'tool_warranty_expiring',
  WARRANTY_EXPIRED: 'tool_warranty_expired',
}
