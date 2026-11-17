/* Documentos del asistente (XEL1-712): enlaces en las respuestas, nombre de archivo y descarga. */

const ENLACE = /\/asistente\/documentos\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi

/** Ids de los documentos enlazados en una respuesta, sin repetir y en orden. */
export function idsDocumentos(texto: string): string[] {
  return [...new Set([...texto.matchAll(ENLACE)].map(m => m[1].toLowerCase()))]
}

/** Nombre de archivo a partir del título: sin acentos ni signos, como lo arma el servidor. */
export function nombreArchivo(titulo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/³/g, '3')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '')

  return `${base || 'documento-asistente'}.html`
}

/** Descarga un HTML ya obtenido con la sesión del usuario. */
export function descargarHtml(html: string, nombre: string): void {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  const enlace = document.createElement('a')

  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
