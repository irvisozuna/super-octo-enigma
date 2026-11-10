import { computed, reactive, ref } from 'vue'
import { guardarConfiguracion, obtenerConfiguracion } from '../services/carteraApi'
import type { Configuracion, RespuestaConfiguracion } from '../types/cartera'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/** Lo que se edita en la pantalla, en su orden. */
export const CLAVES_CONFIGURACION = ['vigencia_dias', 'capacidad_lote', 'seguimiento_dias', 'revisita_intentos', 'ticket_qr'] as const

/** Configuración de cartera: vigencia, capacidad del lote, seguimiento, revisitas y el QR del comprobante. */
export function useConfiguracion() {
  const datos = ref<RespuestaConfiguracion | null>(null)
  const edicion = reactive<Configuracion>({ vigencia_dias: 90, capacidad_lote: 45, seguimiento_dias: 15, revisita_intentos: 3, ticket_qr: 0 })
  const cargando = ref(false)
  const guardando = ref(false)
  const error = ref<ErrorReporte | null>(null)

  /** Las claves que manda el servidor: uno anterior a un ajuste nuevo no lo trae y no se le manda. */
  const claves = computed(() => CLAVES_CONFIGURACION.filter(c => datos.value && c in datos.value.valores && c in datos.value.limites))

  const cambios = computed<Partial<Configuracion>>(() => {
    const out: Partial<Configuracion> = {}
    if (!datos.value)
      return out
    for (const clave of claves.value) {
      if (Number(edicion[clave]) !== datos.value.valores[clave])
        out[clave] = Number(edicion[clave])
    }

    return out
  })

  /** Mensaje del primer valor fuera de límites, o null. */
  const invalido = computed<keyof Configuracion | null>(() => {
    if (!datos.value)
      return null
    for (const clave of claves.value) {
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

  return { datos, edicion, cargando, guardando, error, claves, cambios, invalido, cargar, guardar }
}
