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
