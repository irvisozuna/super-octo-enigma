import { computed, onScopeDispose, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import { esCancelacion, normalizarError } from '../services/errores'
import type { ErrorReporte } from '../services/errores'
import { contarLoteDocumento, crearLoteDocumento, obtenerLoteDocumento } from '../services/reportesApi'
import { useExportacionesStore } from '../stores/exportacionesStore'
import type { LoteConfig, LoteConteo } from '../types/documento'
import type { ValoresFiltros } from '../types/reporte'
import { senalConTiempoLimite } from '../utils/senales'

/** Contar recorre la fuente del lote (misma consulta que luego usa el job): espera como una consulta normal. */
export const TIEMPO_LIMITE_CONTEO_MS = 60_000

/**
 * Generación en lote de un documento (recibos de un sector): configuración y filtros, conteo previo
 * con los filtros aplicados y encolado. El PDF se sigue como cualquier exportación (store global).
 */
export function useLoteDocumento(clave: MaybeRef<string>) {
  const exportaciones = useExportacionesStore()

  const config = ref<LoteConfig | null>(null)
  const cargandoConfig = ref(false)
  const errorConfig = ref<ErrorReporte | null>(null)

  const conteo = ref<LoteConteo | null>(null)
  const filtrosAplicados = ref<ValoresFiltros | null>(null)
  const contando = ref(false)
  const errorConteo = ref<ErrorReporte | null>(null)

  const encolando = ref(false)
  const errorEncolar = ref<ErrorReporte | null>(null)
  const ultimaEjecucionId = ref<string | null>(null)

  let controlador: AbortController | null = null

  const contado = computed(() => conteo.value !== null)
  const puedeGenerar = computed(() => conteo.value !== null && conteo.value.contratos > 0 && !conteo.value.excede && !encolando.value)

  function cancelar() {
    controlador?.abort()
    controlador = null
  }

  async function cargarConfig() {
    cargandoConfig.value = true
    errorConfig.value = null
    try {
      config.value = await obtenerLoteDocumento(unref(clave))
    }
    catch (e) {
      if (!esCancelacion(e))
        errorConfig.value = normalizarError(e)
    }
    finally {
      cargandoConfig.value = false
    }
  }

  /** Cuenta los documentos que saldrían con esos filtros; cancela un conteo anterior en curso. */
  async function contar(filtros: ValoresFiltros) {
    cancelar()
    controlador = new AbortController()

    const limite = senalConTiempoLimite(TIEMPO_LIMITE_CONTEO_MS, controlador.signal)

    contando.value = true
    errorConteo.value = null
    errorEncolar.value = null
    ultimaEjecucionId.value = null
    try {
      const resultado = await contarLoteDocumento(unref(clave), filtros, { signal: limite.signal })

      conteo.value = resultado
      filtrosAplicados.value = resultado.filtros
    }
    catch (e) {
      if (esCancelacion(e))
        return
      conteo.value = null
      filtrosAplicados.value = { ...filtros }
      errorConteo.value = normalizarError(e)
    }
    finally {
      limite.limpiar()
      contando.value = false
    }
  }

  /** Encola el lote con los filtros ya contados y lo registra en la cola de exportaciones. */
  async function generar(): Promise<string | null> {
    if (!filtrosAplicados.value || !puedeGenerar.value)
      return null

    encolando.value = true
    errorEncolar.value = null
    try {
      const creado = await crearLoteDocumento(unref(clave), filtrosAplicados.value)

      exportaciones.registrar({ ...creado.ejecucion, titulo: creado.ejecucion.titulo ?? config.value?.titulo ?? null })
      ultimaEjecucionId.value = creado.ejecucion_id

      return creado.ejecucion_id
    }
    catch (e) {
      errorEncolar.value = normalizarError(e)

      return null
    }
    finally {
      encolando.value = false
    }
  }

  const ejecucion = computed(() => exportaciones.tareas.find(t => t.id === ultimaEjecucionId.value) ?? null)

  onScopeDispose(cancelar)

  return {
    config,
    cargandoConfig,
    errorConfig,
    conteo,
    contado,
    contando,
    errorConteo,
    filtrosAplicados,
    encolando,
    errorEncolar,
    puedeGenerar,
    ultimaEjecucionId,
    ejecucion,
    cargarConfig,
    contar,
    generar,
    cancelar,
  }
}
