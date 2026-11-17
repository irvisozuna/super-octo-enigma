import { computed, ref } from 'vue'
import { accionRevisita, accionSeguimiento, cerrarOrdenSeguimiento, obtenerSeguimiento } from '../services/carteraApi'
import type { AccionRevisita, AccionSeguimiento, RespuestaAccionSeguimiento, RespuestaSeguimiento } from '../types/cartera'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/**
 * Seguimiento (XEL1-659): bandeja de entregadas sin pago, la de no entregadas por revisitar (XEL1-686), cada una con su
 * selección y sus acciones, y las órdenes abiertas.
 */
export function useSeguimiento() {
  const datos = ref<RespuestaSeguimiento | null>(null)
  const cargando = ref(false)
  const enviando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const errorAccion = ref<ErrorReporte | null>(null)
  const seleccion = ref<Set<string>>(new Set())
  const seleccionRevisita = ref<Set<string>>(new Set())

  const candidatas = computed(() => datos.value?.candidatas ?? [])
  const revisitas = computed(() => datos.value?.revisitas ?? [])
  const ordenes = computed(() => datos.value?.ordenes ?? [])
  const totalMarcado = computed(() => candidatas.value.filter(c => seleccion.value.has(c.id)).reduce((s, c) => s + c.adeudo_actual, 0))
  const totalMarcadoRevisita = computed(() => revisitas.value.filter(r => seleccionRevisita.value.has(r.id)).reduce((s, r) => s + r.adeudo_actual, 0))

  /** Entre las marcadas para revisitar, cuántas agotaron intentos (solo se pueden descartar). */
  const agotadasMarcadas = computed(() => revisitas.value.filter(r => r.agotada && seleccionRevisita.value.has(r.id)).length)

  async function cargar() {
    cargando.value = true
    try {
      datos.value = await obtenerSeguimiento()

      const visibles = new Set(candidatas.value.map(c => c.id))
      const porRevisitar = new Set(revisitas.value.map(r => r.id))

      seleccion.value = new Set([...seleccion.value].filter(id => visibles.has(id)))
      seleccionRevisita.value = new Set([...seleccionRevisita.value].filter(id => porRevisitar.has(id)))
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  function alternar(id: string, conjunto = seleccion) {
    const s = new Set(conjunto.value)

    s.has(id) ? s.delete(id) : s.add(id)
    conjunto.value = s
  }

  function alternarRevisita(id: string) {
    alternar(id, seleccionRevisita)
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

  /** Revisita o descarte de las marcadas en «Por revisitar»; al terminar recarga. */
  async function aplicarRevisita(accion: AccionRevisita, motivo: string, notificador?: string | null): Promise<RespuestaAccionSeguimiento | null> {
    if (!seleccionRevisita.value.size || !motivo.trim())
      return null
    enviando.value = true
    errorAccion.value = null
    try {
      const r = await accionRevisita([...seleccionRevisita.value], accion, motivo.trim(), notificador)

      seleccionRevisita.value = new Set()
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

  return {
    datos,
    cargando,
    enviando,
    error,
    errorAccion,
    seleccion,
    seleccionRevisita,
    candidatas,
    revisitas,
    ordenes,
    totalMarcado,
    totalMarcadoRevisita,
    agotadasMarcadas,
    cargar,
    alternar,
    alternarRevisita,
    marcarTodas,
    aplicar,
    aplicarRevisita,
    cerrar,
  }
}
