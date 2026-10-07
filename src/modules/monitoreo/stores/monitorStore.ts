import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { obtenerCatalogos, obtenerLecturistas, obtenerResumen, obtenerSectores } from '../services/monitoreoApi'
import type { FilaLecturista, FilaSector, ParametrosMonitor, RespuestaCatalogos, RespuestaResumen, ResumenSectores } from '../types/monitor'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/**
 * Datos de la pantalla principal del monitor: catálogos de filtros, indicadores, sectores y lecturistas para los
 * parámetros vigentes. `cargar` trae todo; `refrescar` vuelve a pedir lo mismo sin vaciar (para que no parpadee) y
 * respeta una petición en curso. El servidor acota al alcance del usuario.
 */
export const useMonitorStore = defineStore('monitoreoMonitor', () => {
  const catalogos = ref<RespuestaCatalogos | null>(null)
  const resumen = ref<RespuestaResumen | null>(null)
  const sectores = ref<FilaSector[]>([])
  const resumenSectores = ref<ResumenSectores | null>(null)
  const lecturistas = ref<FilaLecturista[]>([])
  const evaluado = ref<string | null>(null)
  const cargando = ref(false)
  const refrescando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const actualizado = ref<Date | null>(null)
  const parametros = ref<ParametrosMonitor>({})

  let controlador: AbortController | null = null

  const listo = computed(() => resumen.value !== null)
  const sectorIds = computed(() => sectores.value.map(s => s.sector_id))

  const lecturistasPorEstado = computed(() => {
    const conteo: Record<string, number> = {}
    for (const l of lecturistas.value)
      conteo[l.estado] = (conteo[l.estado] ?? 0) + 1

    return conteo
  })

  async function cargarCatalogos(signal?: AbortSignal) {
    try {
      catalogos.value = await obtenerCatalogos({ signal })
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO')
        error.value = normalizado
    }
  }

  async function pedir(params: ParametrosMonitor, signal: AbortSignal) {
    const [r, s, l] = await Promise.all([
      obtenerResumen(params, { signal }),
      obtenerSectores(params, { signal }),
      obtenerLecturistas(params, { signal }),
    ])

    resumen.value = r
    sectores.value = s.sectores
    resumenSectores.value = s.resumen
    lecturistas.value = l.lecturistas
    evaluado.value = l.evaluado
    actualizado.value = new Date()
    error.value = null
  }

  /** Carga completa para unos parámetros nuevos (cancela la anterior). */
  async function cargar(params: ParametrosMonitor) {
    controlador?.abort()
    controlador = new AbortController()
    parametros.value = { ...params }
    cargando.value = true
    try {
      await pedir(params, controlador.signal)
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO')
        error.value = normalizado
    }
    finally {
      cargando.value = false
    }
  }

  /** Vuelve a pedir lo mismo sin vaciar lo mostrado; si hay una carga en curso no hace nada. */
  async function refrescar() {
    if (cargando.value || refrescando.value)
      return
    controlador = new AbortController()
    refrescando.value = true
    try {
      await pedir(parametros.value, controlador.signal)
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO')
        error.value = normalizado
    }
    finally {
      refrescando.value = false
    }
  }

  function cancelar() {
    controlador?.abort()
    controlador = null
  }

  function limpiar() {
    cancelar()
    catalogos.value = null
    resumen.value = null
    sectores.value = []
    resumenSectores.value = null
    lecturistas.value = []
    evaluado.value = null
    actualizado.value = null
    error.value = null
    parametros.value = {}
  }

  return {
    catalogos,
    resumen,
    sectores,
    resumenSectores,
    lecturistas,
    evaluado,
    cargando,
    refrescando,
    error,
    actualizado,
    parametros,
    listo,
    sectorIds,
    lecturistasPorEstado,
    cargarCatalogos,
    cargar,
    refrescar,
    cancelar,
    limpiar,
  }
})
