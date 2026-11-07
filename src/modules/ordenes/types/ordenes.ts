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
  usuario_comercial: number | null
  tipos: string[]
  gerencias: number[]
  sectores: number[]
  activo: boolean
}

export interface EdicionAgente {
  nombre: string
  tipos: string[]
  activo: boolean
  usuario_id: string | null
}

export interface UsuarioAgente {
  id: string
  nombre: string
  correo: string | null
}

export interface RespuestaAgentes {
  agentes: Agente[]
  puede_administrar: boolean
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
