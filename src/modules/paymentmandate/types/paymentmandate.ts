export interface MandateItem {
  id: string
  mandate_lot_id: string
  contract_id: string
  client_name: string
  client_reference: string
  card_number: string
  card_expiration_date: string
  cmd_trans: string
  amount: number
  status: string
  bank_response_code: string | null
  error_message: string | null
  paid_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface Paymentmandate {
  id: string
  company_id: string
  organization_id: string
  consecutive_number: number
  status: string
  file_path: string
  created_by: string
  items: MandateItem[]
  created_at: string
  updated_at: string
}
