/**
 * Shared Constants for Transport Module
 */

// API Endpoints
export const API_ENDPOINTS = {
  VEHICLES: '/vehicles',
  CONCESSIONS: '/concessions',
  CONCESSION_HOLDERS: '/concession-holders',
  DRIVERS: '/drivers',
  FINES: '/fines',
  PAYMENTS: '/payments',
  INSURANCE: '/insurance-policies',
  DOCUMENTS: '/documents',
  TRANSFERS: '/concession-transfers',
  FINE_PHOTOS: '/fine-photos',
  STATISTICS: '/statistics',
  SEARCH: '/search',
} as const

// Status Labels
export const STATUS_LABELS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PENDING: 'Pendiente',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
} as const

// Vehicle Type Labels
export const VEHICLE_TYPE_LABELS = {
  MICROBUS: 'Microbus',
  TAXI: 'Taxi',
  BUS: 'Autobús',
  TRUCK: 'Camión',
  MOTORCYCLE: 'Motocicleta',
  OTHER: 'Otro',
} as const

// License Type Labels
export const LICENSE_TYPE_LABELS = {
  A: 'Tipo A - Motocicletas',
  B: 'Tipo B - Automóviles',
  C: 'Tipo C - Camiones',
  D: 'Tipo D - Transporte Público',
  E: 'Tipo E - Vehículos Especiales',
} as const

// Payment Method Labels
export const PAYMENT_METHOD_LABELS = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta de Crédito',
  BANK_TRANSFER: 'Transferencia Bancaria',
  CHECK: 'Cheque',
  DIGITAL_WALLET: 'Billetera Digital',
} as const

// Fine Status Labels
export const FINE_STATUS_LABELS = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
  CONTESTED: 'Impugnada',
} as const

// Violation Type Labels
export const VIOLATION_TYPE_LABELS = {
  SPEEDING: 'Exceso de Velocidad',
  PARKING: 'Estacionamiento Indebido',
  TRAFFIC_LIGHT: 'Semáforo en Rojo',
  STOP_SIGN: 'No Respetar Alto',
  DRIVING_LICENSE: 'Licencia de Conducir',
  VEHICLE_REGISTRATION: 'Registro Vehicular',
  INSURANCE: 'Seguro Vehicular',
  OTHER: 'Otra Infracción',
} as const

// Document Type Labels
export const DOCUMENT_TYPE_LABELS = {
  REGISTRATION: 'Registro Vehicular',
  LICENSE: 'Licencia de Conducir',
  INSURANCE: 'Póliza de Seguro',
  INSPECTION: 'Inspección Técnica',
  CONTRACT: 'Contrato',
  PHOTO: 'Fotografía',
  OTHER: 'Otro Documento',
} as const

// Default Values
export const DEFAULT_VALUES = {
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  FILE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_MAX_WIDTH: 1920,
  IMAGE_MAX_HEIGHT: 1080,
} as const

// Validation Rules
export const VALIDATION_RULES = {
  PLATE_NUMBER: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 10,
    PATTERN: /^[A-Z0-9-]+$/,
  },
  VIN: {
    LENGTH: 17,
    PATTERN: /^[A-HJ-NPR-Z0-9]{17}$/,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    PATTERN: /^\+?[\d\s()-]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/,
  },
  AMOUNT: {
    MIN: 0,
    MAX: 999999.99,
    DECIMALS: 2,
  },
} as const

// Color Schemes
export const COLORS = {
  STATUS: {
    ACTIVE: '#16A34A',
    INACTIVE: '#6B7280',
    PENDING: '#EAB308',
    SUSPENDED: '#F97316',
    CANCELLED: '#DC2626',
  },
  FINE_STATUS: {
    PENDING: '#EAB308',
    PAID: '#16A34A',
    OVERDUE: '#DC2626',
    CANCELLED: '#6B7280',
    CONTESTED: '#2563EB',
  },
  VEHICLE_TYPE: {
    MICROBUS: '#3B82F6',
    TAXI: '#10B981',
    BUS: '#8B5CF6',
    TRUCK: '#F59E0B',
    MOTORCYCLE: '#EF4444',
    OTHER: '#6B7280',
  },
} as const

// Icon Mappings
export const ICONS = {
  VEHICLE_TYPES: {
    MICROBUS: 'tabler-bus',
    TAXI: 'tabler-car',
    BUS: 'tabler-bus',
    TRUCK: 'tabler-truck',
    MOTORCYCLE: 'tabler-motorbike',
    OTHER: 'tabler-car',
  },
  ACTIONS: {
    CREATE: 'tabler-plus',
    EDIT: 'tabler-edit',
    DELETE: 'tabler-trash',
    VIEW: 'tabler-eye',
    SEARCH: 'tabler-search',
    FILTER: 'tabler-filter',
    EXPORT: 'tabler-download',
    PRINT: 'tabler-printer',
    REFRESH: 'tabler-refresh',
  },
  STATUS: {
    ACTIVE: 'tabler-check-circle',
    INACTIVE: 'tabler-x-circle',
    PENDING: 'tabler-clock',
    SUSPENDED: 'tabler-alert-circle',
    CANCELLED: 'tabler-x',
  },
} as const

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  INPUT: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm',
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  TRANSPORT_PREFERENCES: 'transport_preferences',
  LAST_SEARCH: 'transport_last_search',
  TABLE_SETTINGS: 'transport_table_settings',
} as const
