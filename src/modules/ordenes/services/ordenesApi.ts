import type { Agente, EdicionAgente, Orden, RespuestaAgentes, RespuestaOrdenes, RespuestaPuente, TipoOrden, UsuarioAgente } from '../types/ordenes'
import { rawApi } from '@/services/api'

/* Una función por endpoint del núcleo: órdenes de trabajo, agentes de campo y estado del puente. */

export interface OpcionesPeticion {
  signal?: AbortSignal
}

export function obtenerCatalogo({ signal }: OpcionesPeticion = {}): Promise<{ tipos: TipoOrden[] }> {
  return rawApi('/work-orders/catalogo', { signal })
}

export function obtenerOrdenes(params: Record<string, string | number>, { signal }: OpcionesPeticion = {}): Promise<RespuestaOrdenes> {
  return rawApi('/work-orders', { params, signal })
}

export function cambiarEstadoOrden(id: string, estado: string, observacion: string): Promise<Orden> {
  return rawApi(`/work-orders/${encodeURIComponent(id)}/estado`, { method: 'POST', body: { estado, observacion } })
}

export function obtenerAgentes({ signal }: OpcionesPeticion = {}): Promise<RespuestaAgentes> {
  return rawApi('/work-orders/agentes', { signal })
}

/** Usuarios de la empresa para ligar a un agente (la app de campo entra con ese usuario). */
export function obtenerUsuariosAgente({ signal }: OpcionesPeticion = {}): Promise<{ usuarios: UsuarioAgente[] }> {
  return rawApi('/work-orders/agentes/usuarios', { signal })
}

export function guardarAgente(id: string | null, datos: EdicionAgente): Promise<Agente> {
  return id
    ? rawApi(`/work-orders/agentes/${encodeURIComponent(id)}`, { method: 'PUT', body: datos })
    : rawApi('/work-orders/agentes', { method: 'POST', body: datos })
}

export function obtenerPuente({ signal }: OpcionesPeticion = {}): Promise<RespuestaPuente> {
  return rawApi('/legacy-bridge/outbox', { signal })
}
