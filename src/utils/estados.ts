/*
 * Estados del negocio → token de color del tema (Aquasoft Design System 1.0).
 *
 * Cada estado se traduce a un nombre de color de Vuetify (semántico: primary, success… u operativo: toma-leida,
 * sector-rezagado, alerta-alta, senal-tarde…). Ese nombre sirve igual en `color="…"`, en las clases `bg-*`/`text-*`
 * y, a través de `useTokensTema().hex()`, en MapLibre y las gráficas. Sustituye a los 14 mapas de color que había
 * repartidos por Monitoreo y Reportes (cinco de ellos duplicados).
 *
 * Convención: `<token>` es el relleno (puntos del mapa, barras, fondo de chip sólido) y `<token>-darken-1` el texto del
 * mismo color sobre superficie clara (chips tonales, leyendas). Ambos cumplen AA (scripts/ds-contraste.mjs).
 */

// ------------------------------------------------------------------------------------------------ tomas (lecturas)

/** p pendiente · l leída · a con anomalía · x estimada (promedio automático) · f tarifa fija. */
export type EstadoToma = 'p' | 'l' | 'a' | 'x' | 'f'

export const TOKEN_TOMA: Record<EstadoToma, string> = {
  p: 'toma-pendiente',
  l: 'toma-leida',
  a: 'toma-anomalia',
  x: 'toma-estimada',
  f: 'toma-tarifa-fija',
}

/** Lectura tomada a más de la distancia permitida de la coordenada de la toma. */
export const TOKEN_TOMA_LEJOS = 'toma-lejos'

// ------------------------------------------------------------------------------------------------ sectores

export type EstadoSector = 'pendiente' | 'iniciado' | 'terminado' | 'rezagado' | 'sin_esperadas' | 'sin_datos'

export const TOKEN_SECTOR: Record<EstadoSector, string> = {
  pendiente: 'sector-pendiente',
  iniciado: 'sector-iniciado',
  terminado: 'sector-terminado',
  rezagado: 'sector-rezagado',
  sin_esperadas: 'sector-sin-esperadas',
  sin_datos: 'sector-sin-esperadas',
}

/** Color del avance de un sector o de una gerencia: terminado al 98 %, en meta desde 90 %. */
export function tokenAvance(pct: number | null | undefined, terminado = 98, enMeta = 90): string {
  if (pct === null || pct === undefined)
    return 'sector-pendiente'
  if (pct >= terminado)
    return 'success'
  if (pct >= enMeta)
    return 'warning'

  return 'primary'
}

// ------------------------------------------------------------------------------------------------ lecturistas

export type EstadoLecturista = 'activo' | 'silencio' | 'sin_iniciar' | 'terminado' | 'fuera_de_jornada'

export const TOKEN_LECTURISTA: Record<EstadoLecturista, string> = {
  activo: 'senal-reciente',
  silencio: 'senal-sin-reporte',
  sin_iniciar: 'senal-tarde',
  terminado: 'senal-termino',
  fuera_de_jornada: 'senal-sin-datos',
}

/** Señal del lecturista en el mapa según los minutos desde su último dato (misma regla que la alerta R3). */
export function tokenSenal(estado: string | null | undefined, minutos: number | null | undefined, silencioMin = 90): string {
  if (estado === 'terminado')
    return 'senal-termino'
  if (minutos === null || minutos === undefined)
    return 'senal-sin-datos'
  if (minutos < 10)
    return 'senal-reciente'
  if (minutos < silencioMin)
    return 'senal-tarde'

  return 'senal-sin-reporte'
}

/** Avance del lecturista contra su meta diaria: en meta desde 100 %, en camino desde 60 %. */
export function tokenMeta(pct: number | null | undefined): string {
  if (pct === null || pct === undefined)
    return 'secondary'
  if (pct >= 100)
    return 'success'
  if (pct >= 60)
    return 'primary'

  return 'warning'
}

// ------------------------------------------------------------------------------------------------ alertas

export type SeveridadAlerta = 'alta' | 'media' | 'aviso'
export type EstadoAlerta = 'abierta' | 'atendida' | 'silenciada' | 'cerrada'

