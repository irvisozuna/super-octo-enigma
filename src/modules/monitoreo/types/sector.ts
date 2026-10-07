import type { EstadoSector } from './mapa'

/** GET /monitoring/sectores/{sector}?periodo&dia — detalle de un sector en un periodo (solo lectura). */

export interface SectorCabecera {
  id: number
  nombre: string
  codigo: string | null
  sistema: string | null
  gerencia_id: number | null
  gerencia: string | null
  activo: boolean
  tiene_contorno: boolean
  centro: [number, number] | null
}

export interface AvanceSector {
  estado: EstadoSector
  esperadas: number
  esperadas_medidas: number
  tarifa_fija: number
  leidas: number
  con_anomalia: number
  estimadas: number
  tarifa_fija_leidas: number
  impresas: number
  atendidas: number
  atendidas_total: number
  pendientes: number
  pct_campo: number | null
  pct_total: number | null
  primera_lectura: string | null
  ultima_lectura: string | null
  dias_activo: number
  fecha_programada: string | null
  fecha_limite: string | null
  calculado: string | null

  /** Lecturas del periodo de contratos que ya no están activos (no cuentan en el avance). */
  lecturas_extra: number
}

export interface PendienteSector {
  contrato_id: number
  cuenta: string
  nombre: string | null
  direccion: string | null
  manzana: string | null
  lote: string | null
  secuencia: number | null
  clave_loc: string | null
  sin_coordenada: boolean
  estimada: boolean
  ultima_lectura: { periodo: string | null; fecha: string | null; actual: number | null } | null
}

export interface LecturistaSector {
  lecturista_id: number
  nombre: string
  asignado: boolean
  lecturas: number
  pct: number | null
  primera: string | null
  ultima: string | null
  ultima_senal: string | null
}

export interface RespuestaDetalleSector {
  sector: SectorCabecera
  periodo: { id: number; nombre: string; inicio: string | null; fin: string | null; abierto: boolean } | null
  dia: string
  avance: AvanceSector | null
  pendientes: PendienteSector[]
  lecturistas: LecturistaSector[]
  linea_tiempo: {
    dias: { fecha: string; lecturas: number; lecturistas: number }[]
    horas_dia: { hora: number; lecturas: number }[]
    horas_periodo: { hora: number; lecturas: number }[]
  }
}
