import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useConfiguracion } from '../composables/useConfiguracion'
import { documentoEnCurso, useLote } from '../composables/useLotes'
import { useNotificaciones } from '../composables/useNotificaciones'
import { useNotificar } from '../composables/useNotificar'
import { useSeguimiento } from '../composables/useSeguimiento'
import { useEvidencia } from '../composables/useEvidencia'
import type { CuentaCandidata, ItemCatalogo, Notificacion, RespuestaCatalogos } from '../types/cartera'
import { cuerpoBusqueda, esCapturable, filtrosActivos, filtrosBusquedaIniciales, filtrosNotificacionesIniciales, hijosDe, parametrosNotificaciones, recortar } from '../utils/cartera'

const api = vi.hoisted(() => ({
  obtenerCatalogos: vi.fn(),
  contarCuentas: vi.fn(),
  vistaPrevia: vi.fn(),
  generarLote: vi.fn(),
  obtenerLotes: vi.fn(),
  obtenerLote: vi.fn(),
  descargarDocumentoLote: vi.fn(),
  rearmarDocumentoLote: vi.fn(),
  obtenerNotificaciones: vi.fn(),
  obtenerNotificacion: vi.fn(),
  descargarDocumentoNotificacion: vi.fn(),
  capturarResultado: vi.fn(),
  capturarEnBloque: vi.fn(),
  cancelarNotificacion: vi.fn(),
  obtenerConfiguracion: vi.fn(),
  obtenerSeguimiento: vi.fn(),
  obtenerEvidencias: vi.fn(),
  subirEvidencias: vi.fn(),
  descargarEvidencia: vi.fn(),
  borrarEvidencia: vi.fn(),
  accionSeguimiento: vi.fn(),
  cerrarOrdenSeguimiento: vi.fn(),
  guardarConfiguracion: vi.fn(),
}))

vi.mock('../services/carteraApi', () => api)

const item = (id: number, padre: number | null = null): ItemCatalogo => ({ id, codigo: null, nombre: `I${id}`, padre, activo: true })

const catalogos: RespuestaCatalogos = {
  gerencias: [item(1), item(2)],
  sistemas: [item(10, 1), item(20, 2)],
  sectores: [item(100, 10), item(200, 20)],
  colonias: [],
  tipos_contrato: [],
  giros: [],
  estatus: [],
  notificadores: [{ id: 'a1', nombre: 'Notificador' }],
  resultados: [{ codigo: 'recibida', nombre: 'Recibida' }],
  configuracion: { vigencia_dias: 90, capacidad_lote: 2, seguimiento_dias: 15 },
  corte: '2026-11-06',
  puede_operar: true,
  generacion_activa: true,
}

const cuenta = (contrato: number, adeudo = 100): CuentaCandidata => ({
  contrato,
  cuenta: String(40000000 + contrato),
  nombre: 'X',
  domicilio: [],
  gerencia: null,
  sistema: null,
  sector: null,
  manzana: null,
  lote: null,
  tipo_contrato: null,
  estatus: null,
  adeudo,
  meses: 3,
  ultimo_pago: null,
  ultimo_pago_importe: null,
  convenio: null,
  convenio_estado: null,
  pagado_despues: null,
  revision_padron: false,
  prioridad: null,
})

const notificacion = (x: Partial<Notificacion>): Notificacion => ({
  id: 'n1',
  ref: 'NC2611-00001',
  folio: null,
  secuencia: null,
  cuenta: '40000001',
  adeudo: 100,
  meses: 3,
  domicilio: [],
  estado: 'En proceso',
  estado_codigo: 'en_proceso',
  emitida: '2026-11-06T18:00:00+00:00',
  vence: '2027-02-04',
  entregada: null,
  observacion: null,
  cerrada: null,
  origen: 'atencion',
  se_captura_aqui: true,
  ticket: { estado: 'pendiente' },
  ...x,
})

beforeEach(() => {
  Object.values(api).forEach(f => f.mockReset())
})

