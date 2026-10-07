import type { Nota, Relectura, SugerenciaRelectura } from './relecturas'

/** GET /monitoring/lecturas/{contrato}?periodo — detalle de la lectura de una toma en un periodo. */

export interface ContratoDetalle {
  id: number
  cuenta: string
  nombre: string | null
  direccion: string | null
  estatus: string | null
  activo: boolean
  sector_id: number | null
  sector: string | null
  sistema: string | null
  gerencia_id: number | null
  gerencia: string | null
  secuencia: number | null
  clave_loc: string | null
  medidor: string | null
  tipo_cargo: string | null
  tarifa_fija: boolean
  promedio: number | null
  coordenada: { lat: string | number | null; lng: string | number | null; valida: boolean; corregida: boolean; en_duda: boolean }
}

export interface AnomaliaDetalle {
  id: number
  codigo: string | null
  etiqueta: string
  accion_inmediata: boolean
  requiere_foto: boolean
}

export interface LecturaDetalle {
  id: number
  invoice_id: string | null
  origen: 'campo' | 'promedio_automatico'
  anterior: number | null
  actual: number | null
  consumo: number | null
  consumo_real: number | null
  promedio: number | null
  variacion_pct: number | null
  anomalia: AnomaliaDetalle | null
  comentario: string | null
  captura: { hora: string | null; confiable: boolean; fuente: string | null }
  llegada: string | null
  retraso_min: number | null
  recibo: { impreso: boolean | null; importe: number | null; impresora: string | null; factura_id: number | null }
  lecturista: { id: number; nombre: string } | null
  dispositivo: { id: string | null; bateria: number | null; datos_moviles: boolean | null; geocerca_app: number | null } | null
  gps: { distancia_m: number | null; lejos: boolean; toma_sin_coordenada: boolean; lectura_sin_gps: boolean; lat: number | null; lng: number | null; umbral_m: number }

  /** Pendientes de la app (F3.3). */
  fotos: null
}

export interface RespuestaDetalleLectura {
  contrato: ContratoDetalle
  periodo: { id: number; nombre: string; abierto: boolean } | null
  lectura: LecturaDetalle | null
  otras_lecturas: LecturaDetalle[]

  /** F2.5: avisos de consumo con la lógica del reporte de anomalías, orden de re-lectura vigente y anotaciones. */
  sugerencias: SugerenciaRelectura[]
  relectura: Relectura | null
  notas: Nota[]
  permisos: { duplicado: boolean; operar: boolean }
}

/** Fila del historial de Support (`GET /supports/getReadingsByContract/{id}`): nombres tal como vienen de Aquasoft Comercial. */
export interface HistorialLectura {
  Periodo: string
  Fecha: string | null
  Anomalia: string | null
  Lecturista: string | null
  Anterior: number | string | null
  Actual: number | string | null
  Consumo: number | string | null
  periodoDeFacturacionID: number | string
}

export interface RespuestaHistorial {
  data: HistorialLectura[]
  pagination?: { total?: number; page?: number; limit?: number }
}
