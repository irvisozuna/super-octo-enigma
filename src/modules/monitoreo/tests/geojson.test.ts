import { describe, expect, it } from 'vitest'
import type { EstadoToma, TomaFeature, TomasCollection } from '../types/mapa'
import { MARCA_FIJA, MARCA_LEJOS } from '../types/mapa'
import { cajaDe, contarEstados, conteosLeyenda, fusionarCambios, tieneMarca } from '../utils/geojson'

function toma(i: number, e: TomaFeature['properties']['e'], m = 0, coords: [number, number] = [-109.9, 22.9]): TomaFeature {
  return { type: 'Feature', geometry: { type: 'Point', coordinates: coords }, properties: { i, c: String(i), s: 1, e, m } }
}

const coleccion: TomasCollection = {
  type: 'FeatureCollection',
  features: [toma(1, 'p'), toma(2, 'p', 0, [-109.7, 23.1]), toma(3, 'l', MARCA_LEJOS), toma(4, 'f', MARCA_FIJA)],
}

describe('geojson (mapa de tomas)', () => {
  it('cuenta las tomas por estado', () => {
    expect(contarEstados(coleccion.features)).toEqual({ p: 2, l: 1, a: 0, x: 0, f: 1 })
  })

  it('aplica los cambios sin mutar la colección original y reporta solo los que tocaron tomas presentes', () => {
    const r = fusionarCambios(coleccion, [
      { i: 1, e: 'l', m: 0 }, // pendiente → leída
      { i: 3, e: 'l', m: MARCA_LEJOS }, // igual que antes: no cuenta
      { i: 99, e: 'a', m: 0 }, // fuera del alcance o del filtro
    ])

    expect(r.aplicados.map(c => c.i)).toEqual([1])
    expect(r.conteos).toEqual({ p: 1, l: 2, a: 0, x: 0, f: 1 })
    expect(r.coleccion.features[0].properties.e).toBe('l')
    expect(coleccion.features[0].properties.e).toBe('p')
  })

  it('sin cambios devuelve la misma colección', () => {
    const r = fusionarCambios(coleccion, [])

    expect(r.coleccion).toBe(coleccion)
    expect(r.aplicados).toEqual([])
  })

  it('calcula la caja de las tomas y lee las marcas', () => {
    expect(cajaDe(coleccion.features)).toEqual([-109.9, 22.9, -109.7, 23.1])
    expect(cajaDe([])).toBeNull()
    expect(tieneMarca(MARCA_LEJOS | MARCA_FIJA, MARCA_FIJA)).toBe(true)
    expect(tieneMarca(MARCA_LEJOS, MARCA_FIJA)).toBe(false)
  })
})

describe('conteosLeyenda', () => {
  const tomas = (specs: [number, string][]) => specs.map(([s, e], i) => ({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [0, 0] as [number, number] }, properties: { i, c: String(i), s, e: e as EstadoToma, m: 0 } }))

  it('suma las tomas pintadas del filtro y las que no tienen coordenada', () => {
    const features = tomas([[1, 'p'], [1, 'l'], [2, 'p'], [3, 'a']])
    const sinCoordenada = { 1: { p: 2, l: 0, a: 0, x: 0, f: 1 }, 2: { p: 1, l: 1, a: 0, x: 0, f: 0 } }

    const todo = conteosLeyenda(features, sinCoordenada, null)

    expect(todo.conteos).toEqual({ p: 5, l: 2, a: 1, x: 0, f: 1 })
    expect(todo.sinCoordenada).toBe(5)

    const solo1 = conteosLeyenda(features, sinCoordenada, [1])

    expect(solo1.conteos).toEqual({ p: 3, l: 1, a: 0, x: 0, f: 1 })
    expect(solo1.sinCoordenada).toBe(3)

    expect(conteosLeyenda(features, null, [3]).conteos).toEqual({ p: 0, l: 0, a: 1, x: 0, f: 0 })
  })
})
