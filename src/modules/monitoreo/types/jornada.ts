import type { EstadoLecturista } from './monitor'

/** GET /monitoring/lecturistas/{lecturista}?dia — jornada de un lecturista en un día (solo lectura). */

export interface HuecoJornada {
  desde: string
  hasta: string
  minutos: number
}

export interface TramoSinSenal extends HuecoJornada {

  /** true cuando el tramo sigue abierto (último punto hasta el fin de la jornada o hasta ahora). */
  abierto: boolean
}

export interface LecturaJornada {
  id: number
  contrato_id: number
  cuenta: string | null
  hora: string
  llegada: string | null
  sector_id: number | null
  sector: string | null
  anomalia: string | null
  distancia_m: number | null
  lejos: boolean
  impresa: boolean | null
  con_gps: boolean
}

export interface ResumenJornada {
  primera_lectura: string | null
  ultima_lectura: string | null
  lecturas: number
  anomalias: number
  impresas: number
  lejos: number
  lecturas_por_hora: number | null
  minutos_totales: number
  minutos_muertos: number
  huecos: HuecoJornada[]
  sectores: { sector_id: number; sector: string }[]
  apego_secuencia_pct: number | null

  /** null sin rastreo: no se inventan kilómetros. */
  km: number | null
  puntos_rastreo: number
}

export interface PromedioJornada {
  dias: number
  periodos: string[]
  lecturas: number
  lecturas_por_hora: number | null
  minutos_muertos: number
  minutos_totales: number
  anomalias: number
  impresas: number
  lejos: number
  sectores: number
}

export interface RespuestaJornada {
  lecturista: { id: number; nombre: string; login: string | null; activo: boolean; gerencia_id: number | null; gerencia: string | null }
  dia: string
  es_hoy: boolean
  estado: EstadoLecturista
  avisos: string[]
  jornada: ResumenJornada | null
  dispositivo: {
    sin_rastreo: boolean
    bateria_min: number | null
    bateria_actual: number | null
    version_app: string | null
    datos_moviles: boolean | null
    recibos_por_enviar: number
    fotos_por_enviar: number
    ultima_senal: string | null
    ultimo_rastreo: string | null
    primer_rastreo: string | null
    tramos_sin_senal: TramoSinSenal[]
  }
  lecturas: LecturaJornada[]
  promedio: PromedioJornada | null
  parametros: { pausa_min: number; silencio_min: number; distancia_m: number; atoradas_h: number; jornada: { inicio: string; fin: string; dias?: number[] } }
}