describe('reglas puras', () => {
  it('el cuerpo de la búsqueda solo lleva lo que tiene valor y omite «incluir a quien nunca pagó»', () => {
    expect(cuerpoBusqueda(filtrosBusquedaIniciales())).toEqual({ meses_desde: 3 })
    expect(cuerpoBusqueda({ ...filtrosBusquedaIniciales(), gerencias: [1], importe_desde: 0, nunca_ha_pagado: 'solo', convenio: 'incluir' }))
      .toEqual({ gerencias: [1], meses_desde: 3, importe_desde: 0, nunca_ha_pagado: 'solo', convenio: 'incluir' })
  })

  it('cuenta como activos solo los filtros distintos de los iniciales', () => {
    expect(filtrosActivos(filtrosBusquedaIniciales())).toBe(0)
    expect(filtrosActivos({ ...filtrosBusquedaIniciales(), meses_desde: null, sectores: [100] })).toBe(2)
  })

  it('la cascada gerencia → sistema → sector filtra por padre y recorta lo que ya no aplica', () => {
    expect(hijosDe(catalogos.sistemas, []).map(i => i.id)).toEqual([10, 20])
    expect(hijosDe(catalogos.sistemas, [2]).map(i => i.id)).toEqual([20])
    expect(recortar([10, 20], hijosDe(catalogos.sistemas, [2]))).toEqual([20])
  })

  it('parámetros de la lista y qué se puede capturar', () => {
    expect(parametrosNotificaciones({ ...filtrosNotificacionesIniciales(), cuenta: ' 401 ', estado: 'firmada' }, 2, 50))
      .toEqual({ pagina: 2, por_pagina: 50, cuenta: '401', estado: 'firmada' })
    expect(esCapturable(notificacion({}))).toBe(true)
    expect(esCapturable(notificacion({ estado_codigo: 'recibida' }))).toBe(false)
    expect(esCapturable(notificacion({ se_captura_aqui: false }))).toBe(false)
  })
})

describe('useNotificar', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('cuenta al iniciar y, al cambiar filtros, recorta la cascada y vuelve a contar después de la pausa', async () => {
    api.obtenerCatalogos.mockResolvedValue(catalogos)
    api.contarCuentas.mockResolvedValue({ corte: '2026-11-06', en_padron: 10, con_adeudo: 5, con_vigente: 1, a_notificar: 4 })

    const n = useNotificar(300)

    await n.iniciar()
    expect(api.contarCuentas).toHaveBeenCalledTimes(1)
    expect(n.capacidad.value).toBe(2)

    n.aplicar({ gerencias: [1], sistemas: [10, 20] })
    n.aplicar({ sectores: [100, 200] })
    expect(n.filtros.sistemas).toEqual([10])
    expect(n.filtros.sectores).toEqual([100])
    expect(api.contarCuentas).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(299)
    expect(api.contarCuentas).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(api.contarCuentas).toHaveBeenCalledTimes(2)
    expect(api.contarCuentas.mock.calls[1][0]).toEqual({ gerencias: [1], sistemas: [10], sectores: [100], meses_desde: 3 })
  })

  it('la lista marca las primeras según la capacidad; generar manda las marcadas en orden y deja de valer la lista', async () => {
    api.vistaPrevia.mockResolvedValue({ resumen: { a_notificar: 3 }, cuentas: [cuenta(3), cuenta(1, 50), cuenta(2)], capacidad_sugerida: 2 })
    api.generarLote.mockResolvedValue({ lote: { id: 'l1', ref: 'LT2611-001' }, generadas: 2, descartadas: [] })

    const n = useNotificar()

    n.catalogos.value = catalogos

    await n.verCuentas()
    expect([...n.seleccion.value]).toEqual([3, 1])
    expect(n.totalSeleccionado.value).toBe(150)
    expect(n.puedeGenerar.value).toBe(false) // falta el notificador

    n.notificador.value = 'a1'
    n.alternar(2)
    expect(n.excedeCapacidad.value).toBe(true)
    n.alternar(3)
    await n.generar()

    expect(api.vistaPrevia).toHaveBeenCalledWith({ meses_desde: 3 }, 'recorrido')
    expect(api.generarLote).toHaveBeenCalledWith({ meses_desde: 3 }, [1, 2], 'a1')
    expect(n.listaVigente.value).toBe(false)
    expect(n.puedeGenerar.value).toBe(false)
  })

  it('pide la lista en el orden elegido (prioridad, XEL1-663)', async () => {
    api.vistaPrevia.mockResolvedValue({ resumen: {}, cuentas: [cuenta(9)], capacidad_sugerida: 45 })

    const n = useNotificar()

    n.orden.value = 'prioridad'
    await n.verCuentas()
    expect(api.vistaPrevia).toHaveBeenCalledWith({ meses_desde: 3 }, 'prioridad')
  })

  it('cambiar un filtro invalida la lista: no se genera con cuentas de otra búsqueda', async () => {
    api.vistaPrevia.mockResolvedValue({ resumen: {}, cuentas: [cuenta(1)], capacidad_sugerida: 45 })

    const n = useNotificar()

    n.catalogos.value = catalogos

    await n.verCuentas()
    n.notificador.value = 'a1'
    expect(n.puedeGenerar.value).toBe(true)
    n.aplicar({ meses_desde: 6 })
    expect(n.puedeGenerar.value).toBe(false)
    expect(await n.generar()).toBeNull()
    expect(api.generarLote).not.toHaveBeenCalled()
  })

  // XEL1-774: con la generación apagada en el servidor (o si no lo dice) no se genera aunque todo lo demás esté listo
  it('con la generación apagada no deja generar', async () => {
    api.vistaPrevia.mockResolvedValue({ resumen: {}, cuentas: [cuenta(1)], capacidad_sugerida: 45 })

    const n = useNotificar()

    n.catalogos.value = { ...catalogos, generacion_activa: false }

    await n.verCuentas()
    n.notificador.value = 'a1'
    expect(n.generacionActiva.value).toBe(false)
    expect(n.puedeGenerar.value).toBe(false)
    expect(await n.generar()).toBeNull()
    expect(api.generarLote).not.toHaveBeenCalled()

    n.catalogos.value = { ...catalogos, generacion_activa: undefined }
    expect(n.puedeGenerar.value).toBe(false)
    n.catalogos.value = catalogos
    expect(n.puedeGenerar.value).toBe(true)
  })
})

