import { HttpResponse, delay, http } from 'msw'
import type { RespuestaMenu } from '../types/api'
import type { Fila, ParametrosConsulta, ReporteConfig, ResultadoConsulta } from '../types/reporte'

/*
 * Datos de ejemplo para trabajar la interfaz sin backend (VITE_REPORTES_MOCK=true).
 * Imitan la forma exacta del API; no sustituyen las pruebas contra el backend real.
 */

const base = `${import.meta.env.VITE_API_BASE_URL ?? ''}/reporting`

export const menuEjemplo: RespuestaMenu = {
  categorias: [
    {
      nombre: 'Facturación',
      elementos: [
        { tipo: 'reporte', key: 'facturacion_por_concepto', titulo: 'Facturación por conceptos', descripcion: 'Importe facturado por concepto y gerencia en un periodo.', categoria: 'Facturación' },
        { tipo: 'reporte', key: 'facturacion', titulo: 'Facturación', descripcion: 'Detalle de facturas del periodo.', categoria: 'Facturación' },
      ],
    },
    {
      nombre: 'Cartera',
      elementos: [
        { tipo: 'tablero', key: 'cartera_vencida', titulo: 'Cartera vencida', descripcion: null, categoria: 'Cartera' },
      ],
    },
  ],
  documentos: [
    { key: 'duplicado_no_servicio', titulo: 'Duplicado de recibo (no servicio)', descripcion: null },
  ],
}

export const reporteEjemplo: ReporteConfig = {
  key: 'facturacion_por_concepto',
  titulo: 'Facturación por conceptos',
  descripcion: 'Importe facturado por concepto y gerencia en un periodo.',
  categoria: 'Facturación',
  columnas: [
    { columna: 'PERIODO', etiqueta: 'Periodo', tipo: 'string', formato: 'periodo', alineacion: 'start', visible: true, total: false },
    { columna: 'ENTIDAD', etiqueta: 'Gerencia', tipo: 'string', formato: 'texto', alineacion: 'start', visible: true, total: false },
    { columna: 'CONCEPTO', etiqueta: 'Concepto', tipo: 'string', formato: 'texto', alineacion: 'start', visible: true, total: false },
    { columna: 'TOTAL', etiqueta: 'Total', tipo: 'decimal', formato: 'moneda', alineacion: 'end', visible: true, total: true, ayuda: { resumen: 'Importe facturado del concepto en el periodo.', origen: 'Recibos del periodo en Aquasoft Comercial, sin borradores ni cancelados.', calculo: 'Suma del importe de cada concepto en los recibos.' } },
  ],
  filtros: [
    { key: 'periodo', etiqueta: 'Periodo', tipo: 'period', requerido: true, fijo: false, oculto: false, depende_de: [], opciones: null, opciones_remotas: true, valor_default: 185, config: {} },
    { key: 'gerencia', etiqueta: 'Gerencia', tipo: 'multiselect', requerido: false, fijo: false, oculto: false, depende_de: [], opciones: null, opciones_remotas: true, valor_default: null, config: {} },
  ],
  orden_default: [{ columna: 'CONCEPTO', dir: 'asc' }],
  formatos: ['xlsx', 'csv', 'pdf'],
  limites_exportacion: { xlsx: 500_000, csv: 1_000_000, pdf: 5_000 },
  por_pagina_default: 50,
  por_pagina_max: 500,
  permisos: { puede_exportar: true, puede_editar: false },
  version: 1,
}

const gerencias = ['LA PAZ', 'SAN JOSÉ DEL CABO', 'CABO SAN LUCAS', 'TODOS SANTOS', 'LOS BARRILES']
const conceptos = ['AGUA', 'ALCANTARILLADO', 'SANEAMIENTO', 'IVA', 'RECARGOS', 'RECONEXIÓN']

function filasEjemplo(): Fila[] {
  const filas: Fila[] = []

  gerencias.forEach((gerencia, g) => {
    conceptos.forEach((concepto, c) => {
      filas.push({ PERIODO: 'SEPTIEMBRE 2026', ENTIDAD: gerencia, CONCEPTO: concepto, TOTAL: Number(((g + 1) * 1_234_567.89 + (c + 1) * 98_765.43).toFixed(2)) })
    })
  })

  return filas
}

export const handlers = [
  http.get(`${base}/menu`, async () => {
    await delay(300)

    return HttpResponse.json(menuEjemplo)
  }),

  http.get(`${base}/reports/:clave`, async ({ params }) => {
    await delay(200)
    if (params.clave !== reporteEjemplo.key)
      return HttpResponse.json({ codigo: 'NO_ENCONTRADO', mensaje: 'El reporte no existe.', reintentable: false }, { status: 404 })

    return HttpResponse.json(reporteEjemplo)
  }),

  http.post(`${base}/reports/:clave/run`, async ({ request }) => {
    const parametros = await request.json() as ParametrosConsulta

    await delay(parametros.forzar ? 1500 : 400)

    const todas = filasEjemplo()
    const inicio = (parametros.pagina - 1) * parametros.por_pagina

    const resultado: ResultadoConsulta = {
      consulta_id: 'mock-consulta',
      filas: todas.slice(inicio, inicio + parametros.por_pagina),
      total_filas: todas.length,
      totales: { TOTAL: todas.reduce((suma, fila) => suma + Number(fila.TOTAL), 0) },
      pagina: parametros.pagina,
      por_pagina: parametros.por_pagina,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 600_000).toISOString(),
      cache_hit: !parametros.forzar,
      duracion_ms: parametros.forzar ? 1480 : 12,
    }

    return HttpResponse.json(resultado)
  }),
]
