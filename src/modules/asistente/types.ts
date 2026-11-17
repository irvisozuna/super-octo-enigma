/* Tipos del asistente de IA (XEL1-539). Los nombres de los campos siguen la API (`/api/asistente/*`). */

export type EventoChat =
  | { type: 'conversation'; payload: { id: string; nivel?: NivelAgente } }
  | { type: 'text-delta'; payload: { text: string } }
  | { type: 'tool-start'; payload: { id: number; toolName: string } }
  | { type: 'tool-call'; payload: { id?: number; toolName: string; detalle?: string } }
  | { type: 'tool-result'; payload: { id: number; toolName: string; ok: boolean } }
  | { type: 'tool-progress'; payload: { id: number; toolName: string; secciones: number; tipo?: TipoDocumento } }
  | { type: 'thinking'; payload: Record<string, never> }
  | { type: 'verificacion'; payload: Verificacion }
  | { type: 'error'; payload: { error: { message: string } } }
  | { type: 'truncated'; payload: { motivo: MotivoCorte } }
  | { type: 'done' }

export type NivelRespuesta = 'auto' | 'rapido' | 'analisis'

/** Qué agente contestó: el rápido o el de análisis (este tarda más). */
export type NivelAgente = 'rapido' | 'analisis'

export type TipoDocumento = 'presentacion' | 'informe'

/** Un paso del avance (XEL1-714): una llamada a una herramienta. */
export interface PasoChat {
  id: number
  herramienta: string
  detalle?: string
  estado: 'en_curso' | 'listo' | 'error'
  secciones?: number
  tipo?: TipoDocumento
}

/** Paso como lo guarda el historial. */
export interface PasoGuardado {
  herramienta: string
  detalle?: string
  ok?: boolean
}

/** Por qué una respuesta quedó incompleta (XEL1-711): tope de longitud o de pasos del modelo. */
export type MotivoCorte = 'longitud' | 'pasos'

/** Lo que el usuario tiene en pantalla al preguntar desde un reporte (XEL1-717). */
export interface ContextoPantalla {
  tipo: 'reporte'
  clave: string
  titulo: string
  filtros: Record<string, unknown>
  resumen?: string
}

/** Sello de cifras (XEL1-719): cuántas cifras salieron de las consultas y cuáles no. */
export interface Verificacion {
  total: number
  verificadas: number
  sin_verificar: string[]
}

/** Informe o presentación que armó el asistente (XEL1-712). */
export interface DocumentoAsistente {
  id: string
  tipo: TipoDocumento
  titulo: string
  creado: string
  secciones: number
  verificacion?: Verificacion | null
}

export interface ConversacionResumen {
  id: string
  titulo: string
  mensajes: number
  actualizada: string | null
}

/** Mensaje como lo guarda el servidor. */
export interface MensajeGuardado {
  rol: 'usuario' | 'asistente'
  texto: string
  herramientas?: string[]
  cortada?: MotivoCorte
  pasos?: PasoGuardado[]
  duracion_ms?: number
  verificacion?: Verificacion
  nivel?: NivelAgente
  fecha: string
}

export interface ConversacionDetalle {
  id: string
  titulo: string
  mensajes: MensajeGuardado[]
}

export interface EstadoAsistente {
  preguntas_por_hora: number
  preguntas_restantes: number
  consumo_mensual_pct: number | null
  consulta_cuentas: boolean

  /** Última sincronización con Aquasoft Comercial (ISO, UTC) y fuentes con más de un día sin sincronizar. */
  corte?: { al: string; atrasadas: { fuente: string; al: string }[] } | null
}

/** Mensaje en pantalla: el que se está transmitiendo lleva el avance de las consultas. */
export interface MensajeChat {
  id: string
  rol: 'usuario' | 'asistente'
  texto: string
  herramientas: string[]
  estado: 'transmitiendo' | 'listo' | 'error' | 'detenido'
  error?: string
  cortada?: MotivoCorte

  /** Avance (XEL1-714): pasos, fase entre consultas, hora de inicio y duración final. */
  pasos: PasoChat[]
  fase?: 'analizando'
  nivel?: NivelAgente
  inicio?: number
  duracionMs?: number
  verificacion?: Verificacion
}
