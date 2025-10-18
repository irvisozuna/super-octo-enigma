export const PROJECT_STATUS = [
  { value: 'active', label: 'Activo', color: '#10B981', bgColor: '#D1FAE5', icon: '🟢' },
  { value: 'completed', label: 'Completado', color: '#3B82F6', bgColor: '#DBEAFE', icon: '✅' },
  { value: 'cancelled', label: 'Cancelado', color: '#EF4444', bgColor: '#FEE2E2', icon: '❌' },
  { value: 'on_hold', label: 'En Espera', color: '#F59E0B', bgColor: '#FEF3C7', icon: '⏸️' },
]

export const PROJECT_PRIORITY = [
  { value: 'low', label: 'Baja', color: '#6B7280', bgColor: '#F3F4F6', icon: '🔵' },
  { value: 'medium', label: 'Media', color: '#F59E0B', bgColor: '#FEF3C7', icon: '🟡' },
  { value: 'high', label: 'Alta', color: '#EF4444', bgColor: '#FEE2E2', icon: '🔴' },
  { value: 'critical', label: 'Crítica', color: '#7C2D12', bgColor: '#FED7AA', icon: '🚨' },
]

export const PROJECT_TYPES = [
  { value: 'exploration', label: 'Exploración', icon: '🔍' },
  { value: 'production', label: 'Producción', icon: '⚡' },
  { value: 'injection', label: 'Inyección', icon: '💉' },
  { value: 'monitoring', label: 'Monitoreo', icon: '📊' },
  { value: 'maintenance', label: 'Mantenimiento', icon: '🔧' },
]

export const PROJECT_PHASES = [
  { value: 'planning', label: 'Planificación', icon: '📋' },
  { value: 'preparation', label: 'Preparación', icon: '🛠️' },
  { value: 'execution', label: 'Ejecución', icon: '⚡' },
  { value: 'monitoring', label: 'Monitoreo', icon: '📊' },
  { value: 'completion', label: 'Finalización', icon: '✅' },
]

export const PROJECT_METRICS = {
  BUDGET_RANGES: [
    { min: 0, max: 100000, label: 'Menos de $100K', color: '#10B981' },
    { min: 100000, max: 500000, label: '$100K - $500K', color: '#3B82F6' },
    { min: 500000, max: 1000000, label: '$500K - $1M', color: '#F59E0B' },
    { min: 1000000, max: 5000000, label: '$1M - $5M', color: '#EF4444' },
    { min: 5000000, max: Number.POSITIVE_INFINITY, label: 'Más de $5M', color: '#7C2D12' },
  ],
  DURATION_RANGES: [
    { min: 0, max: 30, label: 'Menos de 1 mes', color: '#10B981' },
    { min: 30, max: 90, label: '1-3 meses', color: '#3B82F6' },
    { min: 90, max: 180, label: '3-6 meses', color: '#F59E0B' },
    { min: 180, max: 365, label: '6-12 meses', color: '#EF4444' },
    { min: 365, max: Number.POSITIVE_INFINITY, label: 'Más de 1 año', color: '#7C2D12' },
  ],
}

export const PROJECT_FILTERS = {
  STATUS: PROJECT_STATUS,
  PRIORITY: PROJECT_PRIORITY,
  TYPE: PROJECT_TYPES,
  PHASE: PROJECT_PHASES,
  BUDGET_RANGE: PROJECT_METRICS.BUDGET_RANGES,
  DURATION_RANGE: PROJECT_METRICS.DURATION_RANGES,
}

export const PROJECT_PERMISSIONS = {
  CREATE: 'projects.create',
  VIEW: 'projects.view',
  UPDATE: 'projects.update',
  DELETE: 'projects.delete',
  EXPORT: 'projects.export',
  APPROVE: 'projects.approve',
  ASSIGN: 'projects.assign',
}

export const PROJECT_ROLES = {
  PROJECT_MANAGER: 'project_manager',
  TEAM_LEAD: 'team_lead',
  MEMBER: 'member',
  OBSERVER: 'observer',
}

export const PROJECT_NOTIFICATIONS = {
  CREATED: 'project_created',
  UPDATED: 'project_updated',
  STATUS_CHANGED: 'project_status_changed',
  DEADLINE_APPROACHING: 'project_deadline_approaching',
  OVERDUE: 'project_overdue',
  COMPLETED: 'project_completed',
}
