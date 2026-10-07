import { beforeEach, describe, expect, it, vi } from 'vitest'

import { destinoSujeto, filtrosAlertasIniciales, parametrosAlertas, useAlertas } from '../composables/useAlertas'
import type { Alerta, RespuestaAlertas } from '../types/alertas'

const api = vi.hoisted(() => ({
  obtenerAlertas: vi.fn(),
  accionarAlerta: vi.fn(),
  obtenerEventosAlerta: vi.fn(),
}))

vi.mock('../services/monitoreoApi', () => api)
vi.mock('@vueuse/core', () => ({
  useDocumentVisibility: () => ({ value: 'visible' }),
  useIntervalFn: () => ({ pause: vi.fn(), resume: vi.fn() }),
}))

const alerta = (x: Partial<Alerta>): Alerta => ({
  id: 'a1',
  regla: 'R4',
  regla_titulo: 'Lecturista en silencio',
  severidad: 'alta',
  sujeto_tipo: 'lecturista',
  sujeto_id: '411',
  gerencia_id: 2,
  periodo_id: null,
  titulo: 'SERGIO sin lecturas',
  detalle: { minutos: 95 },
  estado: 'abierta',
  abierta: '2026-10-07 10:00:00',
  ultima_vez: '2026-10-07 10:05:00',
  cerrada: null,
  motivo_cierre: null,
  atendida_por: null,
  atendida_en: null,
  silenciada_hasta: null,
  silenciada_por: null,
  veces: 1,
  es_evento: false,
  ...x,
})

const respuesta: RespuestaAlertas = {
  filas: [alerta({}), alerta({ id: 'a2', regla: 'R1', sujeto_tipo: 'sector', sujeto_id: '221', periodo_id: 186, severidad: 'media' })],
  total: 2,
  pagina: 1,
  por_pagina: 50,
  reglas: [{ codigo: 'R1', titulo: 'x', severidad: 'media' }],
  resumen: { activas: 2, por_severidad: { alta: 1, media: 1, aviso: 0 }, por_estado: { abierta: 2, atendida: 0, silenciada: 0 }, por_regla: {}, ultimo_ciclo: '2026-10-07 10:05:00' },
  puede_operar: true,
}

describe('parámetros y destinos', () => {
  it('manda solo los filtros con valor', () => {
    const f = { ...filtrosAlertasIniciales(), severidad: 'alta' as const, q: '  sergio ' }

    expect(parametrosAlertas(f)).toEqual({ estado: 'activas', pagina: 1, por_pagina: 50, severidad: 'alta', q: 'sergio' })
  })

  it('lleva al monitor según el sujeto de la alerta', () => {
    expect(destinoSujeto(alerta({}))).toEqual({ name: 'monitoreoInicio', query: { lecturista: '411' } })
    expect(destinoSujeto(alerta({ sujeto_tipo: 'sector', sujeto_id: '221', periodo_id: 186 }))).toEqual({ name: 'monitoreoInicio', query: { sector: '221', periodo: '186', vista: 'periodo' } })
    expect(destinoSujeto(alerta({ regla: 'R8', sujeto_id: '7:2026-10-06' }))).toEqual({ name: 'monitoreoInicio', query: { lecturista: '7', dia: '2026-10-06' } })
    expect(destinoSujeto(alerta({ regla: 'R11', sujeto_id: '411:185:221', periodo_id: 185, detalle: { sector_id: 221 } }))).toEqual({ name: 'monitoreoInicio', query: { sector: '221', periodo: '185', vista: 'periodo' } })
    expect(destinoSujeto(alerta({ regla: 'R10', sujeto_tipo: 'lectura', sujeto_id: '9', detalle: { sector_id: null } }))).toBeNull()
    expect(destinoSujeto(alerta({ sujeto_tipo: 'gerencia', sujeto_id: '0' }))).toBeNull()
  })
})

describe('useAlertas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.obtenerAlertas.mockResolvedValue(respuesta)
    api.obtenerEventosAlerta.mockResolvedValue({ eventos: [{ accion: 'abrir', usuario: null, nota: null, hasta: null, fecha: '2026-10-07 10:00:00' }] })
  })

  it('carga, aplica filtros reiniciando la página y pagina sin reiniciar', async () => {
    const a = useAlertas()

    await a.cargar()
    expect(a.total.value).toBe(2)
    expect(a.puedeOperar.value).toBe(true)

    a.filtros.pagina = 3
    await a.aplicar({ severidad: 'alta' })
    expect(a.filtros.pagina).toBe(1)
    await a.aplicar({ pagina: 2 })
    expect(a.filtros.pagina).toBe(2)
    expect(api.obtenerAlertas).toHaveBeenLastCalledWith({ estado: 'activas', pagina: 2, por_pagina: 50, severidad: 'alta' }, expect.anything())
  })

  it('al accionar reemplaza la fila con la respuesta y recarga los conteos', async () => {
    api.accionarAlerta.mockResolvedValue(alerta({ estado: 'silenciada', silenciada_hasta: '2026-10-07 14:00:00' }))

    const a = useAlertas()

    await a.cargar()

    const r = await a.accionar('a1', 'silenciar', { horas: 4 })

    expect(r?.estado).toBe('silenciada')
    expect(api.accionarAlerta).toHaveBeenCalledWith('a1', 'silenciar', { nota: undefined, horas: 4 })
    expect(a.filas.value[0].estado).toBe('silenciada')
    await Promise.resolve()
    expect(api.obtenerAlertas).toHaveBeenCalledTimes(2)
  })

  it('guarda el error de una acción sin perder la lista y lee el historial', async () => {
    api.accionarAlerta.mockRejectedValue(Object.assign(new Error('Sin permiso'), { status: 403, body: { mensaje: 'Solo quien opera' } }))

    const a = useAlertas()

    await a.cargar()
    expect(await a.accionar('a1', 'atender')).toBeNull()
    expect(a.errorAccion.value?.mensaje).toContain('Solo quien opera')
    expect(a.filas.value).toHaveLength(2)

    await a.verEventos('a1')
    expect(a.eventos.value).toHaveLength(1)
  })
})
