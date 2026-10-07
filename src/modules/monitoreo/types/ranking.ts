/** GET /monitoring/ranking — ranking y comparativos de lecturistas (F2.4). */

export interface ReferenciaLecturista {
  periodos: number
  dias: number
  lecturas_dia: number | null
  lecturas_hora: number | null
  min_muertos_dia: number | null
}

export interface FilaRanking {
  posicion: number
  lecturista_id: number
  nombre: string
  gerencia_id: number | null
  gerencia: string | null
  dias: number
  lecturas: number
  lecturas_dia: number | null
  lecturas_hora: number | null
  min_totales: number
  min_muertos: number
  anomalias: number
  impresas: number
  lejos: number
  pct_lejos: number | null
  apego_pct: number | null
  sectores: number
  km: number | null
  referencia: ReferenciaLecturista | null
  delta: { lecturas_dia: number | null; lecturas_hora: number | null; min_muertos_dia: number | null } | null
}

export interface TotalesRanking {
  lecturistas: number
  dias: number
  lecturas: number
  lecturas_dia: number | null
  lecturas_hora: number | null
  min_totales: number
  min_muertos: number
  anomalias: number
  impresas: number
  lejos: number
}

export interface RespuestaRanking {
  periodo: { id: number; nombre: string; inicio: string; fin: string } | null
  desde: string
  hasta: string
  gerencia_id: number | null
  meta_diaria: number
  distancia_m: number
  filas: FilaRanking[]
  totales: TotalesRanking | null
  referencia_periodos: string[]
}

export interface FiltrosRanking {
  periodo: number | null
  gerencia: number | null
  desde: string | null
  hasta: string | null
}
