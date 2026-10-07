/** Estado de una toma en el periodo: p pendiente · l leída · a atendida con anomalía · x estimada · f tarifa fija sin lectura. */
export type EstadoToma = 'p' | 'l' | 'a' | 'x' | 'f'

/** Marcas (bits) que acompañan al estado. */
export const MARCA_LEJOS = 1
export const MARCA_IMPRESA = 2
export const MARCA_FIJA = 4
export const MARCA_CORREGIDA = 8

export interface TomaProps {

  /** Contrato (id_account en Dolibarr). */
  i: number
  s: number | null
  e: EstadoToma
  m: number
}

export interface TomaFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: TomaProps
}

export interface TomasCollection {
  type: 'FeatureCollection'
  features: TomaFeature[]
}

export interface CambioToma {
  i: number
  e: EstadoToma
  m: number
}

/** GET /monitoring/mapa/cambios */
export interface RespuestaCambios {
  periodo?: number
  cambios: CambioToma[]
  hasta: string
}

/** Estado del sector en el periodo (monitoring_sector_periods.status) o `sin_datos`. */
export type EstadoSector = 'sin_esperadas' | 'pendiente' | 'iniciado' | 'terminado' | 'rezagado' | 'sin_datos'

export interface SectorProps {
  s: number
  n: string
  g: number | null
  gn: string | null
  sis: string | null
  e: EstadoSector
  p: number | null
  esp: number
  at: number
  pen: number
  src: string | null
}

export interface SectorFeature {
  type: 'Feature'
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown }
  properties: SectorProps
}

export interface SectoresCollection {
  type: 'FeatureCollection'
  features: SectorFeature[]
}

export type ConteoEstados = Record<EstadoToma, number>
