/** GET /reporting/documents?contract=… */
export interface DocumentoDef {
  key: string
  titulo: string
  descripcion: string | null
  requiere_periodo: boolean
}

/** POST /reporting/documents/{key}/generate */
export interface SolicitudDocumento {
  contrato: string
  periodo?: number | string | null
}

/** Siempre PDF en base64: un blob del mismo origen permite previsualizar, imprimir y descargar. */
export interface DocumentoGenerado {
  nombre_archivo: string
  mime: 'application/pdf'
  pdf_base64: string
  expires_at: string | null
}
