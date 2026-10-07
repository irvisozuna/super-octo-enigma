import type { RespuestaActualizarAlcance, RespuestaAlcances, RespuestaGerencias, RespuestaMe, RespuestaSync } from '../types/api'
import type { RespuestaCambios, SectoresCollection, TomasCollection } from '../types/mapa'
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

function filtrosMapa(periodo: number | null, gerencia: number | null): Record<string, number> {
  const params: Record<string, number> = {}
  if (periodo)
    params.periodo = periodo
  if (gerencia)
    params.gerencia = gerencia

  return params
}

/** Tomas del periodo (GeoJSON compacto). El servidor manda ETag: el navegador revalida solo. */
export function obtenerTomasMapa(periodo: number | null, gerencia: number | null, { signal }: OpcionesPeticion = {}): Promise<TomasCollection> {
  return rawApi(`${BASE}/mapa/tomas`, { params: filtrosMapa(periodo, gerencia), signal })
}

export function obtenerCambiosMapa(periodo: number | null, gerencia: number | null, desde: string, { signal }: OpcionesPeticion = {}): Promise<RespuestaCambios> {
  return rawApi(`${BASE}/mapa/cambios`, { params: { ...filtrosMapa(periodo, gerencia), desde }, signal })
}

export function obtenerSectoresMapa(periodo: number | null, gerencia: number | null, { signal }: OpcionesPeticion = {}): Promise<SectoresCollection> {
  return rawApi(`${BASE}/mapa/sectores`, { params: filtrosMapa(periodo, gerencia), signal })
}
