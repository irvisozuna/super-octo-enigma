import { describe, expect, it } from 'vitest'
import type { ColumnaDef } from '../types/reporte'
import { ejemploRazon } from '../utils/ayuda'

const col = (columna: string, etiqueta: string, formato: ColumnaDef['formato'], extra: Partial<ColumnaDef> = {}): ColumnaDef =>
  ({ columna, etiqueta, tipo: 'decimal', formato, alineacion: 'end', visible: true, total: true, ...extra })

const cobrado = col('DOM_COBRADO', 'Doméstico cobrado', 'moneda')
const facturado = col('DOM_FACTURADO', 'Doméstico facturación', 'moneda')
const eficiencia = col('DOM_EFICIENCIA', '% eficiencia doméstica', 'porcentaje', { razon: ['DOM_COBRADO', 'DOM_FACTURADO', 100] })
const todas = [facturado, cobrado, eficiencia]

describe('ejemploRazon', () => {
  it('arma "A ÷ B = C" con los totales y las etiquetas de los operandos', () => {
    expect(ejemploRazon(eficiencia, todas, { DOM_COBRADO: '4929044.72', DOM_FACTURADO: 15925958.8 })).toEqual({
      numerador: { etiqueta: 'Doméstico cobrado', valor: '$4,929,044.72' },
      denominador: { etiqueta: 'Doméstico facturación', valor: '$15,925,958.80' },
      resultado: '30.95 %',
    })
  })

  it('no hay ejemplo sin razón, sin totales o con denominador en cero', () => {
    expect(ejemploRazon(cobrado, todas, { DOM_COBRADO: 1 })).toBeNull()
    expect(ejemploRazon(eficiencia, todas, null)).toBeNull()
    expect(ejemploRazon(eficiencia, todas, { DOM_COBRADO: 1 })).toBeNull()
    expect(ejemploRazon(eficiencia, todas, { DOM_COBRADO: 1, DOM_FACTURADO: 0 })).toBeNull()
  })
})
