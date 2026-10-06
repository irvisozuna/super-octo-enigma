import type { OrdenDef, ValoresFiltros } from './reporte'

export type FormatoExportacion = 'xlsx' | 'csv' | 'pdf'

/** "todo" exporta el conjunto filtrado completo; "pagina" solo la página que se está viendo. */
export type AlcanceExportacion = 'todo' | 'pagina'

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
  duracion_ms: number | null
  tamano: number | null
  mensaje: string | null
  nombre_archivo: string | null
  url_descarga: string | null
  filtros: ValoresFiltros | null
  alcance: AlcanceExportacion | null
  expires_at: string | null
  created_at: string
  finished_at: string | null
}

/** POST /reporting/reports/{key}/exports */
export interface SolicitudExportacion {
  formato: FormatoExportacion
  alcance: AlcanceExportacion
  filtros: ValoresFiltros
  orden?: OrdenDef[]
  pagina?: number
  por_pagina?: number
  consulta_id?: string | null
}

export interface ExportacionCreada {
  ejecucion_id: string
  ejecucion: Ejecucion
}

export interface UrlFirmada {
  url: string
  expira_en_minutos: number
}

export const ESTADOS_TERMINADOS: EstadoEjecucion[] = ['done', 'failed', 'expired', 'canceled']

export function ejecucionTerminada(ejecucion: Pick<Ejecucion, 'estado'>): boolean {
  return ESTADOS_TERMINADOS.includes(ejecucion.estado)
}
