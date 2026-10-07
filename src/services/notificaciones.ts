import { rawApi } from '@/services/api'

/** Campana de Atención: notificaciones en base de datos del usuario (las emite cualquier módulo del backend). */

export interface NotificacionApi {
  id: string
  tipo: string
  datos: Record<string, unknown> & { titulo?: string; url?: string; severidad?: string; modulo?: string; gerencia?: string | null; regla?: string }
  leida: boolean
  fecha: string | null
}

export interface RespuestaNotificaciones {
  notificaciones: NotificacionApi[]
  no_leidas: number
}

export function obtenerNotificaciones(limite = 30, signal?: AbortSignal): Promise<RespuestaNotificaciones> {
  return rawApi('/notifications', { params: { limite }, signal })
}

export function marcarLeidas(ids: string[] | 'todas'): Promise<{ marcadas: number; no_leidas: number }> {
  return rawApi('/notifications/leer', { method: 'POST', body: ids === 'todas' ? { todas: true } : { ids } })
}

export function marcarNoLeidas(ids: string[]): Promise<{ marcadas: number; no_leidas: number }> {
  return rawApi('/notifications/no-leer', { method: 'POST', body: { ids } })
}

export function borrarNotificacion(id: string): Promise<{ no_leidas: number }> {
  return rawApi(`/notifications/${id}`, { method: 'DELETE' })
}
