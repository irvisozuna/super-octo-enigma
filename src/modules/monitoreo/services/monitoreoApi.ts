import type { RespuestaActualizarAlcance, RespuestaAlcances, RespuestaGerencias, RespuestaMe, RespuestaSync } from '../types/api'
import type { LecturistasCollection, RespuestaCambios, RespuestaRecorrido, RespuestaSinCoordenada, SectoresCollection, TomasCollection } from '../types/mapa'
import type { RespuestaJornada } from '../types/jornada'
import type { RespuestaDetalleLectura, RespuestaHistorial } from '../types/lectura'
import type { RespuestaDetalleSector } from '../types/sector'
import type { ParametrosMonitor, RespuestaCatalogos, RespuestaLecturistas, RespuestaResumen, RespuestaSectores } from '../types/monitor'
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

/** Opciones de los filtros (periodos, sistemas, sectores, lecturistas) dentro del alcance del usuario. */
export function obtenerCatalogos({ signal }: OpcionesPeticion = {}): Promise<RespuestaCatalogos> {
  return rawApi(`${BASE}/catalogos`, { signal })
}

/** Los cuatro indicadores de la pantalla principal. */
export function obtenerResumen(params: ParametrosMonitor, { signal }: OpcionesPeticion = {}): Promise<RespuestaResumen> {
  return rawApi(`${BASE}/resumen`, { params, signal })
}

/** Avance por sector del periodo (con lecturas del día si se manda `dia`). */
export function obtenerSectores(params: ParametrosMonitor, { signal }: OpcionesPeticion = {}): Promise<RespuestaSectores> {
  return rawApi(`${BASE}/sectores`, { params, signal })
}

/** Lecturistas del día con su jornada, estado y avisos. */
export function obtenerLecturistas(params: ParametrosMonitor, { signal }: OpcionesPeticion = {}): Promise<RespuestaLecturistas> {
  return rawApi(`${BASE}/lecturistas`, { params, signal })
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

/** Tomas activas sin coordenada por sector y estado: no se pintan, pero cuentan en la leyenda. */
export function obtenerSinCoordenada(periodo: number | null, gerencia: number | null, { signal }: OpcionesPeticion = {}): Promise<RespuestaSinCoordenada> {
  return rawApi(`${BASE}/mapa/sin-coordenada`, { params: filtrosMapa(periodo, gerencia), signal })
}

/** Última posición de los lecturistas del día (mismos filtros que /lecturistas). */
export function obtenerLecturistasMapa(params: ParametrosMonitor, { signal }: OpcionesPeticion = {}): Promise<LecturistasCollection> {
  return rawApi(`${BASE}/mapa/lecturistas`, { params, signal })
}

/** Recorrido del día de un lecturista (rastreo punto a punto + lecturas con GPS). */
export function obtenerRecorrido(lecturista: number, params: ParametrosMonitor, { signal }: OpcionesPeticion = {}): Promise<RespuestaRecorrido> {
  return rawApi(`${BASE}/mapa/recorrido`, { params: { ...params, lecturista }, signal })
}

/** Detalle de la lectura de un contrato en un periodo (404 si no existe o está fuera del alcance). */
export function obtenerDetalleLectura(contrato: number, periodo: number | null, { signal }: OpcionesPeticion = {}): Promise<RespuestaDetalleLectura> {
  return rawApi(`${BASE}/lecturas/${contrato}`, { params: periodo ? { periodo } : {}, signal })
}

/** Historial de lecturas del contrato desde Support (Dolibarr): las últimas `limite`. */
export function obtenerHistorialContrato(contrato: number, limite = 12, { signal }: OpcionesPeticion = {}): Promise<RespuestaHistorial> {
  return rawApi(`/supports/getReadingsByContract/${contrato}`, { params: { limit: limite, page: 1 }, signal })
}

/** Detalle de un sector en el periodo (404 si no existe o está fuera del alcance). */
export function obtenerDetalleSector(sector: number, params: ParametrosMonitor, { signal }: OpcionesPeticion = {}): Promise<RespuestaDetalleSector> {
  return rawApi(`${BASE}/sectores/${sector}`, { params, signal })
}

/** Pendientes del sector en Excel (descarga autenticada como Blob). */
export function descargarPendientesSector(sector: number, params: ParametrosMonitor, { signal }: OpcionesPeticion = {}): Promise<Blob> {
  return rawApi(`${BASE}/sectores/${sector}/pendientes.xlsx`, { params, responseType: 'blob', signal })
}

/** Jornada de un lecturista en un día (404 si no existe o está fuera del alcance). */
export function obtenerJornada(lecturista: number, dia: string | null, { signal }: OpcionesPeticion = {}): Promise<RespuestaJornada> {
  return rawApi(`${BASE}/lecturistas/${lecturista}`, { params: dia ? { dia } : {}, signal })
}
