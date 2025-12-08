// src/modules/ReadingsReport/config/readingsReport.config.ts

export type TagVariant = 'flat' | 'outlined' | 'tonal' | 'elevated'

export interface TagStyle {
  color: string // Vuetify color (primary, success, etc.) o hex
  textColor?: string // opcional
  variant?: TagVariant // para VChip / VBtn
  icon?: string // opcional, si quieres iconos
}

/**
 * Colores por ESTADO de lectura
 */
export const STATUS_STYLES: Record<string, TagStyle> = {
  pending: { color: '#f59e0b', textColor: '#fff', variant: 'tonal', icon: 'tabler-clock' },
  validated: { color: '#16a34a', textColor: '#fff', variant: 'tonal', icon: 'tabler-check' },
  billed: { color: '#2563eb', textColor: '#fff', variant: 'tonal', icon: 'tabler-receipt-2' },
  error: { color: '#ef4444', textColor: '#fff', variant: 'tonal', icon: 'tabler-alert-triangle' },
  downloaded: { color: '#2563eb', textColor: '#fff', variant: 'tonal', icon: 'tabler-download' },
  completed: { color: '#16a34a', textColor: '#fff', variant: 'tonal', icon: 'tabler-check' },
}

/**
 * Colores por ESTADO de ruta (avance)
 */
export const ROUTE_STATUS_STYLES: Record<string, TagStyle> = {
  pending: { color: '#f59e0b', textColor: '#fff', variant: 'tonal', icon: 'tabler-clock' },
  downloaded: { color: '#2563eb', textColor: '#fff', variant: 'tonal', icon: 'tabler-download' },
  completed: { color: '#16a34a', textColor: '#fff', variant: 'tonal', icon: 'tabler-check' },
}

/**
 * Colores por TIPO DE CONTRATO (contract_type_name)
 */
export const CONTRACT_TYPE_STYLES: Record<string, TagStyle> = {
  Doméstico: { color: 'primary', variant: 'flat' },
  Comercial: { color: 'info', variant: 'flat' },
  Industrial: { color: 'secondary', variant: 'flat' },
}

/**
 * Colores por ANOMALÍA (anomaly_name)
 */
export const ANOMALY_STYLES: Record<string, TagStyle> = {
  'Medidor tapado': { color: 'orange-darken-2', variant: 'tonal' },
  'Sin acceso': { color: 'grey', variant: 'outlined' },
}

export const DEFAULT_TAG_STYLE: TagStyle = {
  color: 'default',
  variant: 'flat',
}

/**
 * Helpers
 */
export function getStatusStyle(status?: string | null): TagStyle {
  if (!status)
    return DEFAULT_TAG_STYLE

  const key = String(status).toLowerCase()
  return STATUS_STYLES[key] ?? DEFAULT_TAG_STYLE
}

export function getRouteStatusStyle(status?: string | null): TagStyle {
  if (!status)
    return DEFAULT_TAG_STYLE

  const key = String(status).toLowerCase()
  return ROUTE_STATUS_STYLES[key] ?? DEFAULT_TAG_STYLE
}

export function getContractTypeStyle(typeName?: string | null): TagStyle {
  if (!typeName)
    return DEFAULT_TAG_STYLE

  return CONTRACT_TYPE_STYLES[typeName] ?? DEFAULT_TAG_STYLE
}

export function getAnomalyStyle(name?: string | null): TagStyle {
  if (!name)
    return DEFAULT_TAG_STYLE

  return ANOMALY_STYLES[name] ?? DEFAULT_TAG_STYLE
}

/**
 * Headers de la tabla de reporte de lecturas
 */
export const READINGS_REPORT_HEADERS = [
  { title: 'ID', key: 'id' },
  { title: 'Contrato', key: 'contract_name' },
  { title: 'Usuario', key: 'customer_name' },
  { title: 'Tipo de contrato', key: 'contract_type_name' },
  { title: 'Sector', key: 'sector_name' },
  { title: 'Ruta', key: 'route_name' },
  { title: 'Lectura Anterior', key: 'previous_reading' },
  { title: 'Consumo', key: 'consumption' },
  { title: 'Lectura Actual', key: 'current_reading' },
  { title: 'Fecha Lectura', key: 'reading_date' },
  { title: 'Anomalia', key: 'anomaly_name' },
  { title: 'Estatus', key: 'status_label' },
]
