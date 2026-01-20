/**
 * Contract Entity - Domain Layer
 */

export interface DebtConcept {
  id: string
  company_id: string
  downloaded_contract_id: string
  concept_id: string
  external_concept_id: string
  concept_code: string
  concept_name: string
  period_id: string
  period_code: string
  quantity: string
  unit_price: string
  subtotal: string
  iva_rate: string
  iva_amount: string
  total: string
  downloaded_at: string
  meta: any
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ChargeConcept {
  id: string
  company_id: string
  downloaded_contract_id: string
  period_id: string
  period_code: string
  concept_id: string
  external_concept_id: string
  concept_code: string
  concept_name: string
  downloaded_at: string
  meta: any
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface ContractEntity {
  id: string
  company_id: string
  contract_id: string
  external_user_id: string
  contract_type: string
  route: string
  rate: string
  status: string
  period: string
  contract_number: string
  user_name: string
  address: string
  rfc: string
  business_activity: string
  charge_type: string
  fixed_m3: number
  meter_number: string
  socket_diameter: string
  average_consumption: number
  sequence: number
  cadastral_number: string
  clave_loc: string
  firefighters: boolean
  litigation: boolean
  pensionary: boolean
  due_date_pensioner: string
  handicapped: boolean
  due_date_handicapped: string
  months_debt: number
  debt: number
  is_active: boolean
  downloaded_at: string
  meta: any
  metadata: any
  system: string | null
  sector: string | null
  debt_concepts: DebtConcept[]
  charge_concepts: ChargeConcept[]
}
