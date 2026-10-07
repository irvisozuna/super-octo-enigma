import { computed, ref } from 'vue'
import { obtenerLecturistasMapa, obtenerRecorrido } from '../services/monitoreoApi'
import type { LecturistasCollection, RespuestaRecorrido } from '../types/mapa'
import type { ParametrosMonitor } from '../types/monitor'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/**
 * Capa de lecturistas del mapa: última posición de cada uno (rastreo o, sin rastreo, su última lectura con GPS) y el
 * recorrido del día del lecturista elegido. El servidor acota al alcance y aplica los mismos filtros que la lista.
 */
export function useMapaLecturistas() {
  const posiciones = ref<LecturistasCollection>({ type: 'FeatureCollection', features: [] })
  const recorrido = ref<RespuestaRecorrido | null>(null)
  const cargandoRecorrido = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const parametros = ref<ParametrosMonitor>({})

  const total = computed(() => posiciones.value.features.length)
  const sinRastreo = computed(() => posiciones.value.features.filter(f => f.properties.sin_rastreo).length)

  async function cargar(params: ParametrosMonitor, signal?: AbortSignal) {
    parametros.value = { ...params }
    try {
      posiciones.value = await obtenerLecturistasMapa(params, { signal })
      error.value = null
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO')
        error.value = normalizado
    }
  }

  /** Vuelve a pedir las posiciones con los últimos parámetros (refresco periódico). */
  function refrescar(signal?: AbortSignal) {
    return cargar(parametros.value, signal)
  }

  async function cargarRecorrido(lecturista: number, signal?: AbortSignal) {
    cargandoRecorrido.value = true
    try {
      recorrido.value = await obtenerRecorrido(lecturista, parametros.value, { signal })
      error.value = null
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO') {
        error.value = normalizado
        recorrido.value = null
      }
    }
    finally {
      cargandoRecorrido.value = false
    }
  }

  function limpiarRecorrido() {
    recorrido.value = null
  }

  return { posiciones, recorrido, cargandoRecorrido, error, total, sinRastreo, cargar, refrescar, cargarRecorrido, limpiarRecorrido }
}
