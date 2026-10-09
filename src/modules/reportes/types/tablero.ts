import type { Fila, FiltroDef, FormatoColumna, ValoresFiltros } from './reporte'

export type TipoWidget = 'kpi' | 'table' | 'bar' | 'line' | 'pie'

export type AnchoWidget = 3 | 4 | 6 | 12

export interface MetricaWidget {
  column: string
  agg: 'sum' | 'count' | 'avg' | 'min' | 'max'
  format: FormatoColumna
  label: string | null

  /** Razón de dos sumas: [numerador, denominador] × `factor` (100 para porcentaje). */
  ratio?: [string, string]
  factor?: number
}

export interface WidgetDef {
  id: string
  key: string
  tipo: TipoWidget
  titulo: string
  ancho: AnchoWidget
  fuente: string | null
  config: Record<string, unknown>
}

/** GET /reporting/dashboards/{key} */
export interface TableroConfig {
  key: string
  titulo: string
  descripcion: string | null
  categoria: string | null
  filtros: FiltroDef[]
  widgets: WidgetDef[]
  layout: Record<string, unknown> | null
  permisos: { puede_editar: boolean }
  version: number
}

/** POST /reporting/dashboards/{key}/widgets/{id}/data */
export interface SolicitudDatosWidget {
  filtros: ValoresFiltros
  forzar?: boolean
}

export interface ColumnaWidget {
  columna: string
  etiqueta: string
  formato: FormatoColumna
}

/** Fila de un KPI: `valor`; de una serie: `dimension`, `valor` y, si hay series apiladas, `series`; de una tabla: las columnas. */
export type FilaWidget = Fila & {
  dimension?: string
  valor?: number | string | null
  series?: Record<string, number | string | null>
}

export interface DatosWidget {
  columnas: ColumnaWidget[]
  filas: FilaWidget[]
  filas_fuente: number
  cached_at: string | null
  cache_hit: boolean
  duracion_ms: number
  filtros: ValoresFiltros
}
