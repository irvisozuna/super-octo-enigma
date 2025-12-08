// src/modules/ReadingsReport/domain/entities/ReadingsReportEntity.ts
export interface ReadingMeta {
  source?: string
  app_version?: string
  gps_accuracy?: number
}

export interface ReadingsReportEntity {
  id: number

  contract_id: number
  contract_name: string

  customer_id: number
  customer_name: string

  period_id: number
  period_name: string

  user_id: number
  user_name: string

  sector_id: number
  sector_name: string

  route_id: number
  route_name: string

  anomaly_id: number | null
  anomaly_name: string | null

  contract_type_id: number | null
  contract_type_name: string | null

  rate_type_id: number | null
  rate_type_name: string | null

  reading_date: string
  previous_reading: number
  current_reading: number
  consumption: number
  water_stack_reading: number | null
  is_auto_month_closure: boolean

  status: string
  status_label: string

  latitude?: string | null
  longitude?: string | null

  photo_path?: string | null
  notes?: string | null
  meta?: ReadingMeta | null

  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
}
