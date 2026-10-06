/** Forma estándar de error del API de reportes. */
export interface ErrorApi {
  codigo: string
  mensaje: string
  detalle?: string
  reintentable: boolean
}

export type TipoElementoMenu = 'reporte' | 'tablero'

export interface ElementoMenu {
  tipo: TipoElementoMenu
  key: string
  titulo: string
  descripcion: string | null
  categoria: string | null
}

export interface CategoriaMenu {
  nombre: string
  elementos: ElementoMenu[]
}

export interface DocumentoMenu {
  key: string
  titulo: string
  descripcion: string | null
}

/** GET /reporting/menu: ya filtrado por permisos en el servidor. */
export interface RespuestaMenu {
  categorias: CategoriaMenu[]
  documentos: DocumentoMenu[]
}

export interface ReglaCasl {
  action: string
  subject: string
}

/** GET /reporting/me/abilities */
export interface RespuestaAbilities {
  userAbilityRules: ReglaCasl[]
}
