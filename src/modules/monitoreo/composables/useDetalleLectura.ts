import { computed, ref } from 'vue'
import { obtenerDetalleLectura, obtenerHistorialContrato } from '../services/monitoreoApi'
import type { HistorialLectura, RespuestaDetalleLectura } from '../types/lectura'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'
import { generarDocumento } from '@/modules/reportes/services/reportesApi'

/** Fila del historial ya normalizada para la tabla y la mini gráfica. */
export interface FilaHistorial {
  periodoId: number
  periodo: string
  fecha: string | null
  anomalia: string | null
  lecturista: string | null
  anterior: number | null
  actual: number | null
  consumo: number | null
}

function numero(v: unknown): number | null {
  if (v === null || v === undefined || v === '')
    return null
  const n = Number(v)

  return Number.isFinite(n) ? n : null
}

/** Normaliza el historial de Support (nombres de Aquasoft Comercial) y lo ordena del periodo más reciente al más viejo. */
export function normalizarHistorial(filas: HistorialLectura[]): FilaHistorial[] {
  return filas
    .map(f => ({
      periodoId: Number(f.periodoDeFacturacionID) || 0,
      periodo: String(f.Periodo ?? '').trim(),
      fecha: f.Fecha ?? null, // ya viene formateada por Aquasoft Comercial (dd/mm/aaaa)
      anomalia: f.Anomalia && f.Anomalia !== 'LECTURA REAL' ? f.Anomalia : null,
      lecturista: f.Lecturista ?? null,
      anterior: numero(f.Anterior),
      actual: numero(f.Actual),
      consumo: numero(f.Consumo),
    }))
    .sort((a, b) => b.periodoId - a.periodoId)
}

function base64ABlob(base64: string, mime: string): Blob {
  const binario = atob(base64)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++)
    bytes[i] = binario.charCodeAt(i)

  return new Blob([bytes], { type: mime })
}

/**
 * Detalle de la lectura de una toma: el detalle del módulo (réplica), el historial de Support (Aquasoft Comercial) y el
 * duplicado de recibo del módulo de reportes. Todo de solo lectura.
 */
export function useDetalleLectura() {
  const detalle = ref<RespuestaDetalleLectura | null>(null)
  const historial = ref<FilaHistorial[]>([])
  const cargando = ref(false)
  const cargandoHistorial = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const errorHistorial = ref<ErrorReporte | null>(null)
  const generandoDuplicado = ref(false)
  const errorDuplicado = ref<ErrorReporte | null>(null)
  const duplicadoBloqueado = ref<string | null>(null)

  let controlador: AbortController | null = null

  const noVisible = computed(() => error.value?.codigo === 'NO_ENCONTRADO')
  const lectura = computed(() => detalle.value?.lectura ?? null)
  const contrato = computed(() => detalle.value?.contrato ?? null)

  /** Consumos del historial del más viejo al más reciente, para la mini gráfica. */
  const serieConsumo = computed(() => [...historial.value].reverse().map(f => ({ periodo: f.periodo, consumo: f.consumo ?? 0, anomalia: f.anomalia !== null })))

  async function cargar(contratoId: number, periodoId: number | null) {
    controlador?.abort()
    controlador = new AbortController()

    const signal = controlador.signal

    cargando.value = true
    cargandoHistorial.value = true
    error.value = null
    errorHistorial.value = null
    errorDuplicado.value = null
    duplicadoBloqueado.value = null
    detalle.value = null
    historial.value = []

    const promesaDetalle = obtenerDetalleLectura(contratoId, periodoId, { signal })
      .then(d => {
        detalle.value = d
      })
      .catch(e => {
        const n = normalizarError(e)
        if (n.codigo !== 'CANCELADO')
          error.value = n
      })
      .finally(() => {
        cargando.value = false
      })

    const promesaHistorial = obtenerHistorialContrato(contratoId, 12, { signal })
      .then(h => {
        historial.value = normalizarHistorial(h.data ?? [])
      })
      .catch(e => {
        const n = normalizarError(e)
        if (n.codigo !== 'CANCELADO')
          errorHistorial.value = n
      })
      .finally(() => {
        cargandoHistorial.value = false
      })

    await Promise.all([promesaDetalle, promesaHistorial])
  }

  /** Genera el duplicado de recibo y lo abre en una pestaña nueva; si el navegador la bloquea, deja la URL a mano. */
  async function abrirDuplicado(): Promise<boolean> {
    const c = contrato.value
    const p = detalle.value?.periodo
    if (!c || !p)
      return false
    generandoDuplicado.value = true
    errorDuplicado.value = null
    duplicadoBloqueado.value = null
    try {
      const generado = await generarDocumento('duplicado_recibo', { contrato: c.cuenta, periodo: p.id })
      const url = URL.createObjectURL(base64ABlob(generado.pdf_base64, generado.mime))

      // Sin 'noopener': con esa opción window.open devuelve null aunque abra, y no se distinguiría el bloqueo. El blob es propio.
      const ventana = window.open(url, '_blank')
      if (!ventana)
        duplicadoBloqueado.value = url

      return !!ventana
    }
    catch (e) {
      const n = normalizarError(e)
      if (n.codigo !== 'CANCELADO')
        errorDuplicado.value = n

      return false
    }
    finally {
      generandoDuplicado.value = false
    }
  }

  function limpiar() {
    controlador?.abort()
    controlador = null
    detalle.value = null
    historial.value = []
    error.value = null
    errorHistorial.value = null
    errorDuplicado.value = null
    duplicadoBloqueado.value = null
  }

  return {
    detalle,
    historial,
    lectura,
    contrato,
    serieConsumo,
    cargando,
    cargandoHistorial,
    error,
    errorHistorial,
    noVisible,
    generandoDuplicado,
    errorDuplicado,
    duplicadoBloqueado,
    cargar,
    abrirDuplicado,
    limpiar,
  }
}
