import { describe, expect, it } from 'vitest'
import type { CandidataSeguimiento, OrdenSeguimiento, RevisitaSeguimiento } from '../types/cartera'
import { filtrarCandidatas, filtrarOrdenes, filtrarRevisitas, filtrosSeguimientoActivos, filtrosSeguimientoIniciales } from '../utils/seguimiento'
import { diaHoraCorta } from '@/utils/formato'

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

// XEL1-686: la bandeja «Por revisitar»

const r = (id: string, extra: Partial<RevisitaSeguimiento>): RevisitaSeguimiento => ({
  id,
  ref: `NC-${id}`,
  contrato: Number(id),
  cuenta: `400${id}`,
  notificador: 'Brando',
  estado: 'No entregada',
  estado_codigo: 'no_entregada',
  origen: 'atencion',
  emitida: '2026-10-01T00:00:00+00:00',
  intento_en: '2026-11-02T17:30:00+00:00',
  intentos: 1,
  agotada: false,
  adeudo_notificado: 1000,
  adeudo_actual: 1000,
  titular: null,
  ...extra,
})

describe('filtrarRevisitas', () => {
  const revisitas = [
    r('1', { intento_en: '2026-11-05T17:30:00+00:00', adeudo_actual: 500 }),
    r('2', { intento_en: '2026-11-01T17:30:00+00:00', adeudo_actual: 9000, agotada: true, intentos: 3 }),
    r('3', { intento_en: '2026-11-03T17:30:00+00:00', adeudo_actual: 3000, estado_codigo: 'usuario_no_localizado', titular: 'Ana Núñez' }),
  ]

  const idsR = (l: RevisitaSeguimiento[]) => l.map(x => x.id)
  const f = filtrosSeguimientoIniciales()

  it('el intento más viejo primero y las que agotaron intentos al final, en cualquier orden', () => {
    expect(idsR(filtrarRevisitas(revisitas, f))).toEqual(['3', '1', '2'])
    expect(idsR(filtrarRevisitas(revisitas, { ...f, orden: 'adeudo' }))).toEqual(['3', '1', '2'])
    expect(idsR(filtrarRevisitas(revisitas, { ...f, orden: 'recientes' }))).toEqual(['1', '3', '2'])
  })

  it('busca, filtra por resultado y adeudo, e ignora los días desde la entrega', () => {
    expect(idsR(filtrarRevisitas(revisitas, { ...f, texto: 'nunez' }))).toEqual(['3'])
    expect(idsR(filtrarRevisitas(revisitas, { ...f, resultado: 'no_entregada' }))).toEqual(['1', '2'])
    expect(idsR(filtrarRevisitas(revisitas, { ...f, adeudoMin: 1000 }))).toEqual(['3', '2'])
    expect(idsR(filtrarRevisitas(revisitas, { ...f, diasMin: 365 }))).toHaveLength(3)
  })
})

describe('diaHoraCorta', () => {
  it('lleva el día de la semana, en la hora de Los Cabos', () => {
    // 17:30 UTC es 10:30 en Los Cabos, lunes 2 de noviembre de 2026
    expect(diaHoraCorta('2026-11-02T17:30:00+00:00')).toBe('lun 2 nov 10:30')
  })
})
