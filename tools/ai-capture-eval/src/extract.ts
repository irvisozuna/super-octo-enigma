import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, USER_PROMPT } from './prompt'
import { checkJson, parseJsonReply } from './json-check'
import { type Extraction, extractionJsonSchema, fromWire } from './schema'

export type Effort = 'low' | 'medium' | 'high' | 'max'

/** USD por millón de tokens (entrada, salida). El thinking se cobra como salida. */
export const PRICES: Record<string, { input: number; output: number }> = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
}

export interface ExtractionRun {
  extraction: Extraction | null
  error: string | null
  stopReason: string | null
  inputTokens: number
  outputTokens: number
  costUsd: number | null
  latencyMs: number
}

const MAX_LONG_EDGE_PX = 2000

/**
 * Devuelve la imagen como JPEG en base64. Las fotos de iPhone llegan en HEIC, que la API no acepta;
 * para la evaluación se convierten con `sips` (macOS). En producción esto lo hará el backend.
 */
function loadImageAsJpeg(path: string): string {
  const ext = extname(path).toLowerCase()
  const tmp = join(mkdtempSync(join(tmpdir(), 'ai-capture-')), `${basename(path, ext)}.jpg`)
  try {
    execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', String(MAX_LONG_EDGE_PX), path, '--out', tmp], { stdio: 'ignore' })
  }
  catch {
    if (ext === '.jpg' || ext === '.jpeg')
      return readFileSync(path).toString('base64')
    throw new Error(`No se pudo convertir ${path} a JPEG (se necesita macOS/sips para ${ext}).`)
  }

  return readFileSync(tmp).toString('base64')
}

const MAX_ATTEMPTS = 2

export async function extractSheet(client: Anthropic, imagePath: string, model: string, effort: Effort): Promise<ExtractionRun> {
  const started = Date.now()
  const price = PRICES[model]
  const run: ExtractionRun = {
    extraction: null, error: null, stopReason: null, inputTokens: 0, outputTokens: 0, costUsd: null, latencyMs: 0,
  }
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: loadImageAsJpeg(imagePath) } },
      { type: 'text', text: USER_PROMPT },
    ],
  }]

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const message = await client.messages.stream({
        model,
        max_tokens: 32000,
        system: `${SYSTEM_PROMPT}\n\nResponde SOLO con un objeto JSON que cumpla este JSON Schema, sin texto adicional:\n${JSON.stringify(extractionJsonSchema)}`,
        output_config: { effort },
        messages,
      }).finalMessage()

      run.stopReason = message.stop_reason
      run.inputTokens += message.usage.input_tokens
      run.outputTokens += message.usage.output_tokens
      run.costUsd = price ? (run.inputTokens * price.input + run.outputTokens * price.output) / 1e6 : null

      if (message.stop_reason !== 'end_turn') {
        run.error = `stop_reason=${message.stop_reason}${message.stop_details ? ` (${JSON.stringify(message.stop_details)})` : ''}`
        break
      }

      const text = message.content.filter(b => b.type === 'text').map(b => (b.type === 'text' ? b.text : '')).join('')
      let problems: string[]
      let reply: unknown = null
      try {
        reply = parseJsonReply(text)
        problems = checkJson(extractionJsonSchema, reply)
      }
      catch (err) {
        problems = [err instanceof Error ? err.message : String(err)]
      }

      if (problems.length === 0) {
        run.extraction = fromWire(reply as Record<string, unknown>)
        run.error = null
        break
      }

      run.error = `JSON inválido (intento ${attempt}): ${problems.slice(0, 5).join('; ')}`
      messages.push(
        { role: 'assistant', content: message.content },
        { role: 'user', content: `El JSON no cumple el esquema: ${problems.slice(0, 20).join('; ')}. Corrígelo y responde solo con el JSON completo.` },
      )
    }
  }
  catch (err) {
    run.error = err instanceof Error ? err.message : String(err)
  }
  run.latencyMs = Date.now() - started

  return run
}
