export const WELL_STATUS = [
  { value: 'planned', label: 'Planificado', color: '#6B7280', bgColor: '#F3F4F6', icon: '📋' },
  { value: 'drilling', label: 'Perforando', color: '#3B82F6', bgColor: '#DBEAFE', icon: '⚡' },
  { value: 'completed', label: 'Completado', color: '#10B981', bgColor: '#D1FAE5', icon: '✅' },
  { value: 'abandoned', label: 'Abandonado', color: '#EF4444', bgColor: '#FEE2E2', icon: '❌' },
]

export const WELL_TYPES = [
  { value: 'exploration', label: 'Exploración', icon: '🔍', description: 'Pozo para explorar recursos' },
  { value: 'production', label: 'Producción', icon: '⚡', description: 'Pozo para producción de recursos' },
  { value: 'injection', label: 'Inyección', icon: '💉', description: 'Pozo para inyección de fluidos' },
  { value: 'monitoring', label: 'Monitoreo', icon: '📊', description: 'Pozo para monitoreo ambiental' },
  { value: 'rotary', label: 'Rotatorio', icon: '🔩', description: 'Pozo para perforación rotatoria' },
  { value: 'percussion', label: 'Percusión', icon: '🔩', description: 'Pozo para perforación percusión' },
  { value: 'directional', label: 'Direccional', icon: '🔩', description: 'Pozo para perforación direccional' },
  { value: 'horizontal', label: 'Horizontal', icon: '🔩', description: 'Pozo para perforación horizontal' },
  { value: 'other', label: 'Otro', icon: '🔩', description: 'Pozo para perforación otro' },
]

export const WELL_DEPTH_CATEGORIES = [
  { min: 0, max: 100, label: 'Poco Profundo (0-100m)', color: '#10B981' },
  { min: 100, max: 500, label: 'Medio (100-500m)', color: '#3B82F6' },
  { min: 500, max: 1000, label: 'Profundo (500-1000m)', color: '#F59E0B' },
  { min: 1000, max: 2000, label: 'Muy Profundo (1000-2000m)', color: '#EF4444' },
  { min: 2000, max: Number.POSITIVE_INFINITY, label: 'Ultra Profundo (>2000m)', color: '#7C2D12' },
]

export const WELL_DIAMETER_CATEGORIES = [
  { min: 0, max: 6, label: 'Pequeño (0-6")', color: '#10B981' },
  { min: 6, max: 12, label: 'Mediano (6-12")', color: '#3B82F6' },
  { min: 12, max: 20, label: 'Grande (12-20")', color: '#F59E0B' },
  { min: 20, max: Number.POSITIVE_INFINITY, label: 'Muy Grande (>20")', color: '#EF4444' },
]

export const WELL_DIAMETER_OPTIONS = [
  { code: 'BQ', inches: 2.36, label: 'BQ (2.36")' },
  { code: 'NQ', inches: 2.98, label: 'NQ (2.98")' },
  { code: 'NQ3', inches: 2.98, label: 'NQ3 (2.98")' },
  { code: 'HQ', inches: 3.78, label: 'HQ (3.78")' },
  { code: 'HQ3', inches: 3.78, label: 'HQ3 (3.78")' },
  { code: 'PQ', inches: 4.83, label: 'PQ (4.83")' },
  { code: 'PQ3', inches: 4.83, label: 'PQ3 (4.83")' },
]

export const WELL_PHASES = [
  { value: 'planning', label: 'Planificación', icon: '📋', description: 'Fase de planificación del pozo' },
  { value: 'drilling', label: 'Perforación', icon: '⚡', description: 'Fase de perforación activa' },
  { value: 'completion', label: 'Completación', icon: '🔧', description: 'Fase de completación del pozo' },
  { value: 'production', label: 'Producción', icon: '⚡', description: 'Fase de producción' },
  { value: 'abandonment', label: 'Abandono', icon: '❌', description: 'Fase de abandono del pozo' },
]

export const WELL_GEOLOGY_TYPES = [
  { value: 'sandstone', label: 'Arenisca', color: '#F59E0B' },
  { value: 'limestone', label: 'Caliza', color: '#6B7280' },
  { value: 'shale', label: 'Lutita', color: '#374151' },
  { value: 'granite', label: 'Granito', color: '#7C2D12' },
  { value: 'basalt', label: 'Basalto', color: '#1F2937' },
  { value: 'other', label: 'Otro', color: '#9CA3AF' },
]

export const WELL_ENVIRONMENTAL_CONDITIONS = [
  { value: 'normal', label: 'Normal', color: '#10B981', icon: '🟢' },
  { value: 'harsh', label: 'Severo', color: '#F59E0B', icon: '🟡' },
  { value: 'extreme', label: 'Extremo', color: '#EF4444', icon: '🔴' },
  { value: 'offshore', label: 'Mar Adentro', color: '#3B82F6', icon: '🌊' },
  { value: 'arctic', label: 'Ártico', color: '#8B5CF6', icon: '❄️' },
]

export const WELL_METRICS = {
  DEPTH_RANGES: WELL_DEPTH_CATEGORIES,
  DIAMETER_RANGES: WELL_DIAMETER_CATEGORIES,
  COST_RANGES: [
    { min: 0, max: 100000, label: 'Menos de $100K', color: '#10B981' },
    { min: 100000, max: 500000, label: '$100K - $500K', color: '#3B82F6' },
    { min: 500000, max: 1000000, label: '$500K - $1M', color: '#F59E0B' },
    { min: 1000000, max: 5000000, label: '$1M - $5M', color: '#EF4444' },
    { min: 5000000, max: Number.POSITIVE_INFINITY, label: 'Más de $5M', color: '#7C2D12' },
  ],
}

export const WELL_FILTERS = {
  STATUS: WELL_STATUS,
  TYPE: WELL_TYPES,
  PHASE: WELL_PHASES,
  GEOLOGY: WELL_GEOLOGY_TYPES,
  ENVIRONMENT: WELL_ENVIRONMENTAL_CONDITIONS,
  DEPTH_RANGE: WELL_METRICS.DEPTH_RANGES,
  DIAMETER_RANGE: WELL_METRICS.DIAMETER_RANGES,
  COST_RANGE: WELL_METRICS.COST_RANGES,
}

export const WELL_PERMISSIONS = {
  CREATE: 'wells.create',
  VIEW: 'wells.view',
  UPDATE: 'wells.update',
  DELETE: 'wells.delete',
  EXPORT: 'wells.export',
  ASSIGN: 'wells.assign',
  MONITOR: 'wells.monitor',
}

export const WELL_NOTIFICATIONS = {
  CREATED: 'well_created',
  UPDATED: 'well_updated',
  STATUS_CHANGED: 'well_status_changed',
  DEPTH_MILESTONE: 'well_depth_milestone',
  COMPLETED: 'well_completed',
  ABANDONED: 'well_abandoned',
  ENVIRONMENTAL_ALERT: 'well_environmental_alert',
}
