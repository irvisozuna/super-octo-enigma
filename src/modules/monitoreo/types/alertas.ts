/** GET /monitoring/alertas — bandeja del motor de alertas (F2.2). */

export type SeveridadAlerta = 'alta' | 'media' | 'aviso'
export type EstadoAlerta = 'abierta' | 'atendida' | 'silenciada' | 'cerrada'
export type EstadoFiltroAlertas = 'activas' | EstadoAlerta | 'todas'
export type SujetoAlerta = 'sector' | 'lecturista' | 'lectura' | 'dispositivo' | 'gerencia' | 'contrato'
export type AccionAlerta = 'atender' | 'silenciar' | 'reabrir' | 'cerrar'

export interface Alerta {
  id: string
  regla: string
  regla_titulo: string
  severidad: SeveridadAlerta
  sujeto_tipo: SujetoAlerta
  sujeto_id: string
  gerencia_id: number | null
  periodo_id: number | null
  titulo: string
  detalle: Record<string, unknown> | null
  estado: EstadoAlerta
  abierta: string
  ultima_vez: string
  cerrada: string | null
  motivo_cierre: string | null
  atendida_por: string | null
  atendida_en: string | null
  silenciada_hasta: string | null
  silenciada_por: string | null
  veces: number
  es_evento: boolean
}

export interface ReglaAlerta {
  codigo: string
  titulo: string
  severidad: SeveridadAlerta
}

export interface ResumenAlertas {
  activas: number
  por_severidad: Record<SeveridadAlerta, number>
  por_estado: Record<'abierta' | 'atendida' | 'silenciada', number>
  por_regla: Record<string, number>
  ultimo_ciclo: string | null
}

export interface FiltrosAlertas {
  estado: EstadoFiltroAlertas
  severidad: SeveridadAlerta | null
  regla: string | null
  tipo: SujetoAlerta | null
  gerencia: number | null
  q: string
  pagina: number
  por_pagina: number
}

export interface RespuestaAlertas {
  filas: Alerta[]
  total: number
  pagina: number
  por_pagina: number
  reglas: ReglaAlerta[]
  resumen: ResumenAlertas
  puede_operar: boolean
}

export interface EventoAlerta {
  accion: 'abrir' | 'reabrir' | AccionAlerta
  usuario: string | null
  nota: string | null
  hasta: string | null
  fecha: string
}
