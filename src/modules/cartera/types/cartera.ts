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
  seguimiento_dias: number
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
  revision_padron: boolean
  prioridad: PrioridadCuenta | null
}

/** Prioridad explicable (XEL1-663). */
export interface PrioridadCuenta {
  nivel: 'alta' | 'media' | 'baja'
  probabilidad: number
  fraccion: number
  esperado: number
  razon: string
}

export type OrdenVistaPrevia = 'recorrido' | 'prioridad'

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

  /** Solo en la lista de lotes (XEL1-680). */
  avance?: AvanceLote
}

export interface AvanceLote {
  total: number
  capturadas: number
  entregadas: number
}

/** Solo en el detalle del lote (XEL1-680). */
export interface ResumenLote extends AvanceLote {
  por_estado: Partial<Record<EstadoNotificacion, number>>
  adeudo: number
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
  titular?: string | null

  /** Solo en el detalle del lote, para el mapa del recorrido. */
  toma?: { lat: number; lng: number } | null
}

export interface RespuestaLote extends Lote {
  notificaciones: Notificacion[]
  resumen?: ResumenLote
}

export interface RespuestaLotes {
  lotes: Lote[]
  paginacion: Paginacion
}

export interface RespuestaNotificaciones {
  notificaciones: Notificacion[]
  paginacion: Paginacion
  puede_operar: boolean

  /** Cuántas hay en cada estado con los demás filtros (sin el de estado), para los contadores (XEL1-680). */
  conteos?: Partial<Record<EstadoNotificacion, number>>
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

  /** El resultado se capturó desde la app de campo. */
  app?: boolean
}

/** La captura del resultado desde la app de campo (XEL1-679). */
export interface CapturaCampo {
  en: string | null
  lat: number | null
  lng: number | null
  precision_m: number | null
  distancia_m: number | null
  lejos: boolean
}

export interface FichaNotificacion extends Notificacion {
  historial: EventoHistorial[]
  puede_operar: boolean
  evidencias?: number
  titular?: string | null
  toma?: { lat: number; lng: number } | null
  captura_campo?: CapturaCampo | null
  umbral_lejos_m?: number
}

export type TipoEvidencia = 'acta' | 'fachada' | 'toma' | 'otro'

export interface Evidencia {
  id: string
  tipo: TipoEvidencia
  mime: string
  tamano: number
  nombre: string | null
  lat: number | null
  lng: number | null
  tomada_en: string | null
  subida_en: string | null
}

export interface RespuestaEvidencias {
  evidencias: Evidencia[]
  puede_subir: boolean
  puede_borrar: boolean
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

/* Seguimiento (XEL1-659) */

export type AccionSeguimiento = 'orden' | 'segunda' | 'descartada'

export interface CandidataSeguimiento {
  id: string
  ref: string
  contrato: number
  cuenta: string | null
  notificador: string | null
  estado: string
  estado_codigo: EstadoNotificacion
  origen: 'atencion' | 'legado'
  emitida: string
  entregada: string
  dias: number
  adeudo_notificado: number
  adeudo_actual: number
}

export interface OrdenSeguimiento {
  id: string
  cuenta: string | null
  contrato: number
  motivo: string | null
  abierta_en: string
  notificacion: { id: string; ref: string }
}

export interface RespuestaSeguimiento {
  dias: number
  candidatas: CandidataSeguimiento[]
  ordenes: OrdenSeguimiento[]
  puede_operar: boolean
}

export interface RespuestaAccionSeguimiento {
  aplicadas: number
  errores: { id: string; motivo: string }[]
  lote?: { id: string; ref: string | null }
}

// Monitor de campo (XEL1-681) ---------------------------------------------------------------------------------------

/** Una visita: hora del teléfono si se capturó en la app, hora del cierre si se capturó en la web. */
export interface VisitaCampo {
  notificacion_id: string
  agente_id: string | null
  ref: string
  cuenta: string | null
  resultado: string
  en: string
  lat: number | null
  lng: number | null
  precision_m: number | null
  distancia_m: number | null
  lejos: boolean
  app: boolean
}

export interface AgenteMonitor {
  id: string
  nombre: string
  usa_app: boolean
  por_visitar: number
  visitas: number
  entregadas: number
  desde_app: number
  lejos: number
  primera: string | null
  ultima: string | null
  ultima_posicion: { lat: number; lng: number; en: string } | null
}

export interface RespuestaMonitorCampo {
  indicadores: {
    activos: number
    notificadores: number
    visitas: number
    entregadas: number
    pct_entregadas: number | null
    desde_app: number
    lejos: number
    por_visitar: number
  }
  agentes: AgenteMonitor[]
  puntos: VisitaCampo[]
  umbral_lejos_m: number
  desde: string
  hasta: string
  generado_en: string
}

export interface RespuestaJornada {
  agente: { id: string; nombre: string }
  visitas: VisitaCampo[]
  desde: string
  hasta: string
}
