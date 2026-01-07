// Import constants from ProjectConstants
import { ACTIVITY_TYPES, SHIFT_OPTIONS } from './ProjectConstants'

// Import consumable constants
import { CONSUMABLE_TYPES, CONSUMABLE_UNITS } from './ConsumableConstants'

// Import tool categories from ToolConstants
import { TOOL_WIZARD_CATEGORIES } from './ToolConstants'

export const REPORT_WIZARD_STEPS = [
  { title: 'Información Básica', value: '1', icon: 'tabler-info-circle' },
  { title: 'Personal', value: '2', icon: 'tabler-users' },
  { title: 'Actividades', value: '3', icon: 'tabler-activity' },
  { title: 'Mediciones Direccionales', value: '4', icon: 'tabler-ruler' },
  { title: 'Consumos', value: '5', icon: 'tabler-droplet' },
  { title: 'Herramientas', value: '6', icon: 'tabler-tool' },
  { title: 'Revisión', value: '7', icon: 'tabler-check' },
]

// Reuse activity types and shift options from ProjectConstants
export { ACTIVITY_TYPES, SHIFT_OPTIONS }

// Activity shift options (subset of shift options)
export const ACTIVITY_SHIFT_OPTIONS = [
  { title: 'Día', value: 'day', icon: 'tabler-sun' },
  { title: 'Noche', value: 'night', icon: 'tabler-moon' },
]

export const ACTIVITY_TEMPLATES = [
  {
    type: 'drilling_core',
    label: 'Perforación',
    icon: 'tabler-drill',
    hours: 8,
    color: '#3B82F6',
    description: 'Plantilla para perforación de núcleo',
  },
  {
    type: 'maintenance',
    label: 'Mantenimiento',
    icon: 'tabler-wrench',
    hours: 2,
    color: '#EF4444',
    description: 'Plantilla para actividades de mantenimiento',
  },
  {
    type: 'waiting',
    label: 'Espera',
    icon: 'tabler-clock-pause',
    hours: 1,
    color: '#6B7280',
    description: 'Plantilla para tiempo de espera',
  },
]

// Reuse consumable types and units from ConsumableConstants
export { CONSUMABLE_TYPES }
export const UNIT_OPTIONS = CONSUMABLE_UNITS

// Reuse tool categories from ToolConstants
export const TOOL_CATEGORY_OPTIONS = TOOL_WIZARD_CATEGORIES

// Measurement interval options for directional measurements
export const MEASUREMENT_INTERVAL_OPTIONS = [
  { title: 'Cada 2 metros', value: 2 },
  { title: 'Cada 15 metros', value: 15 },
  { title: 'Cada 30 metros', value: 30 },
  { title: 'Cada 50 metros', value: 50 },
]

export const REPORT_VALIDATION_RULES = {
  required: (value: any) => !!value || 'Campo requerido',
  positiveNumber: (value: number) => !value || value >= 0 || 'Debe ser mayor o igual a 0',

  // Para campos opcionales que permiten 0 como valor válido
  nonNegativeNumber: (value: number | null | undefined) => {
    // Si es null, undefined o string vacío, es válido (campo opcional)
    if (value === null || value === undefined || value === '')
      return true

    // Si es número, debe ser >= 0
    return Number(value) >= 0 || 'Debe ser mayor o igual a 0'
  },
  dateNotFuture: (value: string) => {
    if (!value)
      return true
    const date = new Date(value)
    const today = new Date()

    today.setHours(23, 59, 59, 999)

    return date <= today || 'La fecha no puede ser futura'
  },
  maxLength: (max: number) => (value: string) =>
    !value || value.length <= max || `Máximo ${max} caracteres`,
  minValue: (min: number) => (value: number) =>
    !value || value >= min || `Debe ser mayor o igual a ${min}`,
  maxValue: (max: number) => (value: number) =>
    !value || value <= max || `Debe ser menor o igual a ${max}`,
}

export const REPORT_WIZARD_CONFIG = {
  MAX_ACTIVITIES: 20,
  MAX_CONSUMABLES: 15,
  MAX_TOOLS: 10,
  MAX_PERSONNEL: 25,
  DEFAULT_HOURS_PER_SHIFT: 8,
  MAX_HOURS_PER_ACTIVITY: 24,
  MIN_HOURS_PER_ACTIVITY: 0.25,
}

export const REPORT_WIZARD_MESSAGES = {
  SUCCESS: {
    REPORT_CREATED: 'Reporte creado exitosamente',
    REPORT_UPDATED: 'Reporte actualizado exitosamente',
    ACTIVITY_ADDED: 'Actividad agregada',
    CONSUMABLE_ADDED: 'Consumible agregado',
    TOOL_ADDED: 'Herramienta agregada',
    PERSONNEL_ADDED: 'Personal agregado',
  },
  ERROR: {
    REQUIRED_FIELD: 'Este campo es requerido',
    INVALID_DATE: 'Fecha inválida',
    FUTURE_DATE: 'La fecha no puede ser futura',
    INVALID_NUMBER: 'Número inválido',
    MAX_LENGTH_EXCEEDED: 'Excede la longitud máxima',
    DUPLICATE_ITEM: 'Este elemento ya existe',
    NETWORK_ERROR: 'Error de conexión',
    SERVER_ERROR: 'Error del servidor',
  },
  WARNING: {
    UNSAVED_CHANGES: 'Tienes cambios sin guardar',
    INCOMPLETE_FORM: 'Formulario incompleto',
    EXCEEDED_LIMITS: 'Se excedieron los límites permitidos',
  },
  INFO: {
    LOADING: 'Cargando...',
    SAVING: 'Guardando...',
    PROCESSING: 'Procesando...',
    VALIDATING: 'Validando...',
  },
}

export const REPORT_WIZARD_FILTERS = {
  ACTIVITY_TYPE: ACTIVITY_TYPES,
  CONSUMABLE_TYPE: CONSUMABLE_TYPES,
  TOOL_CATEGORY: TOOL_CATEGORY_OPTIONS,
  SHIFT: SHIFT_OPTIONS,
  UNIT: UNIT_OPTIONS,
}

export const REPORT_WIZARD_PERMISSIONS = {
  CREATE: 'reports.create',
  VIEW: 'reports.view',
  UPDATE: 'reports.update',
  DELETE: 'reports.delete',
  APPROVE: 'reports.approve',
  EXPORT: 'reports.export',
}

export const REPORT_WIZARD_NOTIFICATIONS = {
  CREATED: 'report_created',
  UPDATED: 'report_updated',
  APPROVED: 'report_approved',
  REJECTED: 'report_rejected',
  DELETED: 'report_deleted',
}
