/**
 * Reglas de negocio que la hoja trae "gratis": los datos se cruzan entre sí, así que un error
 * de lectura de la IA o un error del capturista en campo se nota sin mirar la foto.
 * En fase 2 estas mismas reglas viven en el backend y marcan campos en la pantalla de revisión.
 */
import type { Extraction } from './schema'

export interface Finding {
  rule: string
  field: string
  message: string
}

const TOL = 0.01

const differs = (a: number, b: number) => Math.abs(a - b) > TOL

/** "7:00", "07:00", "7.00", "7:0", "12:00" → minutos desde las 0:00 de un reloj de 12 horas. */
export function parseClock(value: string | null): number | null {
  if (!value)
    return null
  const m = value.trim().match(/^(\d{1,2})[:.](\d{1,2})$/)
  if (!m)
    return null
  const h = Number(m[1]) % 12
  const min = Number(m[2].padEnd(2, '0'))

  return h * 60 + min
}

/** Duración entre dos horas escritas sin am/pm. El turno es de 12 h, así que se cuenta módulo 12 h. */
export function durationHours(desde: string | null, hasta: string | null): number | null {
  const a = parseClock(desde)
  const b = parseClock(hasta)
  if (a === null || b === null)
    return null

  return ((b - a + 720) % 720) / 60
}

export function validateSheet(x: Extraction): Finding[] {
  const out: Finding[] = []
  const add = (rule: string, field: string, message: string) => out.push({ rule, field, message })
  const { prof_inicial: ini, prof_final: fin, mts_perforados: mts } = x.pozo

  if (ini !== null && fin !== null && mts !== null && differs(fin - ini, mts))
    add('profundidad', 'pozo.mts_perforados', `Prof. final − inicial = ${fin - ini}, pero dice ${mts} m perforados`)

  const rows = x.perforacion
  if (rows.length > 0) {
    const sum = rows.reduce((s, r) => s + (r.mts_perforados ?? 0), 0)
    if (mts !== null && differs(sum, mts))
      add('perforacion-suma', 'perforacion', `Las corridas suman ${sum} m, pero dice ${mts} m perforados`)
    if (ini !== null && rows[0].desde !== null && differs(rows[0].desde, ini))
      add('perforacion-continuidad', 'perforacion[0].desde', `La primera corrida empieza en ${rows[0].desde}, la prof. inicial es ${ini}`)
    const last = rows[rows.length - 1]
    if (fin !== null && last.hasta !== null && differs(last.hasta, fin))
      add('perforacion-continuidad', `perforacion[${rows.length - 1}].hasta`, `La última corrida termina en ${last.hasta}, la prof. final es ${fin}`)
    rows.forEach((r, i) => {
      if (r.desde !== null && r.hasta !== null && r.mts_perforados !== null && differs(r.hasta - r.desde, r.mts_perforados))
        add('perforacion-renglon', `perforacion[${i}]`, `${r.desde}→${r.hasta} son ${r.hasta - r.desde} m, pero dice ${r.mts_perforados}`)
      const next = rows[i + 1]
      if (next && r.hasta !== null && next.desde !== null && differs(r.hasta, next.desde))
        add('perforacion-continuidad', `perforacion[${i + 1}].desde`, `Hueco o traslape: ${r.hasta} → ${next.desde}`)
    })
  }

  const acts = x.actividades
  if (acts.length > 0) {
    let sum = 0
    acts.forEach((a, i) => {
      const written = (a.horas_cdk ?? 0) + (a.horas_cliente ?? 0)
      sum += written
      const byClock = durationHours(a.desde, a.hasta)
      if (byClock !== null && differs(byClock, written))
        add('actividad-horas', `actividades[${i}]`, `${a.desde}–${a.hasta} son ${byClock} h, pero anotaron ${written} h`)
      const next = acts[i + 1]
      if (next && a.hasta && next.desde && parseClock(a.hasta) !== parseClock(next.desde))
        add('actividad-continuidad', `actividades[${i + 1}].desde`, `Hueco o traslape: ${a.hasta} → ${next.desde}`)
    })
    if (x.horas_trabajadas !== null && differs(sum, x.horas_trabajadas))
      add('horas-total', 'actividades', `Las actividades suman ${sum} h, pero las horas trabajadas son ${x.horas_trabajadas}`)
    if (x.actividades_total_horas === null)
      add('horas-total', 'actividades_total_horas', 'El total de horas está en blanco')
  }

  const { inicial, final } = x.horometro
  if (inicial !== null && final !== null && final < inicial)
    add('horometro', 'horometro.final', `El horómetro final (${final}) es menor que el inicial (${inicial})`)

  for (const [kind, list] of Object.entries(x.aceros)) {
    list.forEach((a, i) => {
      if (a.desde !== null && a.hasta !== null && a.hasta < a.desde)
        add('aceros', `aceros.${kind}[${i}]`, `Hasta (${a.hasta}) menor que desde (${a.desde})`)
    })
  }

  return out
}

/**
 * Reglas entre hojas del mismo pozo: la prof. inicial de un turno debe ser la prof. final del turno anterior.
 * El orden dentro del mismo día se toma del folio, que es una aproximación: en producción se ordenará por fecha y turno.
 */
export function validateSequence(sheets: Array<{ id: string; x: Extraction }>): Finding[] {
  const out: Finding[] = []
  const byWell = new Map<string, Array<{ id: string; x: Extraction }>>()
  for (const s of sheets) {
    const key = normalizeWell(s.x.pozo.numero)
    if (!key)
      continue
    byWell.set(key, [...(byWell.get(key) ?? []), s])
  }
  for (const [well, list] of byWell) {
    list.sort((a, b) => (a.x.pozo.prof_inicial ?? 0) - (b.x.pozo.prof_inicial ?? 0))
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1].x.pozo.prof_final
      const cur = list[i].x.pozo.prof_inicial
      if (prev !== null && cur !== null && differs(prev, cur)) {
        out.push({
          rule: 'secuencia-pozo',
          field: `${list[i].id}.pozo.prof_inicial`,
          message: `Pozo ${well}: la hoja ${list[i - 1].id} termina en ${prev} y la ${list[i].id} empieza en ${cur} (¿falta una hoja?)`,
        })
      }
    }
  }

  return out
}

/** "VP026-14A", "VPO 26-14A", "VPO-26-14-A" → "VPO2614A". La "0" después de "VP" se lee como "O". */
export function normalizeWell(value: string | null): string | null {
  if (!value)
    return null

  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^VP0/, 'VPO')
}
