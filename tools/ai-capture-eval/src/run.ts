/**
 * Corre la extracción sobre el dataset y mide contra la transcripción verificada.
 *
 * Uso: npm run eval -- [--model claude-opus-5-5] [--effort medium] [--dataset ./dataset] [--only 1350,1383] [--concurrency 3]
 * Resultados en results/<fecha>_<modelo>_<effort>/ (report.md, summary.json y un JSON por hoja).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import Anthropic from '@anthropic-ai/sdk'
import { loadDataset, truthAsExtraction } from './dataset'
import { type Effort, type ExtractionRun, extractSheet } from './extract'
import type { Extraction } from './schema'
import { type FieldResult, type Tally, groupOf, scoreSheet, tally } from './score'
import { type Finding, validateSequence, validateSheet } from './validate'

const { values } = parseArgs({
  options: {
    model: { type: 'string', default: 'claude-opus-5-5' },
    effort: { type: 'string', default: 'medium' },
    dataset: { type: 'string', default: './dataset' },
    only: { type: 'string' },
    concurrency: { type: 'string', default: '3' },
  },
})

if (existsSync('.env'))
  process.loadEnvFile('.env')

const model = values.model!
const effort = values.effort as Effort
const samples = loadDataset(values.dataset!, values.only?.split(','))
const runId = `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}_${model}_${effort}`
const outDir = join('results', runId)
mkdirSync(outDir, { recursive: true })

const client = new Anthropic()

interface SheetResult {
  id: string
  run: ExtractionRun
  fields: FieldResult[]
  tally: Tally
  findings: Finding[]
  truthFindings: Finding[]
}

async function processSample(s: (typeof samples)[number]): Promise<SheetResult> {
  const run = await extractSheet(client, s.imagePath, model, effort)
  const fields = run.extraction ? scoreSheet(s.truth, run.extraction) : []
  const result: SheetResult = {
    id: s.id,
    run,
    fields,
    tally: tally(fields),
    findings: run.extraction ? validateSheet(run.extraction) : [],
    truthFindings: validateSheet(truthAsExtraction(s.truth)),
  }
  writeFileSync(join(outDir, `${s.id}.json`), JSON.stringify(result, null, 2))
  const pct = result.tally.filled ? ((100 * result.tally.correct) / result.tally.filled).toFixed(1) : '—'
  console.log(`${s.id}: ${run.error ? `ERROR ${run.error}` : `${pct}% correctos, ${result.tally.hallucinated} inventados`} (${(run.latencyMs / 1000).toFixed(1)} s)`)

  return result
}

async function runAll(): Promise<SheetResult[]> {
  const queue = [...samples]
  const results: SheetResult[] = []
  const workers = Array.from({ length: Number(values.concurrency) }, async () => {
    for (let s = queue.shift(); s; s = queue.shift())
      results.push(await processSample(s))
  })
  await Promise.all(workers)

  return results.sort((a, b) => a.id.localeCompare(b.id))
}

const pct = (t: Tally) => (t.filled ? `${((100 * t.correct) / t.filled).toFixed(1)}%` : '—')

function sumTallies(list: Tally[]): Tally {
  return list.reduce((a, t) => ({
    filled: a.filled + t.filled,
    correct: a.correct + t.correct,
    wrong: a.wrong + t.wrong,
    omitted: a.omitted + t.omitted,
    hallucinated: a.hallucinated + t.hallucinated,
  }), { filled: 0, correct: 0, wrong: 0, omitted: 0, hallucinated: 0 })
}

function report(results: SheetResult[]): string {
  const ok = results.filter(r => !r.run.error)
  const total = sumTallies(ok.map(r => r.tally))
  const cost = ok.reduce((s, r) => s + (r.run.costUsd ?? 0), 0)
  const latency = ok.reduce((s, r) => s + r.run.latencyMs, 0) / Math.max(ok.length, 1) / 1000

  const groups = new Map<string, FieldResult[]>()
  for (const f of ok.flatMap(r => r.fields))
    groups.set(groupOf(f.path), [...(groups.get(groupOf(f.path)) ?? []), f])

  const errors = ok.flatMap(r => r.fields
    .filter(f => f.outcome === 'wrong' || f.outcome === 'omitted' || f.outcome === 'hallucinated')
    .map(f => `| ${r.id} | \`${f.path}\` | ${f.outcome} | ${JSON.stringify(f.expected)} | ${JSON.stringify(f.got)} |`))

  const seq = validateSequence(ok.map(r => ({ id: r.id, x: r.run.extraction as Extraction })))

  return [
    `# Evaluación ${runId}`,
    '',
    `- Modelo: \`${model}\` · effort: \`${effort}\` · hojas: ${results.length} (${results.length - ok.length} con error)`,
    `- **Campos correctos: ${pct(total)}** (${total.correct}/${total.filled} campos con dato)`,
    `- Mal leídos: ${total.wrong} · omitidos: ${total.omitted} · **inventados: ${total.hallucinated}**`,
    `- Costo: $${cost.toFixed(4)} USD total, $${(cost / Math.max(ok.length, 1)).toFixed(4)} por hoja · latencia promedio ${latency.toFixed(1)} s`,
    '',
    '## Por sección',
    '',
    '| Sección | Correctos | Mal | Omitidos | Inventados |',
    '|---|---|---|---|---|',
    ...[...groups].map(([g, fs]) => {
      const t = tally(fs)

      return `| ${g} | ${pct(t)} (${t.correct}/${t.filled}) | ${t.wrong} | ${t.omitted} | ${t.hallucinated} |`
    }),
    '',
    '## Por hoja',
    '',
    '| Hoja | Correctos | Inventados | Hallazgos de validación (IA / verdad) | Costo | Error |',
    '|---|---|---|---|---|---|',
    ...results.map(r => `| ${r.id} | ${pct(r.tally)} | ${r.tally.hallucinated} | ${r.findings.length} / ${r.truthFindings.length} | ${r.run.costUsd !== null ? `$${r.run.costUsd.toFixed(4)}` : '—'} | ${r.run.error ?? ''} |`),
    '',
    '## Validaciones sobre lo que leyó la IA',
    '',
    'Si la IA leyó bien, debe encontrar los mismos hallazgos que la transcripción verificada (errores reales del capturista).',
    '',
    ...ok.flatMap(r => r.findings.map(f => `- ${r.id} · [${f.rule}] \`${f.field}\`: ${f.message}`)),
    ...seq.map(f => `- [${f.rule}] ${f.message}`),
    '',
    '## Detalle de errores',
    '',
    '| Hoja | Campo | Tipo | Esperado | Leído |',
    '|---|---|---|---|---|',
    ...errors,
    '',
  ].join('\n')
}

const results = await runAll()
const md = report(results)
writeFileSync(join(outDir, 'report.md'), md)
writeFileSync(join(outDir, 'summary.json'), JSON.stringify({
  runId,
  model,
  effort,
  total: sumTallies(results.filter(r => !r.run.error).map(r => r.tally)),
  sheets: results.map(r => ({ id: r.id, tally: r.tally, costUsd: r.run.costUsd, latencyMs: r.run.latencyMs, error: r.run.error })),
}, null, 2))
console.log(`\nReporte: ${join(outDir, 'report.md')}`)
