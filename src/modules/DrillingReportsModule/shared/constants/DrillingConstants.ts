/**
 * Drilling Reports Constants
 *
 * All constants and enums for the drilling reports module
 */

// Activity Types
export const ACTIVITY_TYPES = [
  { value: 'drilling', label: 'Perforación', icon: 'mdi-drill' },
  { value: 'maintenance', label: 'Mantenimiento', icon: 'mdi-wrench' },
  { value: 'installation', label: 'Instalación', icon: 'mdi-hammer-screwdriver' },
  { value: 'testing', label: 'Pruebas', icon: 'mdi-test-tube' },
  { value: 'waiting', label: 'Tiempo de Espera', icon: 'mdi-clock-outline' },
  { value: 'mobilization', label: 'Movilización', icon: 'mdi-truck' },
  { value: 'demobilization', label: 'Desmovilización', icon: 'mdi-truck-remove' },
  { value: 'otros', label: 'Otros', icon: 'mdi-dots-horizontal' },
] as const

// Consumable Types
export const CONSUMABLE_TYPES = [
  { value: 'bentonite', label: 'Bentonita', defaultUnit: 'kg', icon: 'mdi-package-variant' },
  { value: 'cement', label: 'Cemento', defaultUnit: 'bags', icon: 'mdi-package-variant' },
  { value: 'water', label: 'Agua', defaultUnit: 'liters', icon: 'mdi-water' },
  { value: 'diesel', label: 'Diesel', defaultUnit: 'liters', icon: 'mdi-fuel' },
  { value: 'lubricant', label: 'Lubricante', defaultUnit: 'liters', icon: 'mdi-oil' },
  { value: 'polymer', label: 'Polímero', defaultUnit: 'kg', icon: 'mdi-flask' },
  { value: 'gravel', label: 'Grava', defaultUnit: 'kg', icon: 'mdi-package-variant' },
  { value: 'sand', label: 'Arena', defaultUnit: 'kg', icon: 'mdi-package-variant' },
] as const

// Units
export const UNITS = [
  { value: 'kg', label: 'Kilogramos', symbol: 'kg' },
  { value: 'bags', label: 'Sacos', symbol: 'bags' },
  { value: 'liters', label: 'Litros', symbol: 'L' },
  { value: 'gallons', label: 'Galones', symbol: 'gal' },
  { value: 'units', label: 'Unidades', symbol: 'u' },
  { value: 'meters', label: 'Metros', symbol: 'm' },
  { value: 'pieces', label: 'Piezas', symbol: 'pcs' },
] as const

// Tool Categories
export const TOOL_CATEGORIES = [
  { value: 'drill_bit', label: 'Broca de Perforación', icon: 'mdi-drill' },
  { value: 'reamer', label: 'Escarreador', icon: 'mdi-tools' },
  { value: 'stabilizer', label: 'Estabilizador', icon: 'mdi-circle' },
  { value: 'drill_pipe', label: 'Tubería de Perforación', icon: 'mdi-pipe' },
  { value: 'drill_collar', label: 'Portamecha', icon: 'mdi-weight' },
  { value: 'kelly', label: 'Kelly', icon: 'mdi-rod' },
  { value: 'otros', label: 'Otros', icon: 'mdi-dots-horizontal' },
] as const

// Wear Patterns
export const WEAR_PATTERNS = [
  { value: 'uniform', label: 'Desgaste Uniforme', description: 'Desgaste distribuido uniformemente' },
  { value: 'centered', label: 'Desgaste Centrado', description: 'Desgaste concentrado en el centro' },
  { value: 'eccentric', label: 'Desgaste Excéntrico', description: 'Desgaste fuera del centro' },
  { value: 'one_sided', label: 'Desgaste de un Lado', description: 'Desgaste en un solo lado' },
] as const

// Matrix Conditions
export const MATRIX_CONDITIONS = [
  { value: 'good_condition', label: 'Buen Estado', color: '#10B981', description: 'Sin desgaste significativo' },
  { value: 'moderate_wear', label: 'Desgaste Moderado', color: '#F59E0B', description: 'Desgaste moderado pero funcional' },
  { value: 'severe_wear', label: 'Desgaste Severo', color: '#EF4444', description: 'Desgaste severo, requiere atención' },
  { value: 'needs_replacement', label: 'Requiere Reemplazo', color: '#DC2626', description: 'Necesita reemplazo inmediato' },
] as const

// Signature Types
export const SIGNATURE_TYPES = [
  {
    value: 'operator',
    label: 'Operador',
    description: 'Firma del operador que ejecutó el trabajo',
    required: true,
    icon: 'mdi-account-hard-hat',
  },
  {
    value: 'supervisor',
    label: 'Supervisor',
    description: 'Firma del supervisor que revisó el trabajo',
    required: true,
    icon: 'mdi-account-tie',
  },
  {
    value: 'client',
    label: 'Cliente',
    description: 'Firma del representante del cliente',
    required: false,
    icon: 'mdi-account',
  },
] as const

// Signature Methods
export const SIGNATURE_METHODS = [
  { value: 'digital', label: 'Digital', icon: 'mdi-signature' },
  { value: 'physical', label: 'Física', icon: 'mdi-pen' },
  { value: 'electronic', label: 'Electrónica', icon: 'mdi-certificate' },
] as const

// Shifts
export const SHIFTS = [
  { value: 'day', label: 'Día', icon: 'mdi-weather-sunny', color: '#F59E0B' },
  { value: 'night', label: 'Noche', icon: 'mdi-weather-night', color: '#1F2937' },
  { value: 'mixed', label: 'Mixto', icon: 'mdi-weather-partly-cloudy', color: '#6B7280' },
] as const

