/** GET/POST/PUT/DELETE /monitoring/admin/destinatarios — destinatarios de los canales de alerta (F2.3). */

export type CanalDestinatario = 'campana' | 'correo_alta' | 'resumen' | 'escalamiento'

export interface Destinatario {
  id: string
  usuario_id: string | null
  usuario: string | null
  email: string | null
  nombre: string | null
  gerencia_id: number | null
  canales: CanalDestinatario[]
  activo: boolean
}

export interface EdicionDestinatario {
  usuario_id: string | null
  email: string
  nombre: string
  gerencia_id: number | null
  canales: CanalDestinatario[]
  activo: boolean
}

export interface RespuestaDestinatarios {
  destinatarios: Destinatario[]
  usuarios: { id: string; nombre: string; email: string | null }[]
  canales: CanalDestinatario[]
}
