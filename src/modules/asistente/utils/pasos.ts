import type { PasoChat, TipoDocumento } from '../types'

/*
 * Avance de una respuesta (XEL1-714): textos de cada paso y cómo se agrupan los repetidos. Solo depende del nombre de
 * la herramienta y del nombre del reporte o tablero que manda el servidor.
 */

interface Texto { enCurso: string; hecho: string }

const TEXTOS: Record<string, Texto> = {
  catalogo: { enCurso: 'Buscando el reporte indicado', hecho: 'Buscó el reporte indicado' },
  describir_reporte: { enCurso: 'Revisando columnas y filtros', hecho: 'Revisó columnas y filtros' },
  opciones_filtro: { enCurso: 'Revisando los filtros', hecho: 'Revisó los filtros' },
  consultar_reporte: { enCurso: 'Consultando el reporte', hecho: 'Consultó el reporte' },
  consultar_tablero: { enCurso: 'Consultando el tablero', hecho: 'Consultó el tablero' },
  monitoreo_resumen: { enCurso: 'Consultando el monitoreo de lecturas', hecho: 'Consultó el monitoreo de lecturas' },
  explicar_regla: { enCurso: 'Revisando las definiciones', hecho: 'Revisó las definiciones' },
  ficha_cuenta: { enCurso: 'Consultando la cuenta', hecho: 'Consultó la cuenta' },
}

/** Herramientas de preparación: no van en el resumen corto de lo que hizo. */
const PREPARACION = new Set(['catalogo', 'describir_reporte', 'opciones_filtro'])

const DOCUMENTO: Record<TipoDocumento | 'documento', string> = { presentacion: 'la presentación', informe: 'el informe', documento: 'el documento' }

export interface GrupoPasos {
  clave: string
  herramienta: string
  detalle?: string
  veces: number
  fallidos: number
  enCurso: boolean
  texto: string
  nota?: string
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Pasos agrupados por herramienta y reporte, en el orden en que aparecieron. */
export function agruparPasos(pasos: PasoChat[]): GrupoPasos[] {
  const grupos = new Map<string, { pasos: PasoChat[] }>()
  for (const paso of pasos) {
    const clave = paso.herramienta === 'generar_documento' ? `doc-${paso.id}` : `${paso.herramienta}|${paso.detalle ?? ''}`
    if (!grupos.has(clave))
      grupos.set(clave, { pasos: [] })
    grupos.get(clave)!.pasos.push(paso)
  }

  return [...grupos.entries()].map(([clave, { pasos: lista }]) => {
    const primero = lista[0]
    const enCurso = lista.some(p => p.estado === 'en_curso')
    const fallidos = lista.filter(p => p.estado === 'error').length
    const veces = lista.length
    const herramienta = primero.herramienta
    const detalle = lista.find(p => p.detalle)?.detalle
    let texto: string
    let nota: string | undefined

    if (herramienta === 'calcular') {
      texto = enCurso ? 'Calculando' : `Hizo ${plural(veces, 'cálculo', 'cálculos')}`
    }
    else if (herramienta === 'generar_documento') {
      const cual = DOCUMENTO[primero.tipo ?? 'documento']
      const secciones = primero.secciones ?? 0

      texto = enCurso ? `Redactando ${cual}` : `Armó ${cual}`
      if (enCurso && secciones > 0)
        nota = `Va en la sección ${secciones}`
    }
    else {
      const t = TEXTOS[herramienta] ?? { enCurso: 'Consultando', hecho: 'Consultó' }

      texto = enCurso ? t.enCurso : t.hecho
      if (veces > 1)
        nota = plural(veces, 'consulta', 'consultas')
    }
    if (fallidos > 0)
      nota = [nota, `${plural(fallidos, 'no se completó', 'no se completaron')} y se reintentó`].filter(Boolean).join(' · ')

    return { clave, herramienta, detalle, veces, fallidos, enCurso, texto, nota }
  })
}

/** Duración legible: «45 s», «1 min 12 s». */
export function duracion(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60)
    return `${s} s`
  const m = Math.floor(s / 60)

  return s % 60 ? `${m} min ${s % 60} s` : `${m} min`
}

/** Reloj mientras trabaja: «0:47». */
export function reloj(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Resumen de una línea al terminar: «Consultó Informe mensual por entidad (7 veces) · 9 cálculos · 1 min 12 s». */
export function resumenPasos(pasos: PasoChat[], duracionMs?: number): string {
  const partes = agruparPasos(pasos)
    .filter(g => !PREPARACION.has(g.herramienta))
    .map(g => {
      if (g.herramienta === 'calcular')
        return plural(g.veces, 'cálculo', 'cálculos')
      if (g.herramienta === 'generar_documento')
        return g.texto
      const base = g.detalle ? `Consultó ${g.detalle}` : g.texto

      return g.veces > 1 ? `${base} (${g.veces} veces)` : base
    })

  if (duracionMs !== undefined)
    partes.push(duracion(duracionMs))

  return partes.join(' · ')
}
