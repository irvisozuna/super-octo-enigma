import type { FormatoExportacion } from './exportacion'
import type { FormatoColumna, TipoColumna } from './reporte'

/** Fuente de datos tal como la ve el constructor (sin SQL). GET /reporting/admin/sources */
export interface FuenteResumen {
  key: string
  name: string
  description: string | null
  mode: 'materialize' | 'paginate'
  max_rows: number
  params: { name: string; type: string; required: boolean }[]
  filters: { filter: string; bind: string }[]
  columns: { name: string; type?: TipoColumna; label?: string }[]
  version: number
}

/** Definición de reporte que se guarda desde la pantalla (mismas llaves que el archivo JSON). */
export interface DefinicionReporte {
  key?: string | null
  name: string
  description?: string | null
  source: string
  category?: string | null
  columns: { column: string; label?: string; format?: FormatoColumna; align?: 'start' | 'center' | 'end'; visible?: boolean; total?: boolean }[]
  filters?: { filter: string; required?: boolean; fixed?: boolean; hidden?: boolean; default?: unknown }[]
  default_order?: { column: string; dir?: 'asc' | 'desc' }[]
  export_formats?: FormatoExportacion[]
  pdf_template?: string | null
  settings?: Record<string, unknown> | null
  order?: number
}

/** Fila de GET /reporting/admin/reports */
export interface ReporteAdmin extends DefinicionReporte {
  key: string
  origin: 'code' | 'ui'
  version: number
  is_active: boolean
  updated_at: string | null
}
