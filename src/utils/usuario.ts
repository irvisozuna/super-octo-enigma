/* Nombre e iniciales del usuario de la sesión, para el saludo del asistente y el avatar (XEL1-721). */

const capitalizar = (p: string) => p.charAt(0).toLocaleUpperCase('es-MX') + p.slice(1).toLocaleLowerCase('es-MX')

/** Primer nombre con mayúscula inicial: "IRVIS OZUNA" → "Irvis", "admin" → "Admin". */
export function primerNombre(nombre: string | null | undefined): string {
  const primero = (nombre ?? '').trim().split(/\s+/)[0] ?? ''

  return primero ? capitalizar(primero) : ''
}

/** Iniciales para el avatar: "Irvis Ozuna" → "IO", "admin" → "AD". */
export function iniciales(nombre: string | null | undefined): string {
  const palabras = (nombre ?? '').trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0)
    return ''
  const letras = palabras.length > 1 ? palabras[0][0] + palabras[1][0] : palabras[0].slice(0, 2)

  return letras.toLocaleUpperCase('es-MX')
}