// Report Status
export const REPORT_STATUS = [
  {
    value: 'draft',
    label: 'Borrador',
    color: '#FCD34D',
    bgColor: '#FEF3C7',
    icon: 'mdi-pencil',
    description: 'Reporte en construcción',
  },
  {
    value: 'completed',
    label: 'Completado',
    color: '#60A5FA',
    bgColor: '#DBEAFE',
    icon: 'mdi-check-circle',
    description: 'Esperando aprobación',
  },
  {
    value: 'approved',
    label: 'Aprobado',
    color: '#34D399',
    bgColor: '#D1FAE5',
    icon: 'mdi-check',
    description: 'Reporte aprobado',
  },
  {
    value: 'rejected',
    label: 'Rechazado',
    color: '#F87171',
    bgColor: '#FEE2E2',
    icon: 'mdi-close-circle',
    description: 'Requiere corrección',
  },
] as const

// Validation Rules
export const VALIDATION_RULES = {
  // Hours
  MIN_HOURS: 0.1,
  MAX_HOURS: 24.0,
  MAX_HOURS_PER_SHIFT: 24.0,

  // Depths
  MIN_DEPTH: 0,
  MAX_DEPTH: 10000,

  // Quantities
  MIN_QUANTITY: 0.01,
  MAX_QUANTITY: 999999,

  // Text lengths
  MAX_OBSERVATIONS: 1000,
  MAX_DESCRIPTION: 500,
  MAX_REJECTION_REASON: 500,
  MIN_REJECTION_REASON: 10,

  // RPM
  MIN_RPM: 0,
  MAX_RPM: 500,

  // Horometer
  MIN_HOROMETER: 0,
  MAX_HOROMETER: 999999.9,
} as const

// API Endpoints
export const API_ENDPOINTS = {
  BASE: '/api/drilling/reports',
  LIST: '/api/drilling/reports',
  CREATE: '/api/drilling/reports',
  DETAIL: (id: string) => `/api/drilling/reports/${id}`,
  UPDATE: (id: string) => `/api/drilling/reports/${id}`,
  DELETE: (id: string) => `/api/drilling/reports/${id}`,
  ADD_ACTIVITY: (id: string) => `/api/drilling/reports/${id}/add-activity`,
  RECORD_CONSUMPTION: (id: string) => `/api/drilling/reports/${id}/record-consumption`,
  ASSIGN_TOOL: (id: string) => `/api/drilling/reports/${id}/assign-tool`,
  COMPLETE: (id: string) => `/api/drilling/reports/${id}/complete`,
  APPROVE: (id: string) => `/api/drilling/reports/${id}/approve`,
  REJECT: (id: string) => `/api/drilling/reports/${id}/reject`,
  SIGN: (id: string) => `/api/drilling/reports/${id}/sign`,
  STATISTICS: '/api/drilling/reports/statistics',
  EXPORT: '/api/drilling/reports/export',
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/png', 'image/jpeg', 'application/pdf'],
  SIGNATURE_CANVAS: {
    WIDTH: 400,
    HEIGHT: 200,
    BACKGROUND_COLOR: '#ffffff',
    PEN_COLOR: '#000000',
    PEN_WIDTH: 2,
  },
} as const

// Export Formats
export const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF', icon: 'mdi-file-pdf-box' },
  { value: 'excel', label: 'Excel', icon: 'mdi-file-excel-box' },
  { value: 'csv', label: 'CSV', icon: 'mdi-file-delimited' },
] as const

// Notification Types
export const NOTIFICATION_TYPES = {
  REPORT_COMPLETED: 'report_completed',
  REPORT_APPROVED: 'report_approved',
  REPORT_REJECTED: 'report_rejected',
  TOOL_LOW_CAPACITY: 'tool_low_capacity',
  SHIFT_HOURS_HIGH: 'shift_hours_high',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  SERVER_ERROR: 'Error del servidor. Por favor, intenta nuevamente.',
  PERMISSION_DENIED: 'No tienes permisos para realizar esta acción.',
  VALIDATION_ERROR: 'Por favor corrige los errores marcados en rojo.',
  REQUIRED_FIELD: 'Este campo es requerido.',
  INVALID_DATE: 'Fecha inválida.',
  FUTURE_DATE: 'La fecha no puede ser futura.',
  INVALID_HOURS: 'Las horas deben estar entre 0.1 y 24.',
  EXCEEDED_HOURS: 'Se excedió el límite de 24 horas por turno.',
  INVALID_DEPTH: 'La profundidad final debe ser mayor que la inicial.',
  INSUFFICIENT_CAPACITY: 'Capacidad insuficiente de la herramienta.',
  TOOL_NOT_AVAILABLE: 'La herramienta no está disponible.',
  DUPLICATE_SIGNATURE: 'Ya existe una firma de este tipo.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  REPORT_CREATED: 'Reporte creado exitosamente',
  REPORT_UPDATED: 'Reporte actualizado exitosamente',
  REPORT_DELETED: 'Reporte eliminado exitosamente',
  REPORT_COMPLETED: 'Reporte completado exitosamente',
  REPORT_APPROVED: 'Reporte aprobado exitosamente',
  REPORT_REJECTED: 'Reporte rechazado exitosamente',
  REPORT_SIGNED: 'Reporte firmado exitosamente',
  ACTIVITY_ADDED: 'Actividad agregada exitosamente',
  CONSUMPTION_RECORDED: 'Consumo registrado exitosamente',
  TOOL_ASSIGNED: 'Herramienta asignada exitosamente',
} as const
