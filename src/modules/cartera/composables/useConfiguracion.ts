import { computed, reactive, ref } from 'vue'
import { guardarConfiguracion, obtenerConfiguracion } from '../services/carteraApi'
import type { Configuracion, RespuestaConfiguracion } from '../types/cartera'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/** Configuración de cartera: vigencia de la notificación y capacidad sugerida del lote. */
export function useConfiguracion() {
  const datos = ref<RespuestaConfiguracion | null>(null)
  const edicion = reactive<Configuracion>({ vigencia_dias: 90, capacidad_lote: 45, seguimiento_dias: 15 })
  const cargando = ref(false)
  const guardando = ref(false)
  const error = ref<ErrorReporte | null>(null)

  const cambios = computed<Partial<Configuracion>>(() => {
    const out: Partial<Configuracion> = {}
    if (!datos.value)
      return out
    for (const clave of ['vigencia_dias', 'capacidad_lote', 'seguimiento_dias'] as const) {
      if (Number(edicion[clave]) !== datos.value.valores[clave])
        out[clave] = Number(edicion[clave])
    }

    return out
  })

  /** Mensaje del primer valor fuera de límites, o null. */
  const invalido = computed<keyof Configuracion | null>(() => {
    if (!datos.value)
      return null
    for (const clave of ['vigencia_dias', 'capacidad_lote', 'seguimiento_dias'] as const) {
      const v = Number(edicion[clave])
      const { min, max } = datos.value.limites[clave]
      if (!Number.isInteger(v) || v < min || v > max)
        return clave
    }

    return null
  })

  function tomar(r: RespuestaConfiguracion) {
    datos.value = r
    Object.assign(edicion, r.valores)
  }

  async function cargar() {
    cargando.value = true
    try {
      tomar(await obtenerConfiguracion())
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  async function guardar(): Promise<boolean> {
    if (invalido.value || !Object.keys(cambios.value).length)
      return false
    guardando.value = true
    try {
      tomar(await guardarConfiguracion(cambios.value))
      error.value = null

      return true
    }
    catch (e) {
      error.value = normalizarError(e)

      return false
    }
    finally {
      guardando.value = false
    }
  }

  return { datos, edicion, cargando, guardando, error, cambios, invalido, cargar, guardar }
}