export const TOKEN_SEVERIDAD: Record<SeveridadAlerta, string> = {
  alta: 'alerta-alta',
  media: 'alerta-media',
  aviso: 'alerta-aviso',
}

export const COLOR_ESTADO_ALERTA: Record<EstadoAlerta, string> = {
  abierta: 'primary',
  atendida: 'success',
  silenciada: 'secondary',
  cerrada: 'secondary',
}

// ------------------------------------------------------------------------------------------------ otros estados

export type EstadoRelectura = 'solicitada' | 'releida' | 'cancelada'

export const COLOR_RELECTURA: Record<EstadoRelectura, string> = { solicitada: 'warning', releida: 'success', cancelada: 'secondary' }

export type EstadoPropuesta = 'propuesta' | 'aceptada' | 'descartada' | 'aplicada'
export type ConfianzaPropuesta = 'alta' | 'media' | 'baja'

export const COLOR_PROPUESTA: Record<EstadoPropuesta, string> = { propuesta: 'warning', aceptada: 'success', descartada: 'secondary', aplicada: 'primary' }
export const COLOR_CONFIANZA: Record<ConfianzaPropuesta, string> = { alta: 'success', media: 'warning', baja: 'error' }

export type EstadoTarifaFija = 'completa' | 'generada' | 'pendiente' | 'faltante'

export const COLOR_TARIFA_FIJA: Record<EstadoTarifaFija, string> = { completa: 'success', generada: 'info', pendiente: 'secondary', faltante: 'error' }

export type EstadoExportacion = 'queued' | 'running' | 'done' | 'failed' | 'expired' | 'canceled'

export const COLOR_EXPORTACION: Record<EstadoExportacion, string> = { queued: 'info', running: 'primary', done: 'success', failed: 'error', expired: 'secondary', canceled: 'secondary' }

export type EstadoConvenio = 'pagado' | 'vencido' | 'vigente'

export const COLOR_CONVENIO: Record<string, string> = { pagado: 'success', vencido: 'error', vigente: 'warning' }

export const COLOR_ACTIVO: Record<string, string> = { active: 'success', activo: 'success', inactive: 'secondary', inactivo: 'secondary', pending: 'warning', pendiente: 'warning' }

/** Color de un estado genérico por nombre, con respaldo neutro. */
export function colorDe<T extends string>(mapa: Record<T, string>, estado: T | string | null | undefined, respaldo = 'secondary'): string {
  return (estado && (mapa as Record<string, string>)[estado]) || respaldo
}

// ------------------------------------------------------------------------------------------------ contratos (Soporte)

/** Estado del contrato en Aquasoft Comercial (texto del catálogo): activo en verde; cortado, suspendido o baja en rojo. */
export function colorEstadoContrato(estado: string | null | undefined): string {
  const s = (estado ?? '').toUpperCase()
  if (!s)
    return 'secondary'
  if (/CORT|SUSP|BAJA|CANCEL/.test(s))
    return 'error'
  if (/ACTIV|VIGEN/.test(s))
    return 'success'
  if (/PROVIS|TRAM|PEND/.test(s))
    return 'warning'

  return 'secondary'
}

/** Prioridad de una orden de trabajo (códigos de Aquasoft Comercial). */
export const COLOR_PRIORIDAD_ORDEN: Record<string, string> = { LOW: 'secondary', NORMAL: 'info', HIGH: 'warning', BLOCKING: 'error' }

/** Pago de un convenio: pagado (status 4), vencido (fecha límite pasada) o pendiente. */
export function colorPagoConvenio(status: number, vencido: boolean): string {
  return status === 4 ? 'success' : vencido ? 'error' : 'warning'
}

/** Estado de una orden de trabajo (ticket de Aquasoft Comercial, campo `fk_statut`). */
export const COLOR_ESTADO_ORDEN: Record<string, string> = { 0: 'warning', 1: 'info', 2: 'info', 3: 'primary', 5: 'warning', 7: 'warning', 8: 'success', 9: 'secondary' }
