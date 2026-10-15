/**
 * Esquema de extracción del "Reporte de Perforación Diamantina" (formato impreso CDK Drilling).
 *
 * Es un espejo LITERAL de la hoja: la IA transcribe lo que está escrito, no lo interpreta.
 * Mapear a IDs de catálogo, convertir turnos (A/1/Noche → day/night) o inferir am/pm
 * es responsabilidad del backend (fase 2), no del modelo.
 */

export interface Acero {
  diametro: string | null
  no_serie: string | null
  serie_color: string | null
  desde: number | null
  hasta: number | null
  nota: string | null
}

export interface Extraction {
  folio: string | null
  fecha: string | null
  turno: string | null
  horas_trabajadas: number | null
  faena: {
    centro_costo: string | null
    lugar: string | null
    equipo: string | null
    operador: string | null
    ayudante_1: string | null
    ayudante_2: string | null
    otro: string | null
  }
  pozo: {
    numero: string | null
    sector: string | null
    diametro: string | null
    inclinacion: number | null
    prof_inicial: number | null
    prof_final: number | null
    mts_perforados: number | null
  }
  parametros: { pull_down: number | null; rpm: number | null }
  horometro: { inicial: number | null; final: number | null; total_horas: number | null }
  consumos: Array<{ item: 'petroleo' | 'lubricantes' | 'aceites' | 'otros'; unidad: string | null; envase: string | null }>
  perforacion: Array<{
    desde: number | null
    hasta: number | null
    mts_perforados: number | null
    recuperacion: number | null
    tipo_roca: string | null
    dureza: string | null
  }>
  perforacion_totales: { mts_perforados: number | null; recuperacion: number | null }
  perforacion_notas: string[]
  actividades: Array<{
    desde: string | null
    hasta: string | null
    descripcion: string
    horas_cdk: number | null
    horas_cliente: number | null
  }>
  actividades_total_horas: number | null
  aceros: { broca: Acero[]; tricono: Acero[]; escareador: Acero[] }
  rebaje_herramientas: Array<{ acero: string | null; no_serie: string | null; patron_desgaste: string | null }>
  accesorios: Array<{ accesorio: string | null; cantidad: number | null; proveedor: string | null; observaciones: string | null }>
  casing: Array<{ diametro: string | null; desde: number | null; hasta: number | null; observaciones: string | null }>
  aditivos: Array<{ descripcion: string | null; cantidad: string | null }>
  firmas: { operador: string | null; supervision_firmado: boolean; cliente_firmado: boolean }
  observaciones: string | null
  campos_dudosos: Array<{ campo: string; valor_leido: string | null; motivo: string }>
}

const str = { type: ['string', 'null'] } as const
const num = { type: ['number', 'null'] } as const

function obj(properties: Record<string, unknown>) {
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false }
}

function arr(items: unknown) {
  return { type: 'array', items }
}

const acero = obj({ diametro: str, no_serie: str, serie_color: str, desde: num, hasta: num, nota: str })

/** JSON Schema para `output_config.format` (salida estructurada). */
export const extractionJsonSchema = obj({
  folio: str,
  fecha: str,
  turno: str,
  horas_trabajadas: num,
  faena: obj({ centro_costo: str, lugar: str, equipo: str, operador: str, ayudante_1: str, ayudante_2: str, otro: str }),
  pozo: obj({ numero: str, sector: str, diametro: str, inclinacion: num, prof_inicial: num, prof_final: num, mts_perforados: num }),
  parametros: obj({ pull_down: num, rpm: num }),
  horometro: obj({ inicial: num, final: num, total_horas: num }),
  consumos: arr(obj({ item: { type: 'string', enum: ['petroleo', 'lubricantes', 'aceites', 'otros'] }, unidad: str, envase: str })),
  perforacion: arr(obj({ desde: num, hasta: num, mts_perforados: num, recuperacion: num, tipo_roca: str, dureza: str })),
  perforacion_totales: obj({ mts_perforados: num, recuperacion: num }),
  perforacion_notas: arr({ type: 'string' }),
  actividades: arr(obj({ desde: str, hasta: str, descripcion: { type: 'string' }, horas_cdk: num, horas_cliente: num })),
  actividades_total_horas: num,
  aceros: obj({ broca: arr(acero), tricono: arr(acero), escareador: arr(acero) }),
  rebaje_herramientas: arr(obj({ acero: str, no_serie: str, patron_desgaste: str })),
  accesorios: arr(obj({ accesorio: str, cantidad: num, proveedor: str, observaciones: str })),
  casing: arr(obj({ diametro: str, desde: num, hasta: num, observaciones: str })),
  aditivos: arr(obj({ descripcion: str, cantidad: str })),
  firmas: obj({ operador: str, supervision_firmado: { type: 'boolean' }, cliente_firmado: { type: 'boolean' } }),
  observaciones: str,
  campos_dudosos: arr(obj({ campo: { type: 'string' }, valor_leido: str, motivo: { type: 'string' } })),
})
