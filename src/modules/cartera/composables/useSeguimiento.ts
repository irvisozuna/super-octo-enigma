import { computed, ref } from 'vue'
import { accionSeguimiento, cerrarOrdenSeguimiento, obtenerSeguimiento } from '../services/carteraApi'
import type { AccionSeguimiento, RespuestaAccionSeguimiento, RespuestaSeguimiento } from '../types/cartera'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/** Seguimiento (XEL1-659): bandeja de entregadas sin pago, selección, acciones y órdenes abiertas. */
export function useSeguimiento() {
  const datos = ref<RespuestaSeguimiento | null>(null)
  const cargando = ref(false)
  const enviando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const errorAccion = ref<ErrorReporte | null>(null)
  const seleccion = ref<Set<string>>(new Set())

  const candidatas = computed(() => datos.value?.candidatas ?? [])
  const ordenes = computed(() => datos.value?.ordenes ?? [])
  const totalMarcado = computed(() => candidatas.value.filter(c => seleccion.value.has(c.id)).reduce((s, c) => s + c.adeudo_actual, 0))

  async function cargar() {
    cargando.value = true
    try {
      datos.value = await obtenerSeguimiento()

      const visibles = new Set(candidatas.value.map(c => c.id))

      seleccion.value = new Set([...seleccion.value].filter(id => visibles.has(id)))
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  function alternar(id: string) {
    const s = new Set(seleccion.value)

    s.has(id) ? s.delete(id) : s.add(id)
    seleccion.value = s
  }

  function marcarTodas(marcadas: boolean) {
    seleccion.value = marcadas ? new Set(candidatas.value.map(c => c.id)) : new Set()
  }

  /** Aplica la acción a las marcadas; al terminar recarga la bandeja. */
  async function aplicar(accion: AccionSeguimiento, motivo: string, notificador?: string | null): Promise<RespuestaAccionSeguimiento | null> {
    if (!seleccion.value.size || !motivo.trim())
      return null
    enviando.value = true
    errorAccion.value = null
    try {
      const r = await accionSeguimiento([...seleccion.value], accion, motivo.trim(), notificador)

      seleccion.value = new Set()
      await cargar()

      return r
    }
    catch (e) {
      errorAccion.value = normalizarError(e)

      return null
    }
    finally {
      enviando.value = false
    }
  }

  async function cerrar(id: string, estado: 'atendida' | 'cancelada', nota: string): Promise<boolean> {
    if (!nota.trim())
      return false
    enviando.value = true
    errorAccion.value = null
    try {
      await cerrarOrdenSeguimiento(id, estado, nota.trim())
      await cargar()

      return true
    }
    catch (e) {
      errorAccion.value = normalizarError(e)

      return false
    }
    finally {
      enviando.value = false
    }
  }

  return { datos, cargando, enviando, error, errorAccion, seleccion, candidatas, ordenes, totalMarcado, cargar, alternar, marcarTodas, aplicar, cerrar }
}
