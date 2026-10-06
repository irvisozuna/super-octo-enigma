import type { FormatoExportacion } from './exportacion'

export type TipoColumna = 'string' | 'integer' | 'decimal' | 'date' | 'datetime' | 'boolean'

export type FormatoColumna = 'texto' | 'entero' | 'decimal' | 'moneda' | 'porcentaje' | 'fecha' | 'fechaHora' | 'booleano' | 'periodo'

export type AlineacionColumna = 'start' | 'center' | 'end'

export interface ColumnaDef {
  columna: string
  etiqueta: string
  tipo: TipoColumna
  formato: FormatoColumna
  alineacion: AlineacionColumna
  visible: boolean
  total: boolean
  ancho?: number
  fija?: boolean
}

export type TipoFiltro = 'select' | 'multiselect' | 'period' | 'period_range' | 'date_range' | 'boolean' | 'text' | 'search' | 'number'

export interface Opcion {
  value: string | number
  label: string
}

export interface FiltroDef {
  key: string
  etiqueta: string
  tipo: TipoFiltro
  requerido: boolean
  fijo: boolean
  oculto: boolean
  depende_de: string[]
  opciones: Opcion[] | null
  opciones_remotas: boolean
  valor_default: unknown
  config: Record<string, unknown>
}

export interface OrdenDef {
  columna: string
  dir: 'asc' | 'desc'
}

export interface PermisosReporte {
  puede_exportar: boolean
  puede_editar: boolean
}

/** GET /reporting/reports/{key}: configuración para el visor. */
export interface ReporteConfig {
  key: string
  titulo: string
  descripcion: string | null
  categoria: string | null
  columnas: ColumnaDef[]
  filtros: FiltroDef[]
  orden_default: OrdenDef[]
  formatos: FormatoExportacion[]
  por_pagina_default: number
  por_pagina_max: number
  permisos: PermisosReporte
  version: number
}

export type ValoresFiltros = Record<string, unknown>

/** POST /reporting/reports/{key}/run */
export interface ParametrosConsulta {
  filtros: ValoresFiltros
  pagina: number
  por_pagina: number
  orden: OrdenDef[]
  forzar?: boolean
  incluir_totales?: boolean
  consulta_id?: string | null
}

export type Fila = Record<string, unknown>

export interface ResultadoConsulta {
  consulta_id: string
  filas: Fila[]
  total_filas: number
  totales: Record<string, number | string> | null
  pagina: number
  por_pagina: number
  cached_at: string | null
  expires_at: string | null
  cache_hit: boolean
  duracion_ms: number
}

/** Respuesta 202: la consulta tardó más que el límite síncrono y se sigue por polling. */
export interface ConsultaEnCurso {
  ejecucion_id: string
}

export function esConsultaEnCurso(respuesta: ResultadoConsulta | ConsultaEnCurso): respuesta is ConsultaEnCurso {
  return 'ejecucion_id' in respuesta
}
