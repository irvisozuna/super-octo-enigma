export interface Account {
  rowid: number
  id_account: number
  account: string
  socid: number
  nameuser: string
  date_created: string
  rfc: string
  sat_cname: string | null
  sat_RFC: string | null
  code_fiscal_regime: string | null
  fiscal_regime: string | null
  type_person: string | null
  id_usecfdi: string | null
  usecfdi: string | null
  sat_zip: string | null
  sat_emails: string | null
  address: string
  ubicaciontoma: string
  id_neighborhood: number
  neighborhood: string
  zip: string
  pensionary: string | null
  due_date_pensioner: string | null
  handicapped: string | null
  due_date_handicapped: string | null
  is_employee_contract: number
  retired_employee: string | null
  id_user_employee: string | null
  name_employee: string | null
  id_litigation: number
  litigation: string
  firefighters: number
  id_type_contrat: number
  code_type_contrat: string
  type_contrat: string
  id_status: number
  status: string
  id_source_entity: number
  source_entity: string
  id_system: number
  c_system: string
  community_id: number
  community: string
  route_id: number
  route: string
  id_sector: number
  sector: string
  block: string
  lot: string
  id_rate_type: number
  rate_type: string
  id_type_charge: number
  type_charge_code: string
  type_charge: string
  id_socket_diameter: number
  socket_diameter: string
  id_business_activity: number
  business_activity: string
  id_type_services: number
  type_services: string
  cadastral_number: string
  clave_loc: string
  sequence: string
  id_measurer: string | null
  measurer: string
  average_consumption: string
  id_agreement: string | null
  ref_agreement: string | null
  debt_agreement: number
  letters_agreement: number
  paid_letters_agreement: number
  last_pay: string
  last_pay_amount: number
  months_debt: number
  total_debt: number
  positive_balance: string
  debt: string
  ref: string | null
  latitude: number
  longitude: number
}
