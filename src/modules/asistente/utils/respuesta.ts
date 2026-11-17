import type { Bloque, CifraChat, FuenteChat } from './markdown'
import { interpretarMarkdown } from './markdown'

/*
 * Partes de una respuesta para la tarjeta del diseño (XEL1-721): las cifras principales van arriba, la fuente en el
 * pie, las preguntas de seguimiento como botones y el resto (texto, tablas, gráficas) en el cuerpo.
 */
export interface PartesRespuesta {
  cifras: CifraChat[]
  cuerpo: Bloque[]
  fuentes: FuenteChat[]
  sugerencias: string[]
}

export function separarRespuesta(texto: string): PartesRespuesta {
  const partes: PartesRespuesta = { cifras: [], cuerpo: [], fuentes: [], sugerencias: [] }
  for (const b of interpretarMarkdown(texto)) {
    if (b.tipo === 'cifras')
      partes.cifras.push(...b.cifras)
    else if (b.tipo === 'fuente')
      partes.fuentes.push(b.fuente)
    else if (b.tipo === 'sugerencias')
      partes.sugerencias = b.sugerencias
    else
      partes.cuerpo.push(b)
  }
  partes.cifras = partes.cifras.slice(0, 3)

  return partes
}

/** Texto para copiar: sin bloques técnicos; las cifras y la fuente en palabras, las gráficas fuera. */
export function textoParaCopiar(texto: string): string {
  return texto
    .replace(/```cifra\n([\s\S]*?)```/g, (_, crudo: string) => {
      try {
        const datos = JSON.parse(crudo) as unknown
        const lista = (Array.isArray(datos) ? datos : [datos]) as { etiqueta?: string; valor?: string; detalle?: string }[]

        return lista.map(c => `${c.etiqueta ?? ''}: ${c.valor ?? ''}${c.detalle ? ` (${c.detalle})` : ''}`).join('\n')
      }
      catch {
        return ''
      }
    })
    .replace(/```fuente\n([\s\S]*?)```/g, (_, crudo: string) => {
      try {
        const f = JSON.parse(crudo) as { nombre?: string; filtros?: string; datos_al?: string }

        return `Fuente: ${[f.nombre, f.filtros, f.datos_al ? `datos al ${f.datos_al}` : ''].filter(Boolean).join(' · ')}`
      }
      catch {
        return ''
      }
    })
    .replace(/```(?:sugerencias|grafica)\n[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
