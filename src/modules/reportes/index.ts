// Módulo de reportes: listados con exportación, documentos por contrato y tableros (ver README.md)
export * as reportesApi from './services/reportesApi'
export { claveMensaje, normalizarError } from './services/errores'
export type { CodigoError, ErrorReporte } from './services/errores'
export * from './types'
export * from './utils/formato'
