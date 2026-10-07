import type { RespuestaActualizarAlcance, RespuestaAlcances, RespuestaGerencias, RespuestaMe, RespuestaSync } from '../types/api'
import { rawApi } from '@/services/api'

/*
 * Una función por endpoint de /api/monitoring. Todas aceptan `signal` para cancelar.
 * El servidor ya acota cada respuesta al alcance por gerencia del usuario; aquí no se filtra nada.
 */

const BASE = '/monitoring'

export interface OpcionesPeticion {
  signal?: AbortSignal
}

export function obtenerMe({ signal }: OpcionesPeticion = {}): Promise<RespuestaMe> {
  return rawApi(`${BASE}/me`, { signal })
}

export function obtenerGerencias({ signal }: OpcionesPeticion = {}): Promise<RespuestaGerencias> {
  return rawApi(`${BASE}/gerencias`, { signal })
}

export function obtenerAlcances({ signal }: OpcionesPeticion = {}): Promise<RespuestaAlcances> {
  return rawApi(`${BASE}/admin/alcances`, { signal })
}

export function actualizarAlcance(usuarioId: string, gerencias: number[], { signal }: OpcionesPeticion = {}): Promise<RespuestaActualizarAlcance> {
  return rawApi(`${BASE}/admin/alcances/${encodeURIComponent(usuarioId)}`, { method: 'PUT', body: { gerencias }, signal })
}

export function obtenerEstadoSync({ signal }: OpcionesPeticion = {}): Promise<RespuestaSync> {
  return rawApi(`${BASE}/sync`, { signal })
}
