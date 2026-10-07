/** Estado de una toma en el periodo: p pendiente · l leída · a atendida con anomalía · x estimada · f tarifa fija sin lectura. */
export type EstadoToma = 'p' | 'l' | 'a' | 'x' | 'f'

/** Marcas (bits) que acompañan al estado. */
export const MARCA_LEJOS = 1
export const MARCA_IMPRESA = 2
export const MARCA_FIJA = 4
export const MARCA_CORREGIDA = 8

export interface TomaProps {

  /** Contrato (id_account en Aquasoft Comercial). */
  i: number

  /** Número de cuenta (para el hover). */
  c: string
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

/** GET /monitoring/mapa/sin-coordenada: tomas activas sin coordenada válida por sector y estado (cuentan en la leyenda). */
export interface RespuestaSinCoordenada {
  total: number
  sectores: Record<string, ConteoEstados>
}

/** Propiedades de la última posición de un lecturista (GET /monitoring/mapa/lecturistas). */
export interface LecturistaMapaProps {
  id: number
  nombre: string
  estado: 'activo' | 'silencio' | 'terminado' | 'sin_iniciar' | 'fuera_de_jornada'
  minutos: number | null
  ultima_actividad: string | null

  /** rastreo = último punto GPS del teléfono; lectura = última lectura con GPS (app 010A sin rastreo). */
  fuente: 'rastreo' | 'lectura'
  sin_rastreo: boolean
  posicion_en: string
  lecturas: number
  meta: number
  bateria: number | null
  sector: string | null
  avisos: string[]
}

export interface LecturistaFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: LecturistaMapaProps
}

export interface LecturistasCollection {
  type: 'FeatureCollection'
  features: LecturistaFeature[]
  dia?: string
  evaluado?: string
}

/** GET /monitoring/mapa/recorrido */
export interface RespuestaRecorrido {
  lecturista: number
  dia: string
  sin_rastreo: boolean
  recorrido: {
    type: 'FeatureCollection'
    features: {
      type: 'Feature'
      geometry: { type: 'LineString'; coordinates: [number, number][] } | { type: 'Point'; coordinates: [number, number] }
      properties: { tipo: 'recorrido' | 'inicio' | 'fin'; puntos?: number; desde?: string; hasta?: string; t?: string }
    }[]
  }
  lecturas: {
    type: 'FeatureCollection'
    features: {
      type: 'Feature'
      geometry: { type: 'Point'; coordinates: [number, number] }
      properties: { i: number; c: string | null; t: string; a: boolean; d: number | null; s: number | null }
    }[]
  }
}