describe('useLote', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('mientras el PDF se arma vuelve a preguntar y al estar listo deja de hacerlo', async () => {
    api.obtenerLote
      .mockResolvedValueOnce({ id: 'l1', documento: 'pendiente', notificaciones: [] })
      .mockResolvedValueOnce({ id: 'l1', documento: 'generando', notificaciones: [] })
      .mockResolvedValue({ id: 'l1', documento: 'listo', notificaciones: [] })

    const l = useLote(1000)

    await l.cargar('l1')
    expect(l.enCurso.value).toBe(true)
    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(1000)
    expect(l.lote.value?.documento).toBe('listo')
    await vi.advanceTimersByTimeAsync(5000)
    expect(api.obtenerLote).toHaveBeenCalledTimes(3)
    expect(documentoEnCurso({ documento: 'error' })).toBe(false)
  })
})

describe('useNotificaciones', () => {
  it('solo deja marcar las capturables y al recargar conserva solo las que siguen visibles', async () => {
    api.obtenerNotificaciones.mockResolvedValueOnce({
      notificaciones: [notificacion({ id: 'a' }), notificacion({ id: 'b', estado_codigo: 'recibida' }), notificacion({ id: 'c', se_captura_aqui: false }), notificacion({ id: 'd' })],
      paginacion: { pagina: 1, por_pagina: 50, total: 4 },
      puede_operar: true,
    })

    const n = useNotificaciones()

    await n.cargar()
    n.marcarTodas(true)
    expect([...n.seleccion.value]).toEqual(['a', 'd'])

    api.obtenerNotificaciones.mockResolvedValueOnce({ notificaciones: [notificacion({ id: 'd' })], paginacion: { pagina: 1, por_pagina: 50, total: 1 }, puede_operar: true })
    await n.aplicar({ cuenta: '40000001' })
    expect([...n.seleccion.value]).toEqual(['d'])
    expect(api.obtenerNotificaciones.mock.calls[1][0]).toEqual({ pagina: 1, por_pagina: 50, cuenta: '40000001' })

    // Si otra persona ya la capturó, al recargar deja de estar marcada
    api.obtenerNotificaciones.mockResolvedValueOnce({ notificaciones: [notificacion({ id: 'd', estado_codigo: 'firmada' })], paginacion: { pagina: 1, por_pagina: 50, total: 1 }, puede_operar: true })
    await n.cargar()
    expect(n.seleccion.value.size).toBe(0)
  })
})

describe('useConfiguracion', () => {
  it('manda solo lo que cambió y no guarda fuera de límites', async () => {
    api.obtenerConfiguracion.mockResolvedValue({ valores: { vigencia_dias: 90, capacidad_lote: 45, seguimiento_dias: 15 }, limites: { vigencia_dias: { min: 1, max: 365 }, capacidad_lote: { min: 1, max: 500 }, seguimiento_dias: { min: 1, max: 180 } }, puede_editar: true })
    api.guardarConfiguracion.mockResolvedValue({ valores: { vigencia_dias: 60, capacidad_lote: 45, seguimiento_dias: 15 }, limites: { vigencia_dias: { min: 1, max: 365 }, capacidad_lote: { min: 1, max: 500 }, seguimiento_dias: { min: 1, max: 180 } }, puede_editar: true })

    const c = useConfiguracion()

    await c.cargar()

    c.edicion.vigencia_dias = 400
    expect(c.invalido.value).toBe('vigencia_dias')
    expect(await c.guardar()).toBe(false)
    c.edicion.vigencia_dias = 60
    expect(c.cambios.value).toEqual({ vigencia_dias: 60 })
    expect(await c.guardar()).toBe(true)
    expect(api.guardarConfiguracion).toHaveBeenCalledWith({ vigencia_dias: 60 })
    expect(c.cambios.value).toEqual({})
  })

  it('con un servidor que ya trae revisitas y QR los edita y manda; sin ellos no los toca (XEL1-684, XEL1-686)', async () => {
    const limites = { vigencia_dias: { min: 1, max: 365 }, capacidad_lote: { min: 1, max: 500 }, seguimiento_dias: { min: 1, max: 180 }, revisita_intentos: { min: 1, max: 10 }, ticket_qr: { min: 0, max: 1 } }
    const valores = { vigencia_dias: 90, capacidad_lote: 45, seguimiento_dias: 15, revisita_intentos: 3, ticket_qr: 0 }

    api.obtenerConfiguracion.mockResolvedValue({ valores, limites, puede_editar: true })
    api.guardarConfiguracion.mockResolvedValue({ valores: { ...valores, ticket_qr: 1 }, limites, puede_editar: true })

    const c = useConfiguracion()

    await c.cargar()
    expect(c.claves.value).toContain('ticket_qr')
    c.edicion.revisita_intentos = 11
    expect(c.invalido.value).toBe('revisita_intentos')
    c.edicion.revisita_intentos = 3
    c.edicion.ticket_qr = 1
    expect(await c.guardar()).toBe(true)
    expect(api.guardarConfiguracion).toHaveBeenLastCalledWith({ ticket_qr: 1 })
  })
})

