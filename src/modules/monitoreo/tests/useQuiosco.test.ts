import { describe, expect, it } from 'vitest'
import { gerenciaActual, gerenciaFijaDesdeQuery, siguienteIndice, useQuiosco } from '../composables/useQuiosco'

const gerencias = [{ id: 1, label: 'CSL' }, { id: 2, label: 'SJC' }, { id: 3, label: 'Santiago' }]

describe('rotación del quiosco', () => {
  it('recorre solo las gerencias del alcance y vuelve al inicio', () => {
    let estado = { gerencias, indice: 0, fija: null as number | null }

    expect(gerenciaActual(estado)?.label).toBe('CSL')
    estado = { ...estado, indice: siguienteIndice(estado) }
    expect(gerenciaActual(estado)?.label).toBe('SJC')
    estado = { ...estado, indice: siguienteIndice(estado) }
    estado = { ...estado, indice: siguienteIndice(estado) }
    expect(gerenciaActual(estado)?.label).toBe('CSL')
  })

  it('con una gerencia fija o una sola gerencia no rota', () => {
    expect(siguienteIndice({ gerencias, indice: 0, fija: 2 })).toBe(0)
    expect(gerenciaActual({ gerencias, indice: 0, fija: 2 })?.label).toBe('SJC')
    expect(siguienteIndice({ gerencias: [gerencias[0]], indice: 0, fija: null })).toBe(0)
    expect(gerenciaActual({ gerencias: [], indice: 0, fija: null })).toBeNull()
  })

  it('acepta ?gerencia= solo si está en el alcance', () => {
    expect(gerenciaFijaDesdeQuery('2', gerencias)).toBe(2)
    expect(gerenciaFijaDesdeQuery('9', gerencias)).toBeNull()
    expect(gerenciaFijaDesdeQuery('x', gerencias)).toBeNull()
    expect(gerenciaFijaDesdeQuery(undefined, gerencias)).toBeNull()
  })

  it('cambia de gerencia cuando se agota el tiempo y respeta el mínimo de 10 s', () => {
    const q = useQuiosco(30)

    q.configurar(gerencias, null, 3)
    expect(q.segundos.value).toBe(10)
    for (let i = 0; i < 9; i++)
      expect(q.tic()).toBe(false)
    expect(q.tic()).toBe(true)
    expect(q.actual.value?.label).toBe('SJC')
    expect(q.restante.value).toBe(10)

    q.configurar(gerencias, 3, 30)
    expect(q.rota.value).toBe(false)
    expect(q.tic()).toBe(false)
    expect(q.actual.value?.label).toBe('Santiago')
  })
})
