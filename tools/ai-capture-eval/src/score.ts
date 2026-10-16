/**
 * Compara una extracción contra la transcripción verificada por una persona (ground truth).
 *
 * La verdad tiene la misma forma que `Extraction`, con dos comodines para cualquier valor:
 *   { "$any": ["Refugio Ibarra", "Refugio Ybarra"] }  → cualquiera de esas lecturas cuenta como correcta
 *   { "$skip": "ilegible" }                            → el campo no se califica
 */
import { parseClock } from './validate'

export type Outcome = 'correct' | 'wrong' | 'omitted' | 'hallucinated' | 'empty' | 'skipped'

export interface FieldResult {
  path: string
  outcome: Outcome
  expected: unknown
  got: unknown
}

const IGNORED_TOP = new Set(['campos_dudosos', '_meta'])
/** Sugerencias de la IA, no transcripción: no se califican contra la verdad. */
const IGNORED_ANY = new Set(['tipo_sugerido'])
const FREE_TEXT = /(descripcion|observaciones|perforacion_notas\[\d+\]|nota|operador|ayudante_\d|otro|accesorio)$/
const CLOCK = /^actividades\[\d+\]\.(desde|hasta)$/
const SIMILARITY_OK = 0.8

type Wildcard = { $any: unknown[] } | { $skip: string }

const isWildcard = (v: unknown): v is Wildcard =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && ('$any' in v || '$skip' in v)

const isEmpty = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

export function normalizeText(v: string): string {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** 1 − distancia de Levenshtein normalizada. */
export function similarity(a: string, b: string): number {
  if (a === b)
    return 1
  const m = a.length
  const n = b.length
  if (!m || !n)
    return 0
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }

  return 1 - prev[n] / Math.max(m, n)
}

function sameValue(path: string, expected: unknown, got: unknown): boolean {
  if (typeof expected === 'number' && typeof got === 'number')
    return Math.abs(expected - got) <= 0.01
  if (typeof expected === 'boolean')
    return expected === got
  if (typeof expected === 'string' && typeof got === 'string') {
    if (CLOCK.test(path))
      return parseClock(expected) !== null && parseClock(expected) === parseClock(got)
    const a = normalizeText(expected)
    const b = normalizeText(got)
    if (FREE_TEXT.test(path))
      return similarity(a, b) >= SIMILARITY_OK

    return a.replace(/ /g, '') === b.replace(/ /g, '')
  }

  return false
}

function leaf(path: string, expected: unknown, got: unknown, out: FieldResult[]) {
  if (isWildcard(expected)) {
    if ('$skip' in expected) {
      out.push({ path, outcome: 'skipped', expected, got })

      return
    }
    const ok = !isEmpty(got) && expected.$any.some(e => sameValue(path, e, got))
    out.push({ path, outcome: ok ? 'correct' : isEmpty(got) ? 'omitted' : 'wrong', expected, got })

    return
  }
  let outcome: Outcome
  if (isEmpty(expected))
    outcome = isEmpty(got) ? 'empty' : 'hallucinated'
  else if (isEmpty(got))
    outcome = 'omitted'
  else
    outcome = sameValue(path, expected, got) ? 'correct' : 'wrong'
  out.push({ path, outcome, expected, got })
}

function walk(path: string, expected: unknown, got: unknown, out: FieldResult[]) {
  if (Array.isArray(expected) || Array.isArray(got)) {
    const e = Array.isArray(expected) ? expected : []
    const g = Array.isArray(got) ? got : []
    for (let i = 0; i < Math.max(e.length, g.length); i++)
      walk(`${path}[${i}]`, e[i] ?? null, g[i] ?? null, out)

    return
  }
  const isObj = (v: unknown) => typeof v === 'object' && v !== null && !isWildcard(v)
  if (isObj(expected) || isObj(got)) {
    const e = (isObj(expected) ? expected : {}) as Record<string, unknown>
    const g = (isObj(got) ? got : {}) as Record<string, unknown>
    for (const key of new Set([...Object.keys(e), ...Object.keys(g)])) {
      if ((!path && IGNORED_TOP.has(key)) || IGNORED_ANY.has(key))
        continue
      walk(path ? `${path}.${key}` : key, e[key] ?? null, g[key] ?? null, out)
    }

    return
  }
  leaf(path, expected, got, out)
}

export function scoreSheet(truth: unknown, prediction: unknown): FieldResult[] {
  const out: FieldResult[] = []
  walk('', truth, prediction, out)

  return out
}

export interface Tally {
  filled: number
  correct: number
  wrong: number
  omitted: number
  hallucinated: number
}

export function tally(results: FieldResult[]): Tally {
  const t: Tally = { filled: 0, correct: 0, wrong: 0, omitted: 0, hallucinated: 0 }
  for (const r of results) {
    if (r.outcome === 'correct' || r.outcome === 'wrong' || r.outcome === 'omitted')
      t.filled++
    if (r.outcome !== 'empty' && r.outcome !== 'skipped')
      t[r.outcome]++
  }

  return t
}

/** "pozo.prof_inicial" → "pozo"; "actividades[3].horas_cdk" → "actividades". */
export const groupOf = (path: string) => path.split(/[.[]/)[0]
