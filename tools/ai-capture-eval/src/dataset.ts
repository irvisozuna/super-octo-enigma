import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import type { Extraction } from './schema'

export interface Sample {
  id: string
  imagePath: string
  truth: unknown
}

const IMAGE_EXT = new Set(['.heic', '.jpg', '.jpeg', '.png'])

/** dataset/truth/<id>.json  ↔  dataset/images/<id>.<heic|jpg|png> */
export function loadDataset(dir: string, only?: string[]): Sample[] {
  const truthDir = join(dir, 'truth')
  const imageDir = join(dir, 'images')
  if (!existsSync(truthDir))
    throw new Error(`No existe ${truthDir}. Revisa el README: el dataset real vive fuera del repo.`)

  const images = new Map(readdirSync(imageDir)
    .filter(f => IMAGE_EXT.has(extname(f).toLowerCase()))
    .map(f => [basename(f, extname(f)), join(imageDir, f)]))

  return readdirSync(truthDir)
    .filter(f => f.endsWith('.json'))
    .map(f => basename(f, '.json'))
    .filter(id => !only || only.includes(id))
    .map((id) => {
      const imagePath = images.get(id)
      if (!imagePath)
        throw new Error(`Falta la imagen de ${id} en ${imageDir}`)

      return { id, imagePath, truth: JSON.parse(readFileSync(join(truthDir, `${id}.json`), 'utf8')) }
    })
}

/** Resuelve los comodines de la verdad ($any → primera lectura, $skip → null) para poder validarla como una extracción. */
export function resolveTruth(value: unknown): unknown {
  if (Array.isArray(value))
    return value.map(resolveTruth)
  if (typeof value === 'object' && value !== null) {
    if ('$any' in value)
      return (value as { $any: unknown[] }).$any[0]
    if ('$skip' in value)
      return null

    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveTruth(v)]))
  }

  return value
}

export const truthAsExtraction = (truth: unknown) => resolveTruth(truth) as Extraction
