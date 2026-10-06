import type { ColumnaDef, Fila, FiltroDef, ValoresFiltros } from './reporte'

export type TipoWidget = 'kpi' | 'table' | 'bar' | 'line' | 'pie'

export type AnchoWidget = 3 | 4 | 6 | 12

export interface WidgetDef {
  id: string
  key: string
  tipo: TipoWidget
  titulo: string
  ancho: AnchoWidget
  config: Record<string, unknown>
}

/** GET /reporting/dashboards/{key} */
export interface TableroConfig {
  key: string
  titulo: string
  descripcion: string | null
  filtros: FiltroDef[]
  widgets: WidgetDef[]
  permisos: { puede_editar: boolean }
  version: number
}

/** POST /reporting/dashboards/{key}/widgets/{id}/data */
export interface SolicitudDatosWidget {
  filtros: ValoresFiltros
  forzar?: boolean
}

export interface DatosWidget {
  columnas: ColumnaDef[]
  filas: Fila[]
  cached_at: string | null
  cache_hit: boolean
  duracion_ms: number
}
