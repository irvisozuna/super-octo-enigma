/**
 * Revisa el dataset sin llamar a la IA:
 *  1. que cada transcripción tenga la forma del esquema (autocomparación = 100%),
 *  2. qué reglas de negocio fallan en las hojas reales (errores del capturista en campo).
 *
 * Uso: npm run check-truth -- [--dataset ./dataset]
 */
import { parseArgs } from 'node:util'
import { loadDataset, truthAsExtraction } from './dataset'
import { extractionJsonSchema } from './schema'
import { scoreSheet, tally } from './score'
import { validateSequence, validateSheet } from './validate'

const { values } = parseArgs({ options: { dataset: { type: 'string', default: './dataset' } } })
const samples = loadDataset(values.dataset!)
const topKeys = Object.keys(extractionJsonSchema.properties)
let problems = 0

for (const s of samples) {
  const x = truthAsExtraction(s.truth)
  const missing = topKeys.filter(k => !(k in (x as object)))
  const self = tally(scoreSheet(s.truth, x))
  if (missing.length || self.correct !== self.filled) {
    problems++
    console.log(`✗ ${s.id}: faltan campos [${missing.join(', ')}] o la autocomparación no da 100% (${self.correct}/${self.filled})`)
  }
  const findings = validateSheet(x)
  console.log(`\n${s.id} (${self.filled} campos con dato) — ${findings.length ? `${findings.length} hallazgos` : 'sin hallazgos'}`)
  for (const f of findings)
    console.log(`  · [${f.rule}] ${f.field}: ${f.message}`)
}

const seq = validateSequence(samples.map(s => ({ id: s.id, x: truthAsExtraction(s.truth) })))
console.log(`\nSecuencia entre hojas — ${seq.length ? `${seq.length} hallazgos` : 'sin hallazgos'}`)
for (const f of seq)
  console.log(`  · ${f.message}`)

process.exitCode = problems ? 1 : 0
