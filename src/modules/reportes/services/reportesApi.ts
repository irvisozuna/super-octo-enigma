import type { RespuestaAbilities, RespuestaMenu } from '../types/api'
import type { DocumentoDef, DocumentoGenerado, SolicitudDocumento } from '../types/documento'
import type { Ejecucion, ExportacionCreada, SolicitudExportacion, UrlFirmada } from '../types/exportacion'
import type { DefinicionReporte, FuenteResumen, MatrizPermisos, ReporteAdmin, RespuestaPermisosRol } from '../types/admin'
import type { ConsultaEnCurso, Opcion, ParametrosConsulta, ReporteConfig, ResultadoConsulta, ValoresFiltros } from '../types/reporte'
import type { DatosWidget, SolicitudDatosWidget, TableroConfig } from '../types/tablero'
import { rawApi } from '@/services/api'

/*
 * Una función por endpoint de /api/reporting. Todas aceptan `signal` para cancelar
 * (cada consulta nueva aborta la anterior; al salir de la pantalla se abortan todas).
 */

const BASE = '/reporting'

export interface OpcionesPeticion {
  signal?: AbortSignal
}

export interface ParametrosOpciones {
  padres?: Record<string, unknown>
  q?: string
  limite?: number
}

export function obtenerMenu({ signal }: OpcionesPeticion = {}): Promise<RespuestaMenu> {
  return rawApi(`${BASE}/menu`, { signal })
}

export function obtenerAbilities({ signal }: OpcionesPeticion = {}): Promise<RespuestaAbilities> {
  return rawApi(`${BASE}/me/abilities`, { signal })
}

export function obtenerReporte(clave: string, { signal }: OpcionesPeticion = {}): Promise<ReporteConfig> {
  return rawApi(`${BASE}/reports/${encodeURIComponent(clave)}`, { signal })
}

export function ejecutarReporte(clave: string, parametros: ParametrosConsulta, { signal }: OpcionesPeticion = {}): Promise<ResultadoConsulta | ConsultaEnCurso> {
  return rawApi(`${BASE}/reports/${encodeURIComponent(clave)}/run`, { method: 'POST', body: parametros, signal })
}

export function opcionesFiltro(clave: string, { padres = {}, q, limite }: ParametrosOpciones = {}, { signal }: OpcionesPeticion = {}): Promise<Opcion[]> {
  const params: Record<string, unknown> = { q, limit: limite }

  Object.entries(padres).forEach(([padre, valor]) => {
    params[`parent[${padre}]`] = Array.isArray(valor) ? valor.join(',') : valor
  })

  return rawApi(`${BASE}/filters/${encodeURIComponent(clave)}/options`, { params, signal })
}

export function crearExportacion(clave: string, solicitud: SolicitudExportacion, { signal }: OpcionesPeticion = {}): Promise<ExportacionCreada> {
  return rawApi(`${BASE}/reports/${encodeURIComponent(clave)}/exports`, { method: 'POST', body: solicitud, signal })
}

export function listarEjecuciones({ signal }: OpcionesPeticion = {}): Promise<Ejecucion[]> {
  return rawApi(`${BASE}/executions`, { params: { mine: 1 }, signal })
}

export function obtenerEjecucion(id: string, { signal }: OpcionesPeticion = {}): Promise<Ejecucion> {
  return rawApi(`${BASE}/executions/${encodeURIComponent(id)}`, { signal })
}

/** Cancela si sigue en cola; si ya terminó, borra el archivo. Devuelve la ejecución actualizada. */
export function cancelarEjecucion(id: string): Promise<Ejecucion> {
  return rawApi(`${BASE}/executions/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Descarga autenticada (Bearer); el archivo se entrega como Blob para guardarlo desde el navegador. */
export function descargarEjecucion(id: string, { signal }: OpcionesPeticion = {}): Promise<Blob> {
  return rawApi(`${BASE}/executions/${encodeURIComponent(id)}/download`, { responseType: 'blob', signal })
}

/** URL firmada temporal (10 min) para abrir el archivo en una pestaña nueva sin encabezados. */
export function urlFirmadaEjecucion(id: string): Promise<UrlFirmada> {
  return rawApi(`${BASE}/executions/${encodeURIComponent(id)}/signed-url`)
}

/* Administración (manage reporting) */

export function listarFuentes({ signal }: OpcionesPeticion = {}): Promise<FuenteResumen[]> {
  return rawApi(`${BASE}/admin/sources`, { signal })
}

export function listarCategorias({ signal }: OpcionesPeticion = {}): Promise<string[]> {
  return rawApi(`${BASE}/admin/categories`, { signal })
}

export function listarReportesAdmin({ signal }: OpcionesPeticion = {}): Promise<ReporteAdmin[]> {
  return rawApi(`${BASE}/admin/reports`, { signal })
}

export function crearReporte(definicion: DefinicionReporte): Promise<ReporteAdmin> {
  return rawApi(`${BASE}/admin/reports`, { method: 'POST', body: definicion })
}

export function actualizarReporte(clave: string, definicion: DefinicionReporte): Promise<ReporteAdmin> {
  return rawApi(`${BASE}/admin/reports/${encodeURIComponent(clave)}`, { method: 'PUT', body: definicion })
}

export function eliminarReporte(clave: string): Promise<{ mensaje: string }> {
  return rawApi(`${BASE}/admin/reports/${encodeURIComponent(clave)}`, { method: 'DELETE' })
}

export function previsualizarReporte(definicion: DefinicionReporte, filtros: ValoresFiltros, { signal }: OpcionesPeticion = {}): Promise<ResultadoConsulta> {
  return rawApi(`${BASE}/admin/reports/preview`, { method: 'POST', body: { ...definicion, filtros, por_pagina: 20 }, signal })
}

/** Matriz roles × reportes/tableros/documentos (manage reporting). */
export function obtenerMatrizPermisos({ signal }: OpcionesPeticion = {}): Promise<MatrizPermisos> {
  return rawApi(`${BASE}/admin/grants`, { signal })
}

export function actualizarPermisosRol(rol: string, permisos: string[]): Promise<RespuestaPermisosRol> {
  return rawApi(`${BASE}/admin/roles/${encodeURIComponent(rol)}/grants`, { method: 'PUT', body: { permisos } })
}

export function obtenerTablero(clave: string, { signal }: OpcionesPeticion = {}): Promise<TableroConfig> {
  return rawApi(`${BASE}/dashboards/${encodeURIComponent(clave)}`, { signal })
}

export function datosWidget(clave: string, widgetId: string, solicitud: SolicitudDatosWidget, { signal }: OpcionesPeticion = {}): Promise<DatosWidget> {
  return rawApi(`${BASE}/dashboards/${encodeURIComponent(clave)}/widgets/${encodeURIComponent(widgetId)}/data`, { method: 'POST', body: solicitud, signal })
}

export function listarDocumentos(contrato: string, { signal }: OpcionesPeticion = {}): Promise<DocumentoDef[]> {
  return rawApi(`${BASE}/documents`, { params: { contract: contrato }, signal })
}

export function generarDocumento(clave: string, solicitud: SolicitudDocumento, { signal }: OpcionesPeticion = {}): Promise<DocumentoGenerado> {
  return rawApi(`${BASE}/documents/${encodeURIComponent(clave)}/generate`, { method: 'POST', body: solicitud, signal })
}

export type { ValoresFiltros }
