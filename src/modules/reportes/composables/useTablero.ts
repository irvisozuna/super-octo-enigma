import { computed, onScopeDispose, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import { esCancelacion, normalizarError } from '../services/errores'
import type { ErrorReporte } from '../services/errores'
import { datosWidget, obtenerTablero } from '../services/reportesApi'
import type { DatosWidget, TableroConfig, WidgetDef } from '../types/tablero'
import type { ValoresFiltros } from '../types/reporte'
import { senalConTiempoLimite } from '../utils/senales'

/** Los widgets esperan un poco más que el visor: cada uno es una consulta agregada completa. */
export const TIEMPO_LIMITE_WIDGET_MS = 45_000

export interface EstadoWidget {
  datos: DatosWidget | null
  cargando: boolean
  error: ErrorReporte | null
}

/**
 * Estado de un tablero: configuración, filtros aplicados y los datos de cada widget, que cargan en
 * paralelo y se pintan conforme llegan. Consultar de nuevo cancela las peticiones en curso.
 */
export function useTablero(clave: MaybeRef<string>) {
  const config = ref<TableroConfig | null>(null)
  const cargandoConfig = ref(false)
  const errorConfig = ref<ErrorReporte | null>(null)
  const estados = ref<Record<string, EstadoWidget>>({})
  const filtrosAplicados = ref<ValoresFiltros | null>(null)
  const actualizadoEn = ref<string | null>(null)

  const controladores = new Map<string, AbortController>()

  const consultado = computed(() => filtrosAplicados.value !== null)
  const cargando = computed(() => Object.values(estados.value).some(e => e.cargando))

  const desdeCache = computed(() => {
    const listos = Object.values(estados.value).filter(e => e.datos)

    return listos.length > 0 && listos.every(e => e.datos?.cache_hit)
  })

  const duracionMs = computed(() => Object.values(estados.value).reduce((max, e) => Math.max(max, e.datos?.duracion_ms ?? 0), 0))

  function estadoDe(widget: WidgetDef): EstadoWidget {
    return estados.value[widget.id] ?? { datos: null, cargando: false, error: null }
  }

  function cancelarTodo() {
    controladores.forEach(c => c.abort())
    controladores.clear()
  }

  async function cargarConfig() {
    cargandoConfig.value = true
    errorConfig.value = null
    try {
      config.value = await obtenerTablero(unref(clave))
      estados.value = Object.fromEntries(config.value.widgets.map(w => [w.id, { datos: null, cargando: false, error: null }]))
    }
    catch (e) {
      if (!esCancelacion(e))
        errorConfig.value = normalizarError(e)
    }
    finally {
      cargandoConfig.value = false
    }
  }

  async function cargarWidget(widget: WidgetDef, filtros: ValoresFiltros, forzar: boolean) {
    controladores.get(widget.id)?.abort()

    const controlador = new AbortController()

    controladores.set(widget.id, controlador)
    estados.value[widget.id] = { ...estadoDe(widget), cargando: true, error: null }

    const limite = senalConTiempoLimite(TIEMPO_LIMITE_WIDGET_MS, controlador.signal)
    try {
      const datos = await datosWidget(unref(clave), widget.id, { filtros, forzar }, { signal: limite.signal })

      estados.value[widget.id] = { datos, cargando: false, error: null }
      actualizadoEn.value = datos.cached_at ?? new Date().toISOString()
    }
    catch (e) {
      if (esCancelacion(e))
        return
      estados.value[widget.id] = { datos: estadoDe(widget).datos, cargando: false, error: normalizarError(e) }
    }
    finally {
      limite.limpiar()
      if (controladores.get(widget.id) === controlador)
        controladores.delete(widget.id)
    }
  }

  /** Consulta todos los widgets con los filtros dados; cada uno se pinta en cuanto responde. */
  async function consultar(filtros: ValoresFiltros, forzar = false) {
    if (!config.value)
      return
    cancelarTodo()
    filtrosAplicados.value = { ...filtros }
    await Promise.allSettled(config.value.widgets.map(w => cargarWidget(w, filtros, forzar)))
  }

  async function actualizar() {
    if (filtrosAplicados.value)
      await consultar(filtrosAplicados.value, true)
  }

  async function reintentar(widget: WidgetDef) {
    if (filtrosAplicados.value)
      await cargarWidget(widget, filtrosAplicados.value, false)
  }

  onScopeDispose(cancelarTodo)

  return {
    config,
    cargandoConfig,
    errorConfig,
    estados,
    filtrosAplicados,
    actualizadoEn,
    consultado,
    cargando,
    desdeCache,
    duracionMs,
    estadoDe,
    cargarConfig,
    consultar,
    actualizar,
    reintentar,
  }
}
