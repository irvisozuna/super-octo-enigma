import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { acotaSectores, filtrosDesdeQuery, filtrosIniciales, parametrosDesdeFiltros, queryDesdeFiltros, useFiltrosMonitor } from '../composables/useFiltrosMonitor'
import type { RespuestaCatalogos } from '../types/monitor'
import { hoyLocal } from '../utils/tiempo'

const catalogos: RespuestaCatalogos = {
  periodos: [
    { id: 186, nombre: 'OCTUBRE 2026', inicio: '2026-10-01', fin: '2026-10-31', abierto: true },
    { id: 185, nombre: 'SEPTIEMBRE 2026', inicio: '2026-09-01', fin: '2026-09-30', abierto: false },
  ],
  sistemas: [
    { id: 1, nombre: 'VISTA HERMOSA', gerencia_id: 1, sectores: 18 },
    { id: 8, nombre: 'ACUEDUCTO', gerencia_id: 2, sectores: 12 },
  ],
  sectores: [
    { id: 14, nombre: 'VISTA HERMOSA - 14', sistema_id: 1, gerencia_id: 1 },
    { id: 45, nombre: 'ANTIGUA/ACUEDUCTO - 5', sistema_id: 8, gerencia_id: 2 },
  ],
  lecturistas: [
    { id: 453, nombre: 'ALEJANDRO', login: 'a', gerencia_id: 1 },
    { id: 406, nombre: 'FRANCISCO', login: 'f', gerencia_id: 2 },
    { id: 999, nombre: 'SIN GERENCIA', login: 's', gerencia_id: null },
  ],
}

describe('filtros ↔ query', () => {
  it('lee la query ignorando lo que no entiende', () => {
    const f = filtrosDesdeQuery({ vista: 'periodo', periodo: '185', dia: '2026-10-06', gerencia: 'x', sistema: '0', sector: '45', lecturista: '406', estado: 'volando' })

    expect(f).toEqual({ ...filtrosIniciales(), vista: 'periodo', periodo: 185, dia: '2026-10-06', sector: 45, lecturista: 406 })
  })

  it('escribe solo lo que difiere del valor por defecto', () => {
    expect(queryDesdeFiltros(filtrosIniciales())).toEqual({})
    expect(queryDesdeFiltros({ ...filtrosIniciales(), vista: 'periodo', gerencia: 1, estado: 'rezagado' })).toEqual({ vista: 'periodo', gerencia: '1', estado: 'rezagado' })
  })
})

describe('parametrosDesdeFiltros', () => {
  it('manda el día solo en la vista hoy y cuando no es hoy', () => {
    expect(parametrosDesdeFiltros({ ...filtrosIniciales(), dia: hoyLocal() })).toEqual({})
    expect(parametrosDesdeFiltros({ ...filtrosIniciales(), dia: '2026-09-15' })).toEqual({ dia: '2026-09-15' })
    expect(parametrosDesdeFiltros({ ...filtrosIniciales(), vista: 'periodo', dia: '2026-09-15', periodo: 185 })).toEqual({ periodo: 185 })
  })

  it('traduce el resto de filtros tal cual', () => {
    expect(parametrosDesdeFiltros({ ...filtrosIniciales(), gerencia: 1, sistema: 8, sector: 45, lecturista: 406, estado: 'iniciado' }))
      .toEqual({ gerencia: 1, sistema: 8, sector: 45, lecturista: 406, estado: 'iniciado' })
  })

  it('sabe cuándo el mapa debe acotar sectores', () => {
    expect(acotaSectores(filtrosIniciales())).toBe(false)
    expect(acotaSectores({ ...filtrosIniciales(), gerencia: 1 })).toBe(false)
    expect(acotaSectores({ ...filtrosIniciales(), lecturista: 406 })).toBe(true)
  })
})

describe('useFiltrosMonitor', () => {
  it('ofrece opciones dependientes de la gerencia y del sistema', () => {
    const { filtros, sistemas, sectores, lecturistas, periodoAbierto } = useFiltrosMonitor(() => catalogos)

    expect(periodoAbierto.value?.id).toBe(186)
    expect(sistemas.value).toHaveLength(2)
    expect(lecturistas.value).toHaveLength(3)

    filtros.gerencia = 2
    expect(sistemas.value.map(s => s.id)).toEqual([8])
    expect(sectores.value.map(s => s.id)).toEqual([45])
    expect(lecturistas.value.map(l => l.id)).toEqual([406, 999]) // los sin gerencia siguen visibles
  })

  it('suelta los filtros que dejan de pertenecer a la gerencia o al sistema', async () => {
    const { filtros } = useFiltrosMonitor(() => catalogos, { ...filtrosIniciales(), gerencia: 1, sistema: 1, sector: 14, lecturista: 453 })

    filtros.gerencia = 2
    await nextTick()
    expect(filtros.sistema).toBeNull()
    expect(filtros.sector).toBeNull()
    expect(filtros.lecturista).toBeNull()

    filtros.sistema = 8
    filtros.sector = 45
    await nextTick()
    filtros.sistema = 1
    await nextTick()
    expect(filtros.sector).toBeNull()
  })

  it('cuenta los filtros activos y limpia sin perder la vista', () => {
    const { filtros, activos, cambiarVista, limpiar } = useFiltrosMonitor(() => catalogos, { ...filtrosIniciales(), gerencia: 1, estado: 'rezagado', dia: '2026-09-15', periodo: 185 })

    expect(activos.value).toBe(4)
    cambiarVista('periodo')
    expect(filtros.dia).toBeNull()
    expect(activos.value).toBe(3)
    limpiar()
    expect(filtros.vista).toBe('periodo')
    expect(activos.value).toBe(0)
  })
})
