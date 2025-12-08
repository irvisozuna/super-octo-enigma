// src/modules/ReadingsReport/types/ReadingsReport.ts

export interface ReadingMeta {
  source?: string
  app_version?: string
  gps_accuracy?: number
}

export interface ReadingsReport {
  id: number

  // Contrato (snapshot)
  contract_id: number
  contract_name: string

  // Cliente (snapshot)
  customer_id: number
  customer_name: string

  // Periodo (snapshot)
  period_id: number
  period_name: string

  // Usuario / Lecturista (snapshot)
  user_id: number
  user_name: string

  // Sector (snapshot)
  sector_id: number
  sector_name: string

  // Ruta (snapshot)
  route_id: number
  route_name: string

  // Anomalía (snapshot)
  anomaly_id: number | null
  anomaly_name: string | null

  // Tipo de contrato (snapshot)
  contract_type_id: number | null
  contract_type_name: string | null

  // Tipo de tarifa (snapshot)
  rate_type_id: number | null
  rate_type_name: string | null

  // Datos de lectura
  reading_date: string // "2025-01-15 14:35:00"
  previous_reading: number
  current_reading: number
  consumption: number
  water_stack_reading: number | null
  is_auto_month_closure: boolean

  // Estado
  status: string // "pending" | "validated" | ...
  status_label: string // "Pendiente", "Validada", ...

  // Ubicación
  latitude?: string | null
  longitude?: string | null

  // Otros
  photo_path?: string | null
  notes?: string | null
  meta?: ReadingMeta | null

  // Auditoría
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
}
