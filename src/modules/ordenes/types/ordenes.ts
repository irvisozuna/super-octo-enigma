/*
 * Tipos de /api/work-orders y /api/legacy-bridge (núcleo, XEL1-629).
 */

export interface EstadoTipo {
  codigo: string
  nombre: string
  inicial: boolean
  cierra: boolean
  cancela: boolean
}

export interface TipoOrden {
  codigo: string
  nombre: string
  refleja_ticket: boolean
  captura_aqui: boolean
  estados: EstadoTipo[]
}

export interface Orden {
  id: string
  tipo: { codigo: string | null; nombre: string | null }
  estado: { codigo: string | null; nombre: string | null }
  contrato: number | null
  cuenta: string | null
  agente: { id: string; nombre: string } | null
  observacion: string | null
  entregada_en: string | null
  vence: string | null
  origen: string | null
  abierta_en: string | null
  cerrada_en: string | null
  datos: { motivo_nombre?: string; notificacion?: string; domicilio?: string[] } | null
}

export interface EventoOrden {
  accion: string
  usuario: string | null
  antes: Record<string, unknown> | null
  despues: Record<string, unknown> | null
  fecha: string
}

/** Detalle de una orden (XEL1-680): dónde se capturó, si se capturó con GPS, y su bitácora. */
export interface FichaOrden extends Orden {
  lat: number | null
  lng: number | null
  historial: EventoOrden[]
  puede_operar: boolean
}

export interface Paginacion {
  pagina: number
  por_pagina: number
  total: number
}

export interface RespuestaOrdenes {
  ordenes: Orden[]
  paginacion: Paginacion
}

export interface FiltrosOrdenes {
  tipo: string | null
  estado: string | null
  agente: string | null
  cuenta: string
  abiertas: boolean | null
}

export interface Agente {
  id: string
  nombre: string
  usuario_id: string | null

  /** Usuario de Aquasoft Comercial con el que entra a la app de campo. */
  usuario?: string | null

  /** Tiene el permiso de campo de lo que atiende (XEL1-674). */
  usa_app?: boolean

  /** Último uso de una sesión del usuario (ISO). */
  ultimo_acceso?: string | null
  usuario_comercial: number | null
  tipos: string[]
  gerencias: number[]
  sectores: number[]
  activo: boolean

  /** Órdenes abiertas, cerradas hoy y la última que cerró (XEL1-680). */
  carga?: { abiertas: number; cerradas_hoy: number; ultima_captura: string | null }
}

export interface EdicionAgente {
  nombre: string
  tipos: string[]
  activo: boolean

  /** Usuario de Aquasoft Comercial; `null` quita el usuario. */
  usuario: string | null
  usa_app: boolean

  /** Gerencias donde trabaja (XEL1-786); solo queda anotado. */
  gerencias: number[]
}

/** Resultado de la búsqueda de usuarios: solo usuario y nombre, y de qué agente es si ya está ligado. */
export interface UsuarioAgente {
  usuario: string
  nombre: string
  agente: string | null
  agente_id: string | null
}

export interface RespuestaAgentes {
  agentes: Agente[]
  puede_administrar: boolean

  /** Gerencias activas del padrón, para la ficha del agente (XEL1-786). */
  gerencias?: GerenciaAgente[]
}

export interface GerenciaAgente {
  id: number
  nombre: string
}

export interface ConteoPuente {
  operacion: string
  estado: 'pending' | 'processing' | 'done' | 'failed'
  n: number
  ultima: string | null
}

export interface EntradaPuente {
  id: string
  operacion: string
  entidad: string
  entidad_id: string
  estado: ConteoPuente['estado']
  intentos: number
  error: string | null
  disponible_en: string | null
  actualizada: string | null
}

export interface RespuestaPuente {
  tickets_activos: boolean
  conteos: ConteoPuente[]
  pendientes: EntradaPuente[]
}
