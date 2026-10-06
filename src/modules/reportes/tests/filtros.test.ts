import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useFiltros } from '../composables/useFiltros'
import type { FiltroDef } from '../types/reporte'
import { aPayload, estaVacio, etiquetaValor, valorInicial } from '../utils/filtros'

vi.mock('../services/reportesApi', () => ({
  opcionesFiltro: vi.fn(),
}))

const { opcionesFiltro } = await import('../services/reportesApi')

function def(parcial: Partial<FiltroDef> & Pick<FiltroDef, 'key' | 'tipo'>): FiltroDef {
  return {
    etiqueta: parcial.key,
    requerido: false,
    fijo: false,
    oculto: false,
    depende_de: [],
    opciones: null,
    opciones_remotas: false,
    valor_default: null,
    config: {},
    ...parcial,
  }
}

const periodo = def({ key: 'periodo', tipo: 'period', etiqueta: 'Periodo', requerido: true, opciones_remotas: true, valor_default: 185 })
const gerencia = def({ key: 'gerencia', tipo: 'multiselect', etiqueta: 'Gerencia', opciones_remotas: true })
const sistema = def({ key: 'sistema', tipo: 'select', etiqueta: 'Sistema', opciones_remotas: true, depende_de: ['gerencia'] })
const activo = def({ key: 'activo', tipo: 'boolean', etiqueta: 'Activo' })
const fechas = def({ key: 'fechas', tipo: 'date_range', etiqueta: 'Fechas' })

function crear(defs: FiltroDef[]) {
  const scope = effectScope()
  const filtros = scope.run(() => useFiltros(defs))!

  return { filtros, scope }
}

describe('utils/filtros', () => {
  it('estaVacio reconoce vacíos de cada tipo', () => {
    expect(estaVacio(null)).toBe(true)
    expect(estaVacio('')).toBe(true)
    expect(estaVacio([])).toBe(true)
    expect(estaVacio({ desde: null, hasta: '' })).toBe(true)
    expect(estaVacio(0)).toBe(false)
    expect(estaVacio([1])).toBe(false)
    expect(estaVacio({ desde: '2026-01-01', hasta: null })).toBe(false)
  })

  it('valorInicial usa el default o el vacío del tipo', () => {
    expect(valorInicial(periodo)).toBe(185)
    expect(valorInicial(gerencia)).toEqual([])
    expect(valorInicial(fechas)).toEqual({ desde: null, hasta: null })
    expect(valorInicial(activo)).toBeNull()
  })

  it('aPayload omite los vacíos y etiquetaValor usa las opciones', () => {
    expect(aPayload([periodo, gerencia, fechas], { periodo: 185, gerencia: [], fechas: { desde: null, hasta: null } })).toEqual({ periodo: 185 })

    const opciones = [{ value: 1, label: 'LA PAZ' }, { value: 2, label: 'SJC' }, { value: 3, label: 'CSL' }, { value: 4, label: 'LA RIBERA' }]

    expect(etiquetaValor(gerencia, [1, 2], opciones)).toBe('LA PAZ, SJC')
    expect(etiquetaValor(gerencia, [1, 2, 3, 4], opciones)).toBe('LA PAZ, SJC, CSL +1')
    expect(etiquetaValor(periodo, 185, [{ value: 185, label: 'SEPTIEMBRE 2026' }])).toBe('SEPTIEMBRE 2026')
    expect(etiquetaValor(fechas, { desde: '2026-01-01', hasta: null })).toBe('2026-01-01 – …')
    expect(etiquetaValor(activo, true)).toBe('Sí')
  })
})

describe('useFiltros', () => {
  beforeEach(() => {
    vi.mocked(opcionesFiltro).mockReset()
    vi.mocked(opcionesFiltro).mockResolvedValue([{ value: 1, label: 'uno' }])
  })

  it('aplica defaults y sabe si está completo', () => {
    const { filtros, scope } = crear([periodo, gerencia])

    filtros.aplicarDefaults()
    expect(filtros.valores.value).toEqual({ periodo: 185, gerencia: [] })
    expect(filtros.completo.value).toBe(true)

    filtros.establecer('periodo', null)
    expect(filtros.completo.value).toBe(false)
    expect(filtros.validar()).toBe(false)
    expect(filtros.errores.value).toEqual({ periodo: 'requerido' })

    filtros.establecer('periodo', 186)
    expect(filtros.errores.value).toEqual({})
    expect(filtros.aPayload()).toEqual({ periodo: 186 })
    scope.stop()
  })

  it('cambiar el padre limpia al hijo y recarga sus opciones; sin padre no consulta', async () => {
    const { filtros, scope } = crear([gerencia, sistema])

    filtros.aplicarDefaults()
    filtros.cargarTodasLasOpciones()
    await flushPromises()

    // gerencia se consulta; sistema no (su padre está vacío)
    expect(vi.mocked(opcionesFiltro)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(opcionesFiltro).mock.calls[0][0]).toBe('gerencia')
    expect(filtros.opciones.value.sistema).toEqual([])

    filtros.establecer('sistema', 9)
    filtros.establecer('gerencia', [2])
    await flushPromises()
    expect(filtros.valores.value.sistema).toBeNull()
    expect(vi.mocked(opcionesFiltro)).toHaveBeenLastCalledWith('sistema', { padres: { gerencia: [2] }, q: undefined, limite: undefined }, expect.anything())
    expect(filtros.opciones.value.sistema).toEqual([{ value: 1, label: 'uno' }])
    scope.stop()
  })

  it('las opciones fijas no van al servidor y limpiar vuelve a los defaults', async () => {
    const fijo = def({ key: 'estatus', tipo: 'select', opciones: [{ value: 'A', label: 'Activo' }] })
    const { filtros, scope } = crear([periodo, fijo])

    filtros.aplicarDefaults()
    filtros.establecer('periodo', 100)
    filtros.establecer('estatus', 'A')
    filtros.cargarTodasLasOpciones()
    await flushPromises()
    expect(filtros.opciones.value.estatus).toEqual([{ value: 'A', label: 'Activo' }])
    expect(vi.mocked(opcionesFiltro)).toHaveBeenCalledTimes(1)

    filtros.limpiar()
    expect(filtros.valores.value).toEqual({ periodo: 185, estatus: null })
    scope.stop()
  })
})
