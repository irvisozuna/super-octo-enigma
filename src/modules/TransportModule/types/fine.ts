// Tipos para el sistema de multas del TransportModule

export interface Fine {
  id: string
  company_id: string
  driver_id?: string
  vehicle_id?: string
  concession_id: string
  concession_holder_id?: string
  violation_type_id: string
  status: FineStatus
  issued_at: string
  detected_at?: string
  base_amount: number
  total_amount: number
  discount_amount?: number
  surcharge_amount?: number
  due_date: string
  latitude?: number
  longitude?: number
  place?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
  
  // Campos calculados básicos
  status_label: string
  subject_type: SubjectType
  formatted_amount: string
  is_draft: boolean
  is_issued: boolean
  is_paid: boolean
  is_cancelled: boolean
  is_overdue: boolean
  is_appealed: boolean
  has_location: boolean
  has_photos: boolean
  has_payments: boolean
  total_paid: number
  remaining_amount: number
  is_fully_paid: boolean
  days_until_due: number
  days_overdue: number
  formatted_location?: string
  
  // Relaciones
  vehicle?: Vehicle
  concession?: Concession
  concession_holder?: ConcessionHolder
  violation_type: ViolationType
  payments?: Payment[]
  photos?: Photo[]
}

export type FineStatus = 
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'CANCELLED'
  | 'OVERDUE'
  | 'APPEALED'

export type SubjectType = 
  | 'concession'
  | 'concession_holder'
  | 'driver'

export interface Vehicle {
  id: string
  plate_number: string
  brand: string
  model: string
  year?: number
  color?: string
  status: string
}

export interface Concession {
  id: string
  concession_number: string
  status: string
  valid_from?: string
  valid_until?: string
}

export interface ConcessionHolder {
  id: string
  name: string
  document_number: string
  email?: string
  phone?: string
}

export interface ViolationType {
  id: string
  name: string
  description?: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  base_amount: number
  requires_photos: boolean
  requires_gps: boolean
}

export interface Payment {
  id: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  paid_at: string
  reference?: string
}

export type PaymentMethod = 
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'ONLINE'

export type PaymentStatus = 
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export interface Photo {
  id: string
  type: PhotoType
  url: string
  thumbnail_url?: string
  description?: string
  taken_at?: string
}

export type PhotoType = 
  | 'EVIDENCE'
  | 'DOCUMENT'
  | 'RECEIPT'
  | 'OTHER'

// Respuestas del API
export interface FineListResponse {
  data: Fine[]
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number
    last_page: number
    per_page: number
    to: number
    total: number
  }
}

export interface FineDetailResponse {
  data: Fine
}

// Parámetros de consulta
export interface FineListParams {
  per_page?: number
  page?: number
  sort_by?: 'created_at' | 'updated_at' | 'issued_at' | 'due_date' | 'status' | 'base_amount' | 'total_amount'
  sort_order?: 'asc' | 'desc'
  include_fields?: string[]
  include_computed?: string[]
  include_relations?: string[]
  status?: FineStatus
  subject_type?: SubjectType
}

// Filtros para la UI
export interface FineFilters {
  status?: FineStatus
  subject_type?: SubjectType
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  search?: string
  concession_id?: string
  concession_holder_id?: string
  violation_type_id?: string
  created_by?: string
  payment_status?: string
}

// Estadísticas de multas
export interface FineStats {
  total: number
  unpaid: number
  paid: number
  overdue: number
  total_amount: number
  unpaid_amount: number
  by_subject_type: {
    concession: number
    concession_holder: number
    driver: number
  }
  by_status: {
    [key in FineStatus]: number
  }
}
