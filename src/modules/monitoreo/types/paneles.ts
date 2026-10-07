/** GET /monitoring/periodo/paneles — refacturaciones y tarifa fija de la vista periodo (F2.8). */

export interface PeriodoPanel {
  id: number
  nombre: string
  inicio: string
  fin: string
  abierto: boolean
}

export interface Refacturacion {
  id: number
  contrato_id: number
  cuenta: string | null
  nombre: string | null
  gerencia_id: number | null
  gerencia: string | null
  sector_id: number | null
  sector: string | null
  fecha: string | null
  quien: string
  motivo: string
  por_lectura: boolean
  lectura_previa: number | null
  lectura_nueva: number | null
  consumo_previo: number | null
  consumo_nuevo: number | null
  factura_id: number | null
}

export interface PanelRefacturaciones {
  periodo: PeriodoPanel | null
  total: number
  por_lectura: number
  por_quien: { usuario: string; n: number; pct: number }[]
  por_motivo: { motivo: string; n: number }[]
  por_gerencia: { gerencia_id: number | null; gerencia: string; n: number }[]
  ultimas: Refacturacion[]
  fuente: string
  reporte: string
}

export type EstadoTarifaFija = 'completa' | 'generada' | 'pendiente' | 'faltante'

export interface GerenciaTarifaFija {
  gerencia_id: number
  gerencia: string
  tarifa_fija: number
  generadas: number
  leidas_campo: number
  facturadas: number
  faltan: number
  pct: number | null
  generadas_desde: string | null
  generadas_hasta: string | null
  generadas_total: number
  estado: EstadoTarifaFija
  alerta_r12: boolean
}

export interface PanelTarifaFija {
  periodo: PeriodoPanel | null
  dia_limite: number
  hoy: string
  gerencias: GerenciaTarifaFija[]
  totales: { tarifa_fija: number; generadas: number; leidas_campo: number; faltan: number; pct: number | null }
  definicion: string
}

export interface RespuestaPaneles {
  refacturaciones: PanelRefacturaciones
  tarifa_fija: PanelTarifaFija
}