describe('useSeguimiento', () => {
  const candidata = (id: string, adeudo: number) => ({ id, ref: id, contrato: 1, cuenta: '1', notificador: null, estado: 'Recibida', estado_codigo: 'recibida', origen: 'atencion', emitida: '', entregada: '', dias: 20, adeudo_notificado: adeudo, adeudo_actual: adeudo })

  it('aplica la acción solo con motivo, manda las marcadas y recarga la bandeja', async () => {
    api.obtenerSeguimiento
      .mockResolvedValueOnce({ dias: 15, candidatas: [candidata('a', 100), candidata('b', 50)], ordenes: [], puede_operar: true })
      .mockResolvedValueOnce({ dias: 15, candidatas: [candidata('b', 50)], ordenes: [], puede_operar: true })
    api.accionSeguimiento.mockResolvedValue({ aplicadas: 1, errores: [] })

    const s = useSeguimiento()

    await s.cargar()
    s.marcarTodas(true)
    expect(s.totalMarcado.value).toBe(150)
    s.alternar('b')

    expect(await s.aplicar('orden', '   ')).toBeNull()
    expect(api.accionSeguimiento).not.toHaveBeenCalled()
    await s.aplicar('orden', ' Llamar ')
    expect(api.accionSeguimiento).toHaveBeenCalledWith(['a'], 'orden', 'Llamar', undefined)
    expect(s.candidatas.value.map(c => c.id)).toEqual(['b'])
    expect(s.seleccion.value.size).toBe(0)
  })

  it('cerrar una orden pide nota', async () => {
    api.obtenerSeguimiento.mockResolvedValue({ dias: 15, candidatas: [], ordenes: [], puede_operar: true })
    api.cerrarOrdenSeguimiento.mockResolvedValue({ id: 'o1', estado: 'atendida', cerrada_en: '' })

    const s = useSeguimiento()

    expect(await s.cerrar('o1', 'atendida', ' ')).toBe(false)
    expect(await s.cerrar('o1', 'atendida', 'Pagará')).toBe(true)
    expect(api.cerrarOrdenSeguimiento).toHaveBeenCalledWith('o1', 'atendida', 'Pagará')
  })
})

describe('useEvidencia', () => {
  it('sube los archivos de la notificación cargada, recarga y borrar la quita de la lista', async () => {
    if (!URL.createObjectURL)
      Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} })
    const lista = { evidencias: [{ id: 'e1', tipo: 'acta', mime: 'application/pdf', tamano: 1, nombre: null, lat: null, lng: null, tomada_en: null, subida_en: null }], puede_subir: true, puede_borrar: true }

    api.obtenerEvidencias.mockResolvedValue(lista)
    api.subirEvidencias.mockResolvedValue({ guardadas: [lista.evidencias[0]] })
    api.borrarEvidencia.mockResolvedValue({ ok: true })

    const ev = useEvidencia()

    expect(await ev.subir('acta', [new File(['x'], 'a.pdf')])).toBe(0) // sin notificación cargada no sube
    await ev.cargar('n1')

    const archivo = new File(['x'], 'acta.pdf', { type: 'application/pdf' })

    expect(await ev.subir('acta', [archivo])).toBe(1)
    expect(api.subirEvidencias).toHaveBeenCalledWith('n1', 'acta', [archivo])
    expect(api.obtenerEvidencias).toHaveBeenCalledTimes(2)
    expect(await ev.borrar('e1')).toBe(true)
    expect(ev.datos.value?.evidencias).toEqual([])
  })
})
