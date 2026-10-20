import type { ColumnaDef } from '../types/reporte'
import { aNumero, formatearValor } from './formato'

export interface EjemploRazon {
  numerador: { etiqueta: string; valor: string }
  denominador: { etiqueta: string; valor: string }
  resultado: string
}

/*
 * Ejemplo con los totales de la consulta para una columna cuyo total es una razón (porcentajes): "A ÷ B = C".
 * Sin totales de los dos operandos, o con denominador en cero, no hay ejemplo.
 */
export function ejemploRazon(
  columna: ColumnaDef,
  columnas: ColumnaDef[],
  totales: Record<string, number | string> | null | undefined,
): EjemploRazon | null {
  if (!columna.razon || !totales)
    return null
  const [num, den, factor] = columna.razon
  const a = aNumero(totales[num])
  const b = aNumero(totales[den])
  if (a === null || b === null || b === 0)
    return null

  const operando = (clave: string, valor: number) => {
    const def = columnas.find(c => c.columna === clave)

    return { etiqueta: def?.etiqueta ?? clave, valor: formatearValor(valor, def?.formato ?? 'decimal') }
  }

  return {
    numerador: operando(num, a),
    denominador: operando(den, b),
    resultado: formatearValor((a / b) * (factor || 1), columna.formato),
  }
}
