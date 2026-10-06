import type { ValoresFiltros } from './reporte'

export type FormatoExportacion = 'xlsx' | 'csv' | 'pdf'

export type AlcanceExportacion = 'todo' | 'visible'

export type EstadoEjecucion = 'queued' | 'running' | 'done' | 'failed' | 'expired' | 'canceled'

export type TipoEjecucion = 'view' | 'export' | 'document'

/** GET /reporting/executions/{id} */
export interface Ejecucion {
  id: string
  kind: TipoEjecucion
  object_key: string
  titulo: string | null
  formato: FormatoExportacion | null
  estado: EstadoEjecucion
  progreso: number | null
  filas: number | null
  mensaje: string | null
  url_descarga: string | null
  expires_at: string | null
  created_at: string
  finished_at: string | null
}

/** POST /reporting/reports/{key}/exports */
export interface SolicitudExportacion {
  consulta_id?: string
  filtros?: ValoresFiltros
  formato: FormatoExportacion
  alcance: AlcanceExportacion
}

export interface ExportacionCreada {
  ejecucion_id: string
}
