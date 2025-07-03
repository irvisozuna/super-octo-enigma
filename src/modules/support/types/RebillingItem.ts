export interface RebillingItem {
  rowid: number
  fk_contrat: number
  fk_facture: number
  period: number
  old_hydrometer: number
  old_intake: number
  old_past_intake: number
  old_cost: string
  new_hydrometer: number
  new_intake: number
  new_past_intake: number
  new_cost: string
  created_by: string
  created_by_name: string
  date_creation: string
  type_log: string
  comments: string
}
export interface TableItem {
  Consumo?: string
  Fecha?: string
  rebilling?: RebillingItem[]
  PeriodoCode?: string
  [key: string]: any
}
