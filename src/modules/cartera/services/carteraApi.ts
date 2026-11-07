import type {
  AccionSeguimiento,
  Evidencia,
  FichaNotificacion,
  RespuestaAccionSeguimiento,
  RespuestaCapturaBloque,
  RespuestaCatalogos,
  RespuestaConfiguracion,
  RespuestaEvidencias,
  RespuestaGenerar,
  RespuestaLote,
  RespuestaLotes,
  RespuestaNotificaciones,
  RespuestaNotificacionesContrato,
  RespuestaSeguimiento,
  RespuestaVistaPrevia,
  ResultadoNotificacion,
  ResumenBusqueda,
  TipoEvidencia,
} from '../types/cartera'
import { rawApi } from '@/services/api'

/*
 * Una función por endpoint de /api/collections. Las que leen aceptan `signal` para cancelar.
 * Los filtros de la búsqueda van en el cuerpo (`filtros`), igual que los recibe el servidor.
 */

const BASE = '/collections'

export interface OpcionesPeticion {
  signal?: AbortSignal
}

export function obtenerCatalogos({ signal }: OpcionesPeticion = {}): Promise<RespuestaCatalogos> {
  return rawApi(`${BASE}/catalogos`, { signal })
}

export function contarCuentas(filtros: Record<string, unknown>, { signal }: OpcionesPeticion = {}): Promise<ResumenBusqueda> {
  return rawApi(`${BASE}/busqueda/conteo`, { method: 'POST', body: { filtros }, signal })
}

export function vistaPrevia(filtros: Record<string, unknown>, { signal }: OpcionesPeticion = {}): Promise<RespuestaVistaPrevia> {
  return rawApi(`${BASE}/busqueda`, { method: 'POST', body: { filtros }, signal })
}

export function generarLote(filtros: Record<string, unknown>, contratos: number[], notificador: string): Promise<RespuestaGenerar> {
  return rawApi(`${BASE}/lotes`, { method: 'POST', body: { filtros, contratos, notificador } })
}

export function obtenerLotes(pagina = 1, porPagina = 25, { signal }: OpcionesPeticion = {}): Promise<RespuestaLotes> {
  return rawApi(`${BASE}/lotes`, { params: { page: pagina, por_pagina: porPagina }, signal })
}

export function obtenerLote(id: string, { signal }: OpcionesPeticion = {}): Promise<RespuestaLote> {
  return rawApi(`${BASE}/lotes/${encodeURIComponent(id)}`, { signal })
}

export function descargarDocumentoLote(id: string): Promise<Blob> {
  return rawApi(`${BASE}/lotes/${encodeURIComponent(id)}/documento`, { responseType: 'blob' })
}

export function rearmarDocumentoLote(id: string): Promise<RespuestaLote> {
  return rawApi(`${BASE}/lotes/${encodeURIComponent(id)}/documento`, { method: 'POST' })
}

export function obtenerNotificaciones(params: Record<string, string | number>, { signal }: OpcionesPeticion = {}): Promise<RespuestaNotificaciones> {
  return rawApi(`${BASE}/notificaciones`, { params, signal })
}

/** Notificaciones de una cuenta, para la ficha del contrato en Soporte (XEL1-658). */
export function obtenerNotificacionesContrato(contrato: number | string, { signal }: OpcionesPeticion = {}): Promise<RespuestaNotificacionesContrato> {
  return rawApi(`${BASE}/contratos/${encodeURIComponent(String(contrato))}/notificaciones`, { signal })
}

export function obtenerNotificacion(id: string, { signal }: OpcionesPeticion = {}): Promise<FichaNotificacion> {
  return rawApi(`${BASE}/notificaciones/${encodeURIComponent(id)}`, { signal })
}

export function descargarDocumentoNotificacion(id: string): Promise<Blob> {
  return rawApi(`${BASE}/notificaciones/${encodeURIComponent(id)}/documento`, { responseType: 'blob' })
}

export function capturarResultado(id: string, resultado: ResultadoNotificacion, fecha: string, observacion?: string | null): Promise<FichaNotificacion> {
  return rawApi(`${BASE}/notificaciones/${encodeURIComponent(id)}/resultado`, { method: 'POST', body: { resultado, fecha, observacion: observacion || undefined } })
}

export function capturarEnBloque(notificaciones: string[], resultado: ResultadoNotificacion, fecha: string, observacion?: string | null): Promise<RespuestaCapturaBloque> {
  return rawApi(`${BASE}/notificaciones/resultados`, { method: 'POST', body: { notificaciones, resultado, fecha, observacion: observacion || undefined } })
}

export function cancelarNotificacion(id: string, motivo: string): Promise<FichaNotificacion> {
  return rawApi(`${BASE}/notificaciones/${encodeURIComponent(id)}/cancelar`, { method: 'POST', body: { motivo } })
}

export function obtenerEvidencias(aviso: string, { signal }: OpcionesPeticion = {}): Promise<RespuestaEvidencias> {
  return rawApi(`${BASE}/notificaciones/${encodeURIComponent(aviso)}/evidencias`, { signal })
}

export function subirEvidencias(aviso: string, tipo: TipoEvidencia, archivos: File[]): Promise<{ guardadas: Evidencia[] }> {
  const cuerpo = new FormData()

  cuerpo.append('tipo', tipo)
  archivos.forEach(a => cuerpo.append('archivos[]', a))

  return rawApi(`${BASE}/notificaciones/${encodeURIComponent(aviso)}/evidencias`, { method: 'POST', body: cuerpo })
}

export function descargarEvidencia(id: string): Promise<Blob> {
  return rawApi(`${BASE}/evidencias/${encodeURIComponent(id)}`, { responseType: 'blob' })
}

export function borrarEvidencia(id: string): Promise<{ ok: boolean }> {
  return rawApi(`${BASE}/evidencias/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function obtenerSeguimiento({ signal }: OpcionesPeticion = {}): Promise<RespuestaSeguimiento> {
  return rawApi(`${BASE}/seguimiento`, { signal })
}

export function accionSeguimiento(notificaciones: string[], accion: AccionSeguimiento, motivo: string, notificador?: string | null): Promise<RespuestaAccionSeguimiento> {
  return rawApi(`${BASE}/seguimiento`, { method: 'POST', body: { notificaciones, accion, motivo, notificador: notificador || undefined } })
}

export function cerrarOrdenSeguimiento(id: string, estado: 'atendida' | 'cancelada', nota: string): Promise<{ id: string; estado: string; cerrada_en: string }> {
  return rawApi(`${BASE}/seguimiento/ordenes/${encodeURIComponent(id)}`, { method: 'POST', body: { estado, nota } })
}

export function obtenerConfiguracion({ signal }: OpcionesPeticion = {}): Promise<RespuestaConfiguracion> {
  return rawApi(`${BASE}/configuracion`, { signal })
}

export function guardarConfiguracion(valores: Partial<Record<'vigencia_dias' | 'capacidad_lote' | 'seguimiento_dias', number>>): Promise<RespuestaConfiguracion> {
  return rawApi(`${BASE}/configuracion`, { method: 'PUT', body: valores })
}
