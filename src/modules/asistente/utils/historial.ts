import type { ConversacionResumen } from '../types'

/* Historial agrupado por fecha (XEL1-721): Hoy, Ayer, Esta semana y Anteriores, con la hora o la fecha corta. */

export interface ConversacionEnGrupo extends ConversacionResumen {
  cuando: string
}

export interface GrupoConversaciones {
  titulo: string
  conversaciones: ConversacionEnGrupo[]
}

const DIA = 86_400_000

function inicioDelDia(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
}

const hora = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
const fechaCorta = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

export function agruparConversaciones(lista: ConversacionResumen[], ahora: Date = new Date()): GrupoConversaciones[] {
  const hoy = inicioDelDia(ahora)
  const grupos: Record<string, ConversacionEnGrupo[]> = { 'Hoy': [], 'Ayer': [], 'Esta semana': [], 'Anteriores': [] }

  for (const c of lista) {
    const fecha = c.actualizada ? new Date(c.actualizada) : null
    if (!fecha || Number.isNaN(fecha.getTime())) {
      grupos.Anteriores.push({ ...c, cuando: '' })
      continue
    }
    const dia = inicioDelDia(fecha)
    const titulo = dia >= hoy ? 'Hoy' : dia >= hoy - DIA ? 'Ayer' : dia >= hoy - 6 * DIA ? 'Esta semana' : 'Anteriores'
    const cuando = titulo === 'Hoy' ? hora.format(fecha) : fechaCorta.format(fecha).replace('.', '')

    grupos[titulo].push({ ...c, cuando })
  }

  return Object.entries(grupos).filter(([, c]) => c.length).map(([titulo, conversaciones]) => ({ titulo, conversaciones }))
}
