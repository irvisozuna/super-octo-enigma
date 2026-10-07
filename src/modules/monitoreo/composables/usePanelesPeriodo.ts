import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { descargarPanelPeriodo, obtenerPanelesPeriodo } from '../services/monitoreoApi'
import type { RespuestaPaneles } from '../types/paneles'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/** Paneles de la vista periodo: se recargan al cambiar periodo o gerencia; descarga de Excel por panel. */
export function usePanelesPeriodo(periodo: Ref<number | null>, gerencia: Ref<number | null>, activo: Ref<boolean>) {
  const datos = ref<RespuestaPaneles | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const exportando = ref<'refacturaciones' | 'tarifa-fija' | null>(null)
  let controlador: AbortController | null = null

  const refacturaciones = computed(() => datos.value?.refacturaciones ?? null)
  const tarifaFija = computed(() => datos.value?.tarifa_fija ?? null)

  async function cargar() {
    if (!activo.value || periodo.value === null)
      return
    controlador?.abort()
    controlador = new AbortController()
    cargando.value = true
    try {
      datos.value = await obtenerPanelesPeriodo(periodo.value, gerencia.value, { signal: controlador.signal })
      error.value = null
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

  async function exportar(panel: 'refacturaciones' | 'tarifa-fija') {
    if (periodo.value === null)
      return
    exportando.value = panel
    try {
      const blob = await descargarPanelPeriodo(panel, periodo.value, gerencia.value)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `${panel}_${periodo.value}.xlsx`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      exportando.value = null
    }
  }

  watch([periodo, gerencia, activo], () => {
    if (activo.value)
      cargar()
  }, { immediate: true })

  return { datos, refacturaciones, tarifaFija, cargando, error, exportando, cargar, exportar, detener: () => controlador?.abort() }
}
