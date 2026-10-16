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
    tipo_sugerido?: string | null
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

/*
 * Formato "de cable": la salida estructurada admite máximo 16 campos con tipos unión (nullable),
 * así que el modelo responde todo como texto, con "" para casilla vacía. `fromWire()` lo convierte a `Extraction`.
 */
const str = { type: 'string' } as const
const num = { type: 'string', description: 'Número con punto decimal y sin unidades, o "" si la casilla está vacía' } as const

function obj(properties: Record<string, unknown>) {
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false }
}

function arr(items: unknown) {
  return { type: 'array', items }
}

const acero = obj({ diametro: str, no_serie: str, serie_color: str, desde: num, hasta: num, nota: str })

type Wire = Record<string, any>

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)

function number(v: unknown): number | null {
  const s = text(v)?.replace(',', '.')
  if (!s)
    return null
  const n = Number(s.replace(/[^\d.-]/g, ''))

  return Number.isFinite(n) ? n : null
}

const wireAcero = (a: Wire): Acero => ({
  diametro: text(a.diametro), no_serie: text(a.no_serie), serie_color: text(a.serie_color), desde: number(a.desde), hasta: number(a.hasta), nota: text(a.nota),
})

/** Convierte la respuesta del modelo (todo texto) al tipo `Extraction` con números y nulls. */
export function fromWire(w: Wire): Extraction {
  return {
    folio: text(w.folio),
    fecha: text(w.fecha),
    turno: text(w.turno),
    horas_trabajadas: number(w.horas_trabajadas),
    faena: Object.fromEntries(Object.entries(w.faena).map(([k, v]) => [k, text(v)])) as Extraction['faena'],
    pozo: {
      numero: text(w.pozo.numero),
      sector: text(w.pozo.sector),
      diametro: text(w.pozo.diametro),
      inclinacion: number(w.pozo.inclinacion),
      prof_inicial: number(w.pozo.prof_inicial),
      prof_final: number(w.pozo.prof_final),
      mts_perforados: number(w.pozo.mts_perforados),
    },
    parametros: { pull_down: number(w.parametros.pull_down), rpm: number(w.parametros.rpm) },
    horometro: { inicial: number(w.horometro.inicial), final: number(w.horometro.final), total_horas: number(w.horometro.total_horas) },
    consumos: w.consumos.map((c: Wire) => ({ item: c.item, unidad: text(c.unidad), envase: text(c.envase) })),
    perforacion: w.perforacion.map((r: Wire) => ({
      desde: number(r.desde), hasta: number(r.hasta), mts_perforados: number(r.mts_perforados), recuperacion: number(r.recuperacion), tipo_roca: text(r.tipo_roca), dureza: text(r.dureza),
    })),
    perforacion_totales: { mts_perforados: number(w.perforacion_totales.mts_perforados), recuperacion: number(w.perforacion_totales.recuperacion) },
    perforacion_notas: w.perforacion_notas.filter((n: string) => text(n)),
    actividades: w.actividades.map((a: Wire) => ({
      desde: text(a.desde), hasta: text(a.hasta), descripcion: a.descripcion, horas_cdk: number(a.horas_cdk), horas_cliente: number(a.horas_cliente), tipo_sugerido: text(a.tipo_sugerido),
    })),
    actividades_total_horas: number(w.actividades_total_horas),
    aceros: { broca: w.aceros.broca.map(wireAcero), tricono: w.aceros.tricono.map(wireAcero), escareador: w.aceros.escareador.map(wireAcero) },
    rebaje_herramientas: w.rebaje_herramientas.map((r: Wire) => ({ acero: text(r.acero), no_serie: text(r.no_serie), patron_desgaste: text(r.patron_desgaste) })),
    accesorios: w.accesorios.map((a: Wire) => ({ accesorio: text(a.accesorio), cantidad: number(a.cantidad), proveedor: text(a.proveedor), observaciones: text(a.observaciones) })),
    casing: w.casing.map((c: Wire) => ({ diametro: text(c.diametro), desde: number(c.desde), hasta: number(c.hasta), observaciones: text(c.observaciones) })),
    aditivos: w.aditivos.map((a: Wire) => ({ descripcion: text(a.descripcion), cantidad: text(a.cantidad) })),
    firmas: { operador: text(w.firmas.operador), supervision_firmado: w.firmas.supervision_firmado, cliente_firmado: w.firmas.cliente_firmado },
    observaciones: text(w.observaciones),
    campos_dudosos: w.campos_dudosos.map((d: Wire) => ({ campo: d.campo, valor_leido: text(d.valor_leido), motivo: d.motivo })),
  }
}

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
  actividades: arr(obj({ desde: str, hasta: str, descripcion: { type: 'string' }, horas_cdk: num, horas_cliente: num, tipo_sugerido: str })),
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
