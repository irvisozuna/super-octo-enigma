/** Gerencia (entidad de Dolibarr) tal como la muestra el módulo. */
export interface GerenciaRef {
  id: number
  label: string
}

export interface Gerencia extends GerenciaRef {
  code?: string
}

/** GET /monitoring/me: qué puede hacer y qué gerencias ve el usuario actual. */
export interface RespuestaMe {
  permisos: {
    ver: boolean
    operar: boolean
    administrar: boolean
  }
  es_admin: boolean
  alcance: {

    /** admin o manage monitoring: todas las gerencias sin configurar nada. */
    todas: boolean
    gerencias: GerenciaRef[]

    /** Tiene permiso pero nadie le ha asignado una gerencia: no ve datos. */
    sin_asignar: boolean
  }
  catalogo_disponible: boolean
  permisos_nombres: string[]
}

/** GET /monitoring/gerencias: las gerencias visibles para el usuario (filtro del monitor). */
export interface RespuestaGerencias {
  gerencias: GerenciaRef[]
  todas: boolean
}

/** Fila de la pantalla "Gerencias por usuario". */
export interface UsuarioAlcance {
  id: string
  nombre: string
  email: string
  roles: string[]
  es_admin: boolean

  /** admin o manage monitoring: ve todas las gerencias; no se le asignan. */
  ve_todas: boolean

  /** Algún rol le da read/operate/manage monitoring. */
  tiene_monitoreo: boolean
  gerencias: GerenciaRef[]
}

/** GET /monitoring/admin/alcances */
export interface RespuestaAlcances {
  usuarios: UsuarioAlcance[]

  /** Catálogo de Dolibarr; vacío cuando no respondió (ver `aviso`). */
  gerencias: Gerencia[]
  aviso: string | null
}

/** PUT /monitoring/admin/alcances/{user} */
export interface RespuestaActualizarAlcance {
  usuario: string
  gerencias: GerenciaRef[]
}
