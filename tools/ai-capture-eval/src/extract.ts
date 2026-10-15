import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, USER_PROMPT } from './prompt'
import { type Extraction, extractionJsonSchema } from './schema'

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

export async function extractSheet(client: Anthropic, imagePath: string, model: string, effort: Effort): Promise<ExtractionRun> {
  const started = Date.now()
  const base: Omit<ExtractionRun, 'latencyMs'> = {
    extraction: null, error: null, stopReason: null, inputTokens: 0, outputTokens: 0, costUsd: null,
  }

  try {
    const message = await client.messages.stream({
      model,
      max_tokens: 32000,
      system: SYSTEM_PROMPT,
      output_config: {
        effort,
        format: { type: 'json_schema', schema: extractionJsonSchema },
      },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: loadImageAsJpeg(imagePath) } },
          { type: 'text', text: USER_PROMPT },
        ],
      }],
    }).finalMessage()

    const price = PRICES[model]
    const run: ExtractionRun = {
      ...base,
      stopReason: message.stop_reason,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      costUsd: price ? (message.usage.input_tokens * price.input + message.usage.output_tokens * price.output) / 1e6 : null,
      latencyMs: Date.now() - started,
    }

    if (message.stop_reason !== 'end_turn') {
      run.error = `stop_reason=${message.stop_reason}${message.stop_details ? ` (${JSON.stringify(message.stop_details)})` : ''}`

      return run
    }

    const text = message.content.find(b => b.type === 'text')
    if (!text || text.type !== 'text') {
      run.error = 'La respuesta no trae bloque de texto'

      return run
    }
    run.extraction = JSON.parse(text.text) as Extraction

    return run
  }
  catch (err) {
    return { ...base, error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - started }
  }
}
