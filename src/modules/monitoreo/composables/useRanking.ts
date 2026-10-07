import { computed, reactive, ref } from 'vue'
import { descargarRanking, obtenerRanking } from '../services/monitoreoApi'
import type { FilaRanking, FiltrosRanking, RespuestaRanking } from '../types/ranking'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/** Parámetros para la API: solo lo que tiene valor. */
export function parametrosRanking(f: FiltrosRanking): Record<string, string | number> {
  const p: Record<string, string | number> = {}
  if (f.periodo)
    p.periodo = f.periodo
  if (f.gerencia)
    p.gerencia = f.gerencia
  if (f.desde)
    p.desde = f.desde
  if (f.hasta)
    p.hasta = f.hasta

  return p
}

/** Texto de la comparación con el promedio propio: flecha y diferencia, o "sin referencia". */
export function comparacion(fila: FilaRanking, clave: 'lecturas_dia' | 'lecturas_hora' | 'min_muertos_dia'): { flecha: 'arriba' | 'abajo' | 'igual' | null; texto: string; mejor: boolean | null } {
  const d = fila.delta?.[clave]
  if (!fila.referencia || d === null || d === undefined)
    return { flecha: null, texto: '', mejor: null }

  // En minutos muertos, menos es mejor
  const mejor = clave === 'min_muertos_dia' ? d < 0 : d > 0
  const flecha = d === 0 ? 'igual' : d > 0 ? 'arriba' : 'abajo'
  const texto = d === 0 ? '=' : `${d > 0 ? '+' : ''}${d}`

  return { flecha, texto, mejor: d === 0 ? null : mejor }
}

export function useRanking() {
  const filtros = reactive<FiltrosRanking>({ periodo: null, gerencia: null, desde: null, hasta: null })
  const datos = ref<RespuestaRanking | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const exportando = ref<'xlsx' | 'pdf' | null>(null)
  const errorExportacion = ref<ErrorReporte | null>(null)

  let controlador: AbortController | null = null

  const filas = computed(() => datos.value?.filas ?? [])
  const totales = computed(() => datos.value?.totales ?? null)

  async function cargar() {
    controlador?.abort()
    controlador = new AbortController()
    cargando.value = true
    try {
      datos.value = await obtenerRanking(parametrosRanking(filtros), { signal: controlador.signal })
      error.value = null

      // El servidor acota el rango al periodo: se refleja en los filtros
      if (datos.value.periodo) {
        filtros.periodo = datos.value.periodo.id
        filtros.desde = datos.value.desde
        filtros.hasta = datos.value.hasta
      }
    }
    catch (e) {
      if ((e as { name?: string }).name === 'AbortError')
        return
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  function aplicar(parcial: Partial<FiltrosRanking>) {
    Object.assign(filtros, parcial)
    if ('periodo' in parcial) {
      filtros.desde = null
      filtros.hasta = null
    }

    return cargar()
  }

  async function exportar(formato: 'xlsx' | 'pdf') {
    exportando.value = formato
    errorExportacion.value = null
    try {
      const blob = await descargarRanking(formato, parametrosRanking(filtros))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `ranking_lecturistas_${filtros.desde ?? ''}_${filtros.hasta ?? ''}.${formato}`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
    catch (e) {
      errorExportacion.value = normalizarError(e)
    }
    finally {
      exportando.value = null
    }
  }

  function cancelar() {
    controlador?.abort()
  }

  return { filtros, datos, filas, totales, cargando, error, exportando, errorExportacion, cargar, aplicar, exportar, cancelar }
}
