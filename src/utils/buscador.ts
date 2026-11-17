/*
 * Qué busca el buscador de la barra superior según los permisos de cada usuario (XEL1-722). Solo aparece a quien
 * tiene algo que buscar y su texto dice exactamente qué busca, para que nadie lo use para algo que no encuentra.
 */

export interface PermisosBuscador {

  /** Soporte (`read supports`): abrir una cuenta por su número. */
  cuentas: boolean

  /** Reportes (`read reportes`): reportes y tableros que el usuario puede ver. */
  reportes: boolean

  /** Asistente (`use asistente`): sus conversaciones y preguntarle. */
  asistente: boolean
}

export function buscadorVisible(p: PermisosBuscador): boolean {
  return p.cuentas || p.reportes || p.asistente
}

/** "Buscar cuentas, reportes, conversaciones o ayuda", con solo lo que el usuario puede buscar. */
export function textoBuscador(p: PermisosBuscador): string {
  const partes = [
    p.cuentas ? 'cuentas' : '',
    p.reportes ? 'reportes' : '',
    p.asistente ? 'conversaciones' : '',
    p.asistente ? 'ayuda' : '',
  ].filter(Boolean)

  if (partes.length === 0)
    return 'Buscar'
  if (partes.length === 1)
    return `Buscar ${partes[0]}`

  return `Buscar ${partes.slice(0, -1).join(', ')} o ${partes.at(-1)}`
}

/** Número de cuenta: empieza con dígito; solo dígitos y guiones; de 3 a 20 caracteres. */
export function pareceCuenta(texto: string): boolean {
  return /^\d[\d-]{2,19}$/.test(texto.trim())
}
