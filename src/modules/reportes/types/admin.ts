import type { TipoElementoMenu } from './api'
import type { AnchoWidget, TipoWidget } from './tablero'
import type { FormatoExportacion } from './exportacion'
import type { FormatoColumna, TipoColumna } from './reporte'

/** Fuente de datos tal como la ve el constructor (sin SQL). GET /reporting/admin/sources */
export interface FuenteResumen {
  key: string
  name: string
  description: string | null
  mode: 'materialize' | 'paginate'
  max_rows: number
  params: { name: string; type: string; required: boolean }[]
  filters: { filter: string; bind: string }[]
  columns: { name: string; type?: TipoColumna; label?: string }[]
  version: number
}

/** Explicación de una columna (llaves del archivo JSON): resumen para el tooltip, de dónde sale y cómo se calcula. */
export interface AyudaDefinicion {
  summary: string
  origin?: string
  calculation?: string
}

/** Definición de reporte que se guarda desde la pantalla (mismas llaves que el archivo JSON). */
export interface DefinicionReporte {
  key?: string | null
  name: string
  description?: string | null
  source: string
  category?: string | null
  columns: { column: string; label?: string; format?: FormatoColumna; align?: 'start' | 'center' | 'end'; visible?: boolean; total?: boolean; help?: AyudaDefinicion | null }[]
  filters?: { filter: string; required?: boolean; fixed?: boolean; hidden?: boolean; default?: unknown }[]
  default_order?: { column: string; dir?: 'asc' | 'desc' }[]
  export_formats?: FormatoExportacion[]
  pdf_template?: string | null
  settings?: Record<string, unknown> | null
  order?: number
}

/** Fila de GET /reporting/admin/reports */
export interface ReporteAdmin extends DefinicionReporte {
  key: string
  origin: 'code' | 'ui'
  version: number
  is_active: boolean
  updated_at: string | null
}

/** Permiso concreto sobre un objeto (ver, exportar, generar). */
export interface PermisoObjeto {
  accion: 'read' | 'export' | 'generate'
  nombre: string
  etiqueta: string
}

export interface ObjetoPermisos {
  tipo: TipoElementoMenu | 'documento'
  key: string
  titulo: string
  categoria: string | null
  permisos: PermisoObjeto[]
}

export interface RolPermisos {
  id: string
  nombre: string
  es_admin: boolean
}

export interface PermisoGeneral {
  nombre: string
  etiqueta: string
  descripcion: string
}

/** GET /reporting/admin/grants */
export interface MatrizPermisos {
  roles: RolPermisos[]
  generales: PermisoGeneral[]
  objetos: ObjetoPermisos[]
  asignaciones: Record<string, string[]>
}

/** PUT /reporting/admin/roles/{role}/grants */
export interface RespuestaPermisosRol {
  rol: string
  permisos: string[]
}

/** GET /reporting/admin/users */
export interface RolUsuarios {
  id: string
  nombre: string
  es_admin: boolean

  /** El rol admin solo lo otorga o quita otro admin. */
  asignable: boolean
  usuarios: number
}

export interface UsuarioRoles {
  id: string
  usuario: string
  nombre: string | null
  roles: string[]
  ultima_actividad: string | null
  soy_yo: boolean
}

export interface ListaUsuariosRoles {
  roles: RolUsuarios[]
  usuarios: UsuarioRoles[]
}

/** Widget tal como se guarda (mismas llaves que el archivo JSON). */
export interface DefinicionWidget {
  key: string
  type: TipoWidget
  title: string
  source: string
  width: AnchoWidget
  sort_order?: number
  params_map?: Record<string, string> | null
  config: Record<string, unknown>
}

/** Definición de tablero que se guarda desde la pantalla (mismas llaves que el archivo JSON). */
export interface DefinicionTablero {
  key?: string | null
  name: string
  description?: string | null
  category?: string | null
  filters: { filter: string; required?: boolean; fixed?: boolean; hidden?: boolean; default?: unknown }[]
  widgets: DefinicionWidget[]
  layout?: Record<string, unknown> | null
  order?: number
}

/** Fila de GET /reporting/admin/dashboards */
export interface TableroAdmin extends DefinicionTablero {
  key: string
  version: number
  origen: 'code' | 'ui'
  activo: boolean
  updated_at: string | null
}
