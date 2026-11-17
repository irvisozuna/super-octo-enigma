/* Tipos del asistente de IA (XEL1-539). Los nombres de los campos siguen la API (`/api/asistente/*`). */

export type EventoChat =
  | { type: 'conversation'; payload: { id: string } }
  | { type: 'text-delta'; payload: { text: string } }
  | { type: 'tool-call'; payload: { toolName: string } }
  | { type: 'error'; payload: { error: { message: string } } }
  | { type: 'truncated'; payload: { motivo: MotivoCorte } }
  | { type: 'done' }

export type NivelRespuesta = 'auto' | 'rapido' | 'analisis'

/** Por qué una respuesta quedó incompleta (XEL1-711): tope de longitud o de pasos del modelo. */
export type MotivoCorte = 'longitud' | 'pasos'

/** Informe o presentación que armó el asistente (XEL1-712). */
export interface DocumentoAsistente {
  id: string
  tipo: 'presentacion' | 'informe'
  titulo: string
  creado: string
  secciones: number
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
}
