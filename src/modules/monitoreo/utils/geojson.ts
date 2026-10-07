import type { CambioToma, ConteoEstados, EstadoSector, EstadoToma, LecturistaMapaProps, TomaFeature, TomasCollection } from '../types/mapa'

/** Colores por estado de toma (los mismos en el mapa y en la leyenda). */
export const COLORES_ESTADO: Record<EstadoToma, string> = {
  p: '#9e9e9e',
  l: '#2e7d32',
  a: '#ef6c00',
  x: '#1e88e5',
  f: '#8e24aa',
}

/** Claves de traducción por estado (`monitoreo.mapa.estados.*`). */
export const CLAVES_ESTADO: Record<EstadoToma, string> = {
  p: 'pendiente',
  l: 'leida',
  a: 'anomalia',
  x: 'estimada',
  f: 'fija',
}

export const ORDEN_ESTADOS: EstadoToma[] = ['p', 'l', 'a', 'x', 'f']

export const COLORES_SECTOR: Record<EstadoSector, string> = {
  terminado: '#2e7d32',
  iniciado: '#f9a825',
  pendiente: '#9e9e9e',
  rezagado: '#c62828',
  sin_esperadas: '#bdbdbd',
  sin_datos: '#bdbdbd',
}

export function conteoVacio(): ConteoEstados {
  return { p: 0, l: 0, a: 0, x: 0, f: 0 }
}

export function contarEstados(features: TomaFeature[]): ConteoEstados {
  const conteo = conteoVacio()
  for (const f of features) {
    if (f.properties.e in conteo)
      conteo[f.properties.e]++
  }

  return conteo
}

/**
 * Aplica los cambios de estado a la colección sin mutarla. Devuelve la colección nueva, el conteo actualizado y los
 * cambios que sí tocaron una toma presente (los demás son tomas fuera del alcance o del filtro vigente).
 */
export function fusionarCambios(coleccion: TomasCollection, cambios: CambioToma[]): { coleccion: TomasCollection; conteos: ConteoEstados; aplicados: CambioToma[] } {
  if (!cambios.length)
    return { coleccion, conteos: contarEstados(coleccion.features), aplicados: [] }

  const porId = new Map<number, CambioToma>()
  for (const c of cambios)
    porId.set(c.i, c)

  const aplicados: CambioToma[] = []

  const features = coleccion.features.map(f => {
    const c = porId.get(f.properties.i)
    if (!c || (c.e === f.properties.e && c.m === f.properties.m))
      return f
    aplicados.push(c)

    return { ...f, properties: { ...f.properties, e: c.e, m: c.m } }
  })

  const nueva: TomasCollection = { type: 'FeatureCollection', features }

  return { coleccion: nueva, conteos: contarEstados(features), aplicados }
}

/** Caja [oeste, sur, este, norte] de la colección, o null si está vacía. */
export function cajaDe(features: TomaFeature[]): [number, number, number, number] | null {
  if (!features.length)
    return null
  let w = Number.POSITIVE_INFINITY
  let s = Number.POSITIVE_INFINITY
  let e = Number.NEGATIVE_INFINITY
  let n = Number.NEGATIVE_INFINITY
  for (const f of features) {
    const [x, y] = f.geometry.coordinates
    if (x < w)
      w = x
    if (x > e)
      e = x
    if (y < s)
      s = y
    if (y > n)
      n = y
  }

  return [w, s, e, n]
}

export function tieneMarca(m: number, marca: number): boolean {
  return (m & marca) === marca
}

/** Suma dos conteos por estado. */
export function sumarConteos(a: ConteoEstados, b: ConteoEstados): ConteoEstados {
  return { p: a.p + b.p, l: a.l + b.l, a: a.a + b.a, x: a.x + b.x, f: a.f + b.f }
}

/**
 * Conteos de la leyenda para el filtro vigente: las tomas pintadas (acotadas a los sectores filtrados) más las que no
 * tienen coordenada (por sector), que no se pintan pero sí cuentan. Devuelve también cuántas no se pintan.
 */
export function conteosLeyenda(features: TomaFeature[], sinCoordenada: Record<string, ConteoEstados> | null, sectores: number[] | null): { conteos: ConteoEstados; sinCoordenada: number } {
  const ids = sectores ? new Set(sectores) : null
  let conteos = contarEstados(ids ? features.filter(f => f.properties.s !== null && ids.has(f.properties.s)) : features)
  let ocultas = 0
  if (sinCoordenada) {
    for (const [sector, c] of Object.entries(sinCoordenada)) {
      if (ids && !ids.has(Number(sector)))
        continue
      conteos = sumarConteos(conteos, c)
      ocultas += c.p + c.l + c.a + c.x + c.f
    }
  }

  return { conteos, sinCoordenada: ocultas }
}

/** Color del marcador del lecturista por frescura de la señal: verde < 10 min, amarillo < `silencio` min, rojo sin reporte; azul terminó. */
export function colorSenal(props: Pick<LecturistaMapaProps, 'estado' | 'minutos'>, silencioMin = 90): string {
  if (props.estado === 'terminado')
    return '#1e88e5'
  if (props.minutos === null)
    return '#9e9e9e'
  if (props.minutos < 10)
    return '#2e7d32'
  if (props.minutos < silencioMin)
    return '#f9a825'

  return '#c62828'
}
