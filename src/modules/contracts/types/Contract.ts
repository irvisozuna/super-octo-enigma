// Tipos base del contrato
export interface Contract {
  contratid: string
  account: string
  nameuser: string
  address: string
  type_contrat: string
  status: string
  status_id: string
  sector: string
  systems: string
  debt: string
  debt_months: string
}

// Detalle completo del contrato (endpoint /contracts/{id})
export interface ContractDetail extends Contract {
  rate_type: string
  rate_type_id: string
  type_charge: string
  type_charge_code: string
  socket_diameter: string
  business_activity: string
  pensionary: string
  due_date_pensioner: string | null
  handicapped: string
  due_date_handicapped: string | null
  cadastral_number: string
  clave_loc: string
  sequence: string
  measurer: string
  positive_balance: string
  type_services: number[]
  firefighters: string
  rfc: string
  recharge: number
  read_only: number
  trunks: number
  round_charge: string
  lecture: ContractLecture
}

// Información de lectura del contrato
export interface ContractLecture {
  last_read: string
  last_date_read: string
  debt: string
  debt_months: string
  amount_letters: string
  average_consumption: string
  last_latitude: string
  last_longitude: string
}

// Resumen de deuda
export interface ContractDebtSummary {
  contratid: string
  account: string
  nameuser: string
  debt: string
  debt_months: string
  average_consumption: string
  last_read: string
  last_date_read: string
  amount_letters: string
  has_debt: boolean
  status: string
}

// Validación de contrato
export interface ContractValidation {
  exists: boolean
  contratid: string | null
  account: string | null
  status?: string
  has_debt?: boolean
  debt_months?: string
  debt_amount?: string
}
