import type { FormatoExportacion } from '../types/exportacion'

export interface OpcionFormato {
  formato: FormatoExportacion
  titulo: string
  descripcion: string
  icono: string
  color: string
  deshabilitado: boolean
  limite: number | null
}

const CATALOGO: Record<FormatoExportacion, Omit<OpcionFormato, 'formato' | 'deshabilitado' | 'limite'>> = {
  xlsx: { titulo: 'Excel', descripcion: 'Hoja de cálculo con números y fechas nativos', icono: 'tabler-file-type-xls', color: 'success' },
  csv: { titulo: 'CSV', descripcion: 'Texto separado por comas, para otros sistemas', icono: 'tabler-file-type-csv', color: 'info' },
  pdf: { titulo: 'PDF', descripcion: 'Listado para imprimir o compartir', icono: 'tabler-file-type-pdf', color: 'error' },
}

/** Formatos del reporte con su disponibilidad según el tamaño del conjunto y los topes del servidor. */
export function opcionesFormato(formatos: FormatoExportacion[], limites: Partial<Record<FormatoExportacion, number>>, totalFilas: number): OpcionFormato[] {
  return formatos
    .filter((f): f is FormatoExportacion => f in CATALOGO)
    .map(formato => {
      const limite = limites[formato] ?? null

      return {
        formato,
        ...CATALOGO[formato],
        limite,
        deshabilitado: limite !== null && totalFilas > limite,
      }
    })
}

/** Umbral a partir del cual se avisa que la exportación puede tardar. */
export const UMBRAL_AVISO_FILAS = 50_000

export function tamanoLegible(bytes: number | null): string {
  if (bytes === null || bytes === undefined)
    return ''
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(0)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
