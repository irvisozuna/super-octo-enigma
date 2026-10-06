/**
 * Clave estable a partir de un nombre: minúsculas, sin acentos, con guion bajo; empieza con letra.
 * Misma regla que el validador del servidor (`^[a-z][a-z0-9_]{1,78}$`).
 */
export function clavear(texto: string, prefijo = 'x'): string {
  const base = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)

  return /^\d/.test(base) ? `${prefijo}${base}` : base
}
