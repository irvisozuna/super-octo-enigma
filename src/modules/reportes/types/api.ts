/** Forma estándar de error del API de reportes. */
export interface ErrorApi {
  codigo: string
  mensaje: string
  detalle?: string
  reintentable: boolean
}

/** `lote`: documento que se genera en lote (recibos de un sector); abre la pantalla del lote. */
export type TipoElementoMenu = 'reporte' | 'tablero' | 'lote'

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

  /** También se genera en lote (aparece como elemento del índice). */
  lote: boolean
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
