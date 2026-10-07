import type { EstadoSector } from './mapa'
import type { PeriodoRef } from './monitor'

/** GET /monitoring/calendario — calendario de lectura de un periodo por sector. Fechas "Y-m-d". */
export interface FilaCalendario {
  sector_id: number
  sector: string
  sistema: string | null
  gerencia_id: number | null
  gerencia: string | null
  programada: string | null
  limite: string | null
  lecturista_id: number | null
  lecturista: string | null
  nota: string | null
  origen: 'manual' | 'copia' | 'excel' | null
  actualizado: string | null
  estado: EstadoSector | null
  esperadas: number
  pct_campo: number | null
  primera_lectura: string | null
  ultima_lectura: string | null
  lecturistas_reales: string[]
}

export interface RespuestaCalendario {
  periodo: PeriodoRef | null
  anterior: { id: number; nombre: string; con_calendario: number } | null
  sectores: FilaCalendario[]
  con_fecha: number
  dias_habiles: number[]
  puede_editar: boolean
}

/** Lo que se edita de una fila (PUT /monitoring/admin/calendario/{periodo}). */
export interface EdicionCalendario {
  sector_id: number
  programada: string | null
  limite: string | null
  lecturista_id: number | null
  nota: string | null
}

export interface ResultadoGuardado {
  guardadas: number
  borradas: number
  rechazadas: { sector_id: number; motivo: string }[]
}

export interface ResultadoCopia {
  copiadas: number
  omitidas: number
  rechazadas: { sector_id: number; motivo: string }[]
}

export interface ResultadoImportacion {
  leidas: number
  guardadas: number
  borradas: number
  rechazadas: { fila: number; sector_id: number | null; motivo: string }[]
}
