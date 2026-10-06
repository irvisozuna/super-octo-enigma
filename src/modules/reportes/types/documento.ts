import type { Ejecucion } from './exportacion'
import type { FiltroDef, ValoresFiltros } from './reporte'

/** Parámetro que pide un documento (p. ej. contrato, periodo). */
export interface ParametroDocumento {
  nombre: string
  tipo: string
  requerido: boolean
  etiqueta: string
}

/** GET /reporting/documents?contract=… */
export interface DocumentoDef {
  key: string
  titulo: string
  descripcion: string | null
  requiere_periodo: boolean

  /** Periodo sugerido (el anterior, ya facturado); null si el documento no lleva periodo. */
  periodo_default: number | string | null
  parametros: ParametroDocumento[]
}

/** POST /reporting/documents/{key}/generate */
export interface SolicitudDocumento {
  contrato: string
  periodo?: number | string | null
  parametros?: Record<string, string>
}

/** Siempre PDF en base64: un blob del mismo origen permite previsualizar, imprimir y descargar. */
export interface DocumentoGenerado {
  ejecucion_id: string
  nombre_archivo: string
  mime: 'application/pdf'
  pdf_base64: string
  tamano: number
  expires_at: string | null
}

/** GET /reporting/documents/{key}/batch: configuración de la generación en lote. */
export interface LoteConfig {
  documento: { key: string; titulo: string; descripcion: string | null }
  titulo: string
  descripcion: string | null
  filtros: FiltroDef[]
  maximo: number
}

/** POST /reporting/documents/{key}/batch/count */
export interface LoteConteo {
  contratos: number
  maximo: number
  excede: boolean
  filtros: ValoresFiltros
}

/** POST /reporting/documents/{key}/batch → 202: el lote ya es una exportación en cola. */
export interface LoteCreado {
  ejecucion_id: string
  ejecucion: Ejecucion
}
