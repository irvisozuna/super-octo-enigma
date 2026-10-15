/**
 * Validador mínimo de JSON Schema (type, properties, required, additionalProperties, items, enum).
 * La salida estructurada de la API no compila un esquema del tamaño de esta hoja ("compiled grammar is too large"),
 * así que el esquema va en el prompt y la respuesta se valida aquí.
 */
type Schema = { type?: string; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: boolean; items?: Schema; enum?: unknown[] }

export function checkJson(input: object, value: unknown, path = '$'): string[] {
  const schema = input as Schema
  const errors: string[] = []
  const typeOk: Record<string, (v: unknown) => boolean> = {
    object: v => typeof v === 'object' && v !== null && !Array.isArray(v),
    array: Array.isArray,
    string: v => typeof v === 'string',
    boolean: v => typeof v === 'boolean',
  }
  if (schema.type && !typeOk[schema.type]?.(value))
    return [`${path}: se esperaba ${schema.type}`]
  if (schema.enum && !schema.enum.includes(value))
    errors.push(`${path}: valor fuera de ${JSON.stringify(schema.enum)}`)
  if (schema.type === 'object') {
    const obj = value as Record<string, unknown>
    for (const key of schema.required ?? []) {
      if (!(key in obj))
        errors.push(`${path}.${key}: falta`)
    }
    for (const [key, v] of Object.entries(obj)) {
      const sub = schema.properties?.[key]
      if (sub)
        errors.push(...checkJson(sub, v, `${path}.${key}`))
      else if (schema.additionalProperties === false)
        errors.push(`${path}.${key}: campo no esperado`)
    }
  }
  if (schema.type === 'array' && schema.items)
    (value as unknown[]).forEach((v, i) => errors.push(...checkJson(schema.items as Schema, v, `${path}[${i}]`)))

  return errors
}

/** Saca el objeto JSON de la respuesta aunque venga entre ```json ... ```. */
export function parseJsonReply(text: string): unknown {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start)
    throw new Error('La respuesta no contiene un objeto JSON')

  return JSON.parse(text.slice(start, end + 1))
}
