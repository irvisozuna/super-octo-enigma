import { computed, ref } from 'vue'
import { obtenerJornada } from '../services/monitoreoApi'
import type { HuecoJornada, LecturaJornada, RespuestaJornada, TramoSinSenal } from '../types/jornada'
import { aFecha } from '../utils/tiempo'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/** Segmento de la línea de tiempo del día en porcentaje del eje (0–100). */
export interface SegmentoTiempo {
  tipo: 'lectura' | 'hueco' | 'sin_senal'
  inicio: number
  fin: number
  etiqueta: string
  anomalia?: boolean
  lejos?: boolean
  contrato?: number
  abierto?: boolean
}

function minutosDelDia(valor: string | null | undefined): number | null {
  const f = aFecha(valor)
  if (!f)
    return null
  const partes = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Mazatlan', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(f)
  const h = Number(partes.find(p => p.type === 'hour')?.value ?? 0) % 24
  const m = Number(partes.find(p => p.type === 'minute')?.value ?? 0)

  return h * 60 + m
}

/**
 * Convierte lecturas, huecos y tramos sin señal a segmentos sobre un eje de horas [desde, hasta] del día.
 * Lo que cae fuera del eje se recorta; lo que queda vacío se omite.
 */
export function segmentosLineaTiempo(lecturas: LecturaJornada[], huecos: HuecoJornada[], tramos: TramoSinSenal[], ejeDesde = 5, ejeHasta = 20): SegmentoTiempo[] {
  const ini = ejeDesde * 60
  const fin = ejeHasta * 60
  const pct = (min: number) => Math.max(0, Math.min(100, ((min - ini) / (fin - ini)) * 100))
  const out: SegmentoTiempo[] = []

  for (const h of huecos) {
    const a = minutosDelDia(h.desde)
    const b = minutosDelDia(h.hasta)
    if (a === null || b === null || b <= ini || a >= fin)
      continue
    out.push({ tipo: 'hueco', inicio: pct(a), fin: pct(b), etiqueta: `${h.desde.slice(11, 16)}–${h.hasta.slice(11, 16)} · ${h.minutos} min` })
  }
  for (const t of tramos) {
    const a = minutosDelDia(t.desde)
    const b = minutosDelDia(t.hasta)
    if (a === null || b === null || b <= ini || a >= fin)
      continue
    out.push({ tipo: 'sin_senal', inicio: pct(a), fin: pct(b), etiqueta: `${t.desde.slice(11, 16)}–${t.hasta.slice(11, 16)} · ${t.minutos} min`, abierto: t.abierto })
  }
  for (const l of lecturas) {
    const a = minutosDelDia(l.hora)
    if (a === null || a < ini || a > fin)
      continue
    out.push({ tipo: 'lectura', inicio: pct(a), fin: pct(a), etiqueta: `${l.hora.slice(11, 16)} · ${l.cuenta ?? ''}`, anomalia: l.anomalia !== null, lejos: l.lejos, contrato: l.contrato_id })
  }

  return out
}

/** Eje de horas que cubre la jornada y la actividad real del día. */
export function ejeHoras(jornada: { inicio: string; fin: string }, horas: (string | null | undefined)[]): { desde: number; hasta: number } {
  let desde = Number(jornada.inicio.slice(0, 2))
  let hasta = Number(jornada.fin.slice(0, 2)) + 1
  for (const h of horas) {
    const m = minutosDelDia(h)
    if (m === null)
      continue
    desde = Math.min(desde, Math.floor(m / 60))
    hasta = Math.max(hasta, Math.ceil((m + 1) / 60))
  }

  return { desde: Math.max(0, desde - 1), hasta: Math.min(24, hasta) }
}

/** Jornada de un lecturista en un día: lo que agregó el módulo, sus lecturas, su dispositivo y su promedio. Solo lectura. */
export function useJornada() {
  const datos = ref<RespuestaJornada | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)

  let controlador: AbortController | null = null

  const noVisible = computed(() => error.value?.codigo === 'NO_ENCONTRADO')

  // El eje cubre la jornada y las lecturas; el rastreo nocturno del teléfono no lo estira (la última señal va en su chip)
  const eje = computed(() => (datos.value ? ejeHoras(datos.value.parametros.jornada, [datos.value.jornada?.primera_lectura, datos.value.jornada?.ultima_lectura]) : { desde: 5, hasta: 15 }))
  const segmentos = computed(() => (datos.value ? segmentosLineaTiempo(datos.value.lecturas, datos.value.jornada?.huecos ?? [], datos.value.dispositivo.tramos_sin_senal, eje.value.desde, eje.value.hasta) : []))
  const atorado = computed(() => datos.value?.avisos.includes('atoradas') ?? false)
  const sinActividad = computed(() => !!datos.value && !datos.value.jornada && datos.value.dispositivo.sin_rastreo)

  async function cargar(lecturista: number, dia: string | null) {
    controlador?.abort()
    controlador = new AbortController()
    cargando.value = true
    error.value = null
    try {
      datos.value = await obtenerJornada(lecturista, dia, { signal: controlador.signal })
    }
    catch (e) {
      const n = normalizarError(e)
      if (n.codigo !== 'CANCELADO') {
        error.value = n
        datos.value = null
      }
    }
    finally {
      cargando.value = false
    }
  }

  function limpiar() {
    controlador?.abort()
    controlador = null
    datos.value = null
    error.value = null
  }

  return { datos, cargando, error, noVisible, eje, segmentos, atorado, sinActividad, cargar, limpiar }
}
