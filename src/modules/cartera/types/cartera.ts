/*
 * Tipos de /api/collections (backend: app/Modules/Collections, XEL1-630 a XEL1-634).
 */

export interface ItemCatalogo {
  id: number
  codigo: string | null
  nombre: string
  padre: number | null
  activo: boolean
}

export interface Opcion<T = string> {
  codigo: T
  nombre: string
}

export interface Configuracion {
  vigencia_dias: number
  capacidad_lote: number
}

export interface RespuestaCatalogos {
  gerencias: ItemCatalogo[]
  sistemas: ItemCatalogo[]
  sectores: ItemCatalogo[]
  colonias: ItemCatalogo[]
  tipos_contrato: ItemCatalogo[]
  giros: ItemCatalogo[]
  estatus: ItemCatalogo[]
  notificadores: { id: string; nombre: string }[]
  resultados: Opcion<ResultadoNotificacion>[]
  configuracion: Configuracion
  corte: string | null
  puede_operar: boolean
}

export type NuncaHaPagado = 'incluir' | 'excluir' | 'solo'

/** Cuentas con convenio vigente (XEL1-656): por omisión se excluyen las que van al corriente. */
export type FiltroConvenio = 'excluir_al_corriente' | 'incluir' | 'solo_atrasados'

/** Filtros de la búsqueda; los mismos nombres que espera el servidor en `filtros`. */
export interface FiltrosBusqueda {
  gerencias: number[]
  sistemas: number[]
  sectores: number[]
  colonias: number[]
  tipos_contrato: number[]
  giros: number[]
  estatus: number[]
  meses_desde: number | null
  meses_hasta: number | null
  importe_desde: number | null
  importe_hasta: number | null
  ultimo_pago_dias: number | null
  ultimo_pago_importe_max: number | null
  nunca_ha_pagado: NuncaHaPagado
  convenio: FiltroConvenio
}

export interface ResumenBusqueda {
  corte: string | null
  en_padron: number
  con_adeudo: number
  con_vigente: number
  con_convenio?: number
  pagaron_despues?: number
  a_notificar: number
  mostradas?: number
}

export interface CuentaCandidata {
  contrato: number
  cuenta: string | null
  nombre: string | null
  domicilio: string[]
  gerencia: string | null
  sistema: string | null
  sector: string | null
  manzana: string | null
  lote: string | null
  tipo_contrato: string | null
  estatus: string | null
  adeudo: number
  meses: number | null
  ultimo_pago: string | null
  ultimo_pago_importe: number | null
  convenio: string | null
  convenio_estado: 'al_corriente' | 'atrasado' | null
  pagado_despues: number | null
}

export interface RespuestaVistaPrevia {
  resumen: ResumenBusqueda
  cuentas: CuentaCandidata[]
  capacidad_sugerida: number
}

export type EstadoDocumento = 'pendiente' | 'generando' | 'listo' | 'error' | null

export interface Lote {
  id: string
  ref: string | null
  notificador: string | null
  cuentas: number
  filtros: Record<string, unknown> | null
  documento: EstadoDocumento
  documento_error: string | null
  generado_en: string | null
}

export interface RespuestaGenerar {
  lote: Lote
  generadas: number
  descartadas: number[]
}

export interface Paginacion {
  pagina: number
  por_pagina: number
  total: number
}

export type EstadoTicket = 'creado' | 'pendiente' | 'fallido'

export interface Ticket {
  estado: EstadoTicket
  id?: number
  error?: string | null
  intentos?: number
}

export type ResultadoNotificacion =
  | 'no_entregada'
  | 'usuario_no_localizado'
  | 'toma_no_localizada'
  | 'duplicidad'
  | 'rechazada'
  | 'recibida'
  | 'firmada'

export type EstadoNotificacion = 'en_proceso' | ResultadoNotificacion | 'cancelada' | 'vencida' | 'sin_estado'

export interface Notificacion {
  id: string
  ref: string
  folio: string | null
  secuencia: number | null
  cuenta: string | null
  adeudo: number
  meses: number | null
  domicilio: string[]
  estado: string | null
  estado_codigo: EstadoNotificacion | null
  emitida: string | null
  vence: string | null
  entregada: string | null
  observacion: string | null
  cerrada: string | null
  origen: 'atencion' | 'legado'
  se_captura_aqui: boolean
  ticket: Ticket
  notificador?: string | null
  lote?: string | null
  lote_ref?: string | null
}

export interface RespuestaLote extends Lote {
  notificaciones: Notificacion[]
}

export interface RespuestaLotes {
  lotes: Lote[]
  paginacion: Paginacion
}

export interface RespuestaNotificaciones {
  notificaciones: Notificacion[]
  paginacion: Paginacion
  puede_operar: boolean
}

export interface NotificacionContrato extends Notificacion {
  recuperado: number | null
  pagado_total: number | null
}

export interface RespuestaNotificacionesContrato {
  notificaciones: NotificacionContrato[]
  vigente: boolean
}

export interface EventoHistorial {
  accion: string
  usuario: string | null
  antes: Record<string, unknown> | null
  despues: Record<string, unknown> | null
  fecha: string
}

export interface FichaNotificacion extends Notificacion {
  historial: EventoHistorial[]
  puede_operar: boolean
}

export interface ErrorCaptura {
  id: string
  ref: string | null
  motivo: string
}

export interface RespuestaCapturaBloque {
  capturadas: number
  errores: ErrorCaptura[]
}

export interface RespuestaConfiguracion {
  valores: Configuracion
  limites: Record<keyof Configuracion, { min: number; max: number }>
  puede_editar: boolean
}

/** Filtros de la lista de notificaciones. */
export interface FiltrosNotificaciones {
  estado: EstadoNotificacion | null
  lote: string | null
  notificador: string | null
  cuenta: string
  origen: 'atencion' | 'legado' | null
  desde: string | null
  hasta: string | null
}
