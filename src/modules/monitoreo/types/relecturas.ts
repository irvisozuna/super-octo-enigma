/** Re-lecturas, anotaciones y acciones desde el detalle (F2.5). */

export type MotivoRelectura = 'consumo_cero' | 'consumo_alto' | 'consumo_bajo' | 'lectura_menor' | 'anomalia' | 'revisar' | 'otro'
export type EstadoRelectura = 'solicitada' | 'releida' | 'cancelada'

export interface Relectura {
  id: string
  contrato_id: number
  periodo_id: number
  lectura_id: number | null
  cuenta: string | null
  nombre: string | null
  direccion: string | null
  secuencia: number | null
  sector_id: number | null
  sector: string | null
  gerencia_id: number | null
  lecturista_id: number | null
  lecturista: string | null
  motivo: MotivoRelectura
  motivo_etiqueta: string
  nota: string | null
  estado: EstadoRelectura
  pedida_por: string | null
  pedida_en: string
  resuelta_en: string | null
  resultado: { lectura_id: number; actual: number | null; consumo: number | null; hora: string | null } | null
  cancelacion: { nota: string | null } | null
}

export interface SugerenciaRelectura {
  motivo: MotivoRelectura
  etiqueta: string
}

export interface Nota {
  id: string
  tipo: 'lectura' | 'sector'
  sujeto_id: number
  periodo_id: number | null
  texto: string
  autor: string | null
  autor_id: string
  fecha: string
}

export interface FiltrosRelecturas {
  periodo: number | null
  gerencia: number | null
  sector: number | null
  lecturista: number | null
  estado: EstadoRelectura | 'todas'
}

export interface RespuestaRelecturas {
  periodo: { id: number; nombre: string } | null
  filas: Relectura[]
  conteos: Record<EstadoRelectura, number>
  motivos: Record<MotivoRelectura, string>
  puede_operar: boolean
}
