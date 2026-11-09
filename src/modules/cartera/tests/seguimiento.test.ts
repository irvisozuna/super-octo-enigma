import { describe, expect, it } from 'vitest'
import type { CandidataSeguimiento, OrdenSeguimiento } from '../types/cartera'
import { filtrarCandidatas, filtrarOrdenes, filtrosSeguimientoActivos, filtrosSeguimientoIniciales } from '../utils/seguimiento'

// XEL1-682: buscador, filtros y orden de la bandeja de Seguimiento

const c = (id: string, extra: Partial<CandidataSeguimiento>): CandidataSeguimiento => ({
  id,
  ref: `NC-${id}`,
  contrato: Number(id),
  cuenta: `400${id}`,
  notificador: 'Brando',
  estado: 'Recibida',
  estado_codigo: 'recibida',
  origen: 'atencion',
  emitida: '2026-09-01T00:00:00+00:00',
  entregada: '2026-10-01T00:00:00+00:00',
  dias: 40,
  adeudo_notificado: 1000,
  adeudo_actual: 1000,
  titular: null,
  ...extra,
})

const lista = [
  c('1', { titular: 'José Pérez Núñez', dias: 404, adeudo_actual: 61357.85, estado_codigo: 'firmada', estado: 'Firmada' }),
  c('2', { titular: 'María López', dias: 30, adeudo_actual: 21118.09, notificador: 'Gustavo', entregada: '2026-10-10T00:00:00+00:00' }),
  c('3', { titular: 'Juan Pérez', dias: 404, adeudo_actual: 75310.74, origen: 'legado' }),
]

const ids = (l: CandidataSeguimiento[]) => l.map(x => x.id)

describe('filtrarCandidatas', () => {
  it('busca sin acentos ni mayúsculas en cuenta, referencia y titular, con todas las palabras', () => {
    const f = filtrosSeguimientoIniciales()

    expect(ids(filtrarCandidatas(lista, { ...f, texto: 'perez' }))).toEqual(['3', '1'])
    expect(ids(filtrarCandidatas(lista, { ...f, texto: 'JOSE nunez' }))).toEqual(['1'])
    expect(ids(filtrarCandidatas(lista, { ...f, texto: '4002' }))).toEqual(['2'])
    expect(ids(filtrarCandidatas(lista, { ...f, texto: 'NC-3' }))).toEqual(['3'])
    expect(filtrarCandidatas(lista, { ...f, texto: 'nadie' })).toEqual([])
  })

  it('filtra por notificador, resultado, origen, días y adeudo', () => {
    const f = filtrosSeguimientoIniciales()

    expect(ids(filtrarCandidatas(lista, { ...f, notificador: 'Gustavo' }))).toEqual(['2'])
    expect(ids(filtrarCandidatas(lista, { ...f, resultado: 'firmada' }))).toEqual(['1'])
    expect(ids(filtrarCandidatas(lista, { ...f, origen: 'legado' }))).toEqual(['3'])
    expect(ids(filtrarCandidatas(lista, { ...f, diasMin: 60 }))).toEqual(['3', '1'])
    expect(ids(filtrarCandidatas(lista, { ...f, adeudoMin: 50000 }))).toEqual(['3', '1'])
  })

  it('ordena por días (empate por adeudo), adeudo, entrega reciente o notificador', () => {
    const f = filtrosSeguimientoIniciales()

    expect(ids(filtrarCandidatas(lista, f))).toEqual(['3', '1', '2'])
    expect(ids(filtrarCandidatas(lista, { ...f, orden: 'adeudo' }))).toEqual(['3', '1', '2'])
    expect(ids(filtrarCandidatas(lista, { ...f, orden: 'recientes' }))).toEqual(['2', '3', '1'])
    expect(ids(filtrarCandidatas(lista, { ...f, orden: 'notificador' }))).toEqual(['3', '1', '2'])

    // No cambia la lista original
    expect(ids(lista)).toEqual(['1', '2', '3'])
  })

  it('cuenta los filtros puestos sin contar el orden', () => {
    expect(filtrosSeguimientoActivos(filtrosSeguimientoIniciales())).toBe(0)
    expect(filtrosSeguimientoActivos({ ...filtrosSeguimientoIniciales(), texto: '  ', orden: 'adeudo' })).toBe(0)
    expect(filtrosSeguimientoActivos({ ...filtrosSeguimientoIniciales(), texto: 'x', diasMin: 0 })).toBe(2)
  })
})

describe('filtrarOrdenes', () => {
  it('busca en cuenta, referencia y motivo', () => {
    const o = (id: string, motivo: string): OrdenSeguimiento => ({ id, cuenta: `400${id}`, contrato: Number(id), motivo, abierta_en: '', notificacion: { id, ref: `NC-${id}` } })
    const ordenes = [o('1', 'Llamar al titular'), o('2', 'Visita de corte')]

    expect(filtrarOrdenes(ordenes, 'llamar').map(x => x.id)).toEqual(['1'])
    expect(filtrarOrdenes(ordenes, 'nc-2').map(x => x.id)).toEqual(['2'])
    expect(filtrarOrdenes(ordenes, '')).toHaveLength(2)
  })
})
