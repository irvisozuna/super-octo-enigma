export interface TableColumn {
  name: string
  displayName?: string
  [key: string]: any
}

export interface JoinOnCondition {
  leftTable: string
  leftField: string
  operator: string
  rightTable: string
  rightField: string
}

export interface Join {
  id: string
  table: string
  type: 'INNER' | 'LEFT' | 'RIGHT'
  alias: string
  on: JoinOnCondition[]
  mainField?: string
  joinField?: string
}

export interface Field {
  field: string
  aggregation?: string
  groupBy?: boolean
  alias?: string
  expression?: string
  format?: string
  onlyGear?: boolean
}

export interface Filter {
  field?: string
  operator?: string
  value?: any
  logic?: 'AND' | 'OR'
  group?: Filter[]
}

export interface Sorting {
  id?: string
  field: string
  direction: 'ASC' | 'DESC'
}

export interface GroupBy {
  id?: string
  field: string
  alias?: string
}

export interface PaginationConfig {
  enabled: boolean
  pageSize: number
}

export interface CacheConfig {
  enabled: boolean
  ttl: number
}

export interface WizardData {
  connection_id: string | null
  connection_name: string
  name: string
  table: string
  tableColumns: TableColumn[]
  joins: Join[]
  joinColumns: Record<string, TableColumn[]>
  selectedFields: Field[]
  fieldAliases: Record<string, string>
  type: string
  procedureColumns: TableColumn[]
  filters: Filter[]
  sorting: Sorting[]
  groupBy: GroupBy[]
  description?: string
  pagination?: PaginationConfig
  cacheConfig?: CacheConfig
  isActive?: boolean
  custom_sql?: string
  procedure?: string
  procedureParams?: Record<string, any>
  sql_generated?: string

  // Puedes agregar aquí otros campos que uses en el wizard
}
