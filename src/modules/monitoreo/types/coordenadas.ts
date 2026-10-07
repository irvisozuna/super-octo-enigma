/** GET /monitoring/coordenadas — propuestas de coordenada para tomas sin coordenada o desactualizadas. */

export type TipoPropuesta = 'sin_coordenada' | 'desactualizada'
export type EstadoPropuesta = 'propuesta' | 'aceptada' | 'descartada' | 'aplicada'
export type ConfianzaPropuesta = 'alta' | 'media' | 'baja'

export interface PropuestaCoordenada {
  id: string
  contrato_id: number
  cuenta: string | null
  nombre: string | null
  direccion: string | null
  activo: boolean
  sector_id: number | null
  sector: string | null
  gerencia_id: number | null
  gerencia: string | null
  tipo: TipoPropuesta
  estado: EstadoPropuesta
  actual: { lat: number | null; lng: number | null }
  propuesta: { lat: number; lng: number }
  lecturas_base: number
  dispersion_m: number
  distancia_actual_m: number | null
  confianza: ConfianzaPropuesta
  decidido_por: string | null
  decidido_en: string | null
  nota: string | null
  calculado: string | null
}

export interface FiltrosCoordenadas {
  tipo: TipoPropuesta | null
  estado: EstadoPropuesta | null
  gerencia: number | null
  confianza: ConfianzaPropuesta | null
  q: string
  pagina: number
  por_pagina: number
}

export interface RespuestaCoordenadas {
  filas: PropuestaCoordenada[]
  total: number
  pagina: number
  por_pagina: number
  resumen: {
    sin_coordenada: Record<EstadoPropuesta, number>
    desactualizada: Record<EstadoPropuesta, number>
    tomas_sin_coordenada: number
    tomas_sin_coordenada_activas: number
    calculado: string | null
  }
  puede_decidir: boolean
}
