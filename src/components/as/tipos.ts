import type { FormatoValor } from '@/utils/formato'

/*
 * Tipos compartidos de los componentes del Aquasoft Design System 1.0 (src/components/as).
 */

/** Formato de una columna: los de `src/utils/formato` más `estado` (chip con token de color) y `personalizado` (solo slot). */
export type FormatoColumnaTabla = FormatoValor | 'estado' | 'personalizado'

export interface ColumnaTabla<T = Record<string, unknown>> {

  /** Clave del dato en la fila (acepta rutas con punto: `hoy.lecturas`). */
  clave: string
  titulo: string
  formato?: FormatoColumnaTabla

  /** Decimales para `decimal` y `porcentaje` (por defecto 2 y 1). */
  decimales?: number

  /** Por defecto: fin para formatos numéricos, inicio para el resto. */
  alineacion?: 'start' | 'center' | 'end'
  ancho?: number | string
  anchoMin?: number
  ordenable?: boolean

  /** Recorta con puntos suspensivos y muestra el texto completo en el título. */
  truncar?: boolean

  /** Explicación corta que aparece al pasar el ratón por el encabezado. */
  descripcion?: string

  /** Para `estado`: token de color del chip (`success`, `alerta-alta`, …). */
  colorEstado?: (valor: unknown, fila: T) => string

  /** Para `estado`: texto del chip (por defecto el valor). */
  textoEstado?: (valor: unknown, fila: T) => string
}

/** 44 px estándar · 40 px media · 36 px densa (paneles laterales y listados largos). */
export type DensidadTabla = 'estandar' | 'media' | 'densa'

export type OrdenTabla = { key: string; order?: 'asc' | 'desc' | boolean }[]

/** Paginación del lado del servidor. */
export interface PaginacionTabla {
  pagina: number
  porPagina: number
  total: number
}

export type TamanoPanel = 'sm' | 'md' | 'lg' | 'xl'
export type TamanoDialogo = 'sm' | 'md' | 'lg' | 'xl'

export const ANCHOS_PANEL: Record<TamanoPanel, number> = { sm: 360, md: 520, lg: 640, xl: 720 }
export const ANCHOS_DIALOGO: Record<TamanoDialogo, number> = { sm: 480, md: 640, lg: 880, xl: 1100 }
