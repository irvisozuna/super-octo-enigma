/** Gerencia (entidad de Aquasoft Comercial) tal como la muestra el módulo. */
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

  /** Catálogo de Aquasoft Comercial; vacío cuando no respondió (ver `aviso`). */
  gerencias: Gerencia[]
  aviso: string | null
}

/** PUT /monitoring/admin/alcances/{user} */
export interface RespuestaActualizarAlcance {
  usuario: string
  gerencias: GerenciaRef[]
}

/** GET /monitoring/sync: hasta dónde llegan los datos replicados. Fechas en hora local de OOMSAPAS ("Y-m-d H:i:s") salvo `ultima_corrida` (ISO). */
export interface RespuestaSync {
  periodo_abierto: { id: number; nombre: string; inicio: string | null; fin: string | null } | null
  ultima_corrida: string | null
  ultima_lectura_recibida: string | null
  ultima_captura: string | null
  ultimo_rastreo: string | null
  sincronizadores: { clave: string; ultima_corrida: string | null; filas: number | null; ms: number | null; marca: number; error: string | null }[]
  conteos: { lecturas_periodo_abierto: number; contratos: number; rastreo: number }
}

/** GET /monitoring/configuracion: parámetros del módulo (solo se usan los efectivos en el monitor). */
export interface RespuestaConfiguracion {
  tipos: Record<string, string>
  defaults: Record<string, unknown>
  global: Record<string, unknown>
  por_gerencia: Record<string, Record<string, unknown>>
  efectivos: Record<string, unknown> & { quiosco_rotacion_s?: number; silencio_min?: number; meta_diaria?: number; distancia_m?: number }
  puede_editar: boolean
}
