import type { EstadoSector } from './mapa'

/** Periodo replicado (llx_smartwater_period). */
export interface PeriodoRef {
  id: number
  nombre: string
  inicio: string | null
  fin: string | null
  abierto: boolean
}

/** Vista del monitor: lo que pasa hoy (día) o el avance del periodo completo. */
export type VistaMonitor = 'hoy' | 'periodo'

/** Estado del lecturista en el día (Domain\Rules\Signals). */
export type EstadoLecturista = 'activo' | 'silencio' | 'terminado' | 'sin_iniciar' | 'fuera_de_jornada'

/** Avisos interinos por lecturista (el motor de alertas de la fase 2 los sustituye). */
export type AvisoLecturista = 'silencio' | 'bateria' | 'atoradas' | 'lejos'

/** Filtros de la pantalla principal; todos opcionales salvo la vista. */
export interface FiltrosMonitor {
  vista: VistaMonitor
  periodo: number | null
  dia: string | null
  gerencia: number | null
  sistema: number | null
  sector: number | null
  lecturista: number | null
  estado: EstadoSector | null
}

/** Parámetros tal como viajan a /api/monitoring/{resumen,sectores,lecturistas}. */
export type ParametrosMonitor = Partial<Record<'periodo' | 'dia' | 'gerencia' | 'sistema' | 'sector' | 'lecturista' | 'estado', string | number>>

/** GET /monitoring/catalogos */
export interface RespuestaCatalogos {
  periodos: PeriodoRef[]
  sistemas: { id: number; nombre: string; gerencia_id: number | null; sectores: number }[]
  sectores: { id: number; nombre: string; sistema_id: number | null; gerencia_id: number | null }[]
  lecturistas: { id: number; nombre: string; login: string | null; gerencia_id: number | null }[]
}

export interface AvanceResumen {
  esperadas: number
  atendidas: number
  atendidas_total: number
  pendientes: number
  estimadas: number
  con_anomalia: number
  leidas: number
  pct_campo: number | null
  pct_total: number | null
}

/** GET /monitoring/resumen */
export interface RespuestaResumen {
  periodo: PeriodoRef | null
  dia: string
  es_hoy: boolean
  alcance: { todas: boolean; gerencias: number[] }
  avance: AvanceResumen
  sectores: { total: number; por_estado: Record<EstadoSector, number> }
  lecturistas: {
    activos: number
    con_lecturas: number
    en_meta: number
    sin_iniciar: number
    silencio: number
    terminados: number
    lecturas_dia: number
    meta_diaria: number
  }
  avisos: { total: number; silencio: number; bateria: number; atoradas: number; lejos: number; rezagados: number }
  datos: {
    ultima_sincronizacion: string | null
    ultima_lectura_recibida: string | null
    ultima_captura: string | null
    ultimo_rastreo: string | null
    calculado: string | null
  }
}

export interface LecturistaDeSector {
  reader_id: number
  n: number
  nombre: string
}

/** Fila de GET /monitoring/sectores. Fechas en hora local "Y-m-d H:i:s". */
export interface FilaSector {
  sector_id: number
  sector: string
  sistema_id: number | null
  sistema: string | null
  gerencia_id: number | null
  gerencia: string | null
  esperadas: number
  tarifa_fija: number
  leidas: number
  con_anomalia: number
  estimadas: number
  impresas: number
  atendidas: number
  pendientes: number
  pct_campo: number | null
  pct_total: number | null
  estado: EstadoSector
  primera_lectura: string | null
  ultima_lectura: string | null
  dias_activo: number
  lecturistas: LecturistaDeSector[]
  fecha_programada: string | null
  fecha_limite: string | null
  tiene_contorno: boolean
  hoy: { lecturas: number; lecturistas: number; primera: string; ultima: string } | null
}

export interface ResumenSectores {
  esperadas: number
  atendidas: number
  atendidas_total: number
  pendientes: number
  estimadas: number
  por_estado: Partial<Record<EstadoSector, number>>
  lecturas_dia: number
  sectores_dia: number
  pct_campo: number | null
  pct_total: number | null
}

export interface RespuestaSectores {
  periodo: PeriodoRef | null
  dia?: string
  alcance?: { todas: boolean; gerencias: number[] }
  sectores: FilaSector[]
  resumen: ResumenSectores | null
  calculado?: string | null
}

/** Fila de GET /monitoring/lecturistas. */
export interface FilaLecturista {
  lecturista_id: number
  nombre: string
  login: string | null
  gerencia_id: number | null
  gerencia: string | null
  estado: EstadoLecturista
  avisos: AvisoLecturista[]
  ultima_actividad: string | null
  minutos_sin_actividad: number | null
  primera_lectura: string | null
  ultima_lectura: string | null
  ultima_senal: string | null
  lecturas: number
  meta: number
  pct_meta: number | null
  anomalias: number
  impresas: number
  lejos: number
  lecturas_por_hora: number | null
  minutos_totales: number
  minutos_muertos: number
  apego_secuencia_pct: number | null
  sectores: { sector_id: number; sector: string; lecturas: number }[]
  sectores_asignados: { sector_id: number; sector: string }[]
  km: number | null
  puntos_rastreo: number
  bateria_min: number | null
  version_app: string | null
  pendientes_enviar: number
  fotos_pendientes: number
}

export interface RespuestaLecturistas {
  periodo: PeriodoRef | null
  dia: string
  es_hoy: boolean
  lecturistas: FilaLecturista[]
  evaluado: string
}
