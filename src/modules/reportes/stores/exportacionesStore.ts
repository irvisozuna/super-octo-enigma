import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { esCancelacion, normalizarError } from '../services/errores'
import type { ErrorReporte } from '../services/errores'
import { cancelarEjecucion, crearExportacion, descargarEjecucion, listarEjecuciones, obtenerEjecucion } from '../services/reportesApi'
import { ejecucionTerminada } from '../types/exportacion'
import type { Ejecucion, SolicitudExportacion } from '../types/exportacion'

export const POLLING_INICIAL_MS = 2_000
export const POLLING_MAXIMO_MS = 10_000
export const POLLING_TOPE_MS = 15 * 60_000

/**
 * Cola global de exportaciones del usuario: se alimenta del servidor (GET executions?mine=1) y sigue
 * por polling las que están en cola o corriendo. Nada se guarda en localStorage: el servidor es la verdad.
 */
export const useExportacionesStore = defineStore('exportaciones', () => {
  const tareas = ref<Ejecucion[]>([])
  const cargando = ref(false)
  const cargado = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const ocultas = ref<Set<string>>(new Set())

  // No reactivos: la solicitud original (para reintentar) y los temporizadores de polling
  const solicitudes = new Map<string, { clave: string; titulo: string | null; solicitud: SolicitudExportacion }>()
  const temporizadores = new Map<string, ReturnType<typeof setTimeout>>()

  const visibles = computed(() => tareas.value.filter(t => !ocultas.value.has(t.id)))
  const activas = computed(() => tareas.value.filter(t => !ejecucionTerminada(t)))
  const listas = computed(() => visibles.value.filter(t => t.estado === 'done'))

  function actualizar(ejecucion: Ejecucion) {
    const indice = tareas.value.findIndex(t => t.id === ejecucion.id)
    const titulo = ejecucion.titulo ?? tareas.value[indice]?.titulo ?? solicitudes.get(ejecucion.id)?.titulo ?? null

    const actualizada = { ...ejecucion, titulo }

    if (indice >= 0)
      tareas.value.splice(indice, 1, actualizada)
    else
      tareas.value.unshift(actualizada)
  }

  function detenerSeguimiento(id: string) {
    const temporizador = temporizadores.get(id)
    if (temporizador) {
      clearTimeout(temporizador)
      temporizadores.delete(id)
    }
  }

  /** Consulta el estado con pausa creciente (2 s → 10 s) hasta que termine o pasen 15 minutos. */
  function seguir(id: string, intervalo = POLLING_INICIAL_MS, inicio = Date.now()) {
    detenerSeguimiento(id)

    const temporizador = setTimeout(async () => {
      temporizadores.delete(id)
      try {
        const ejecucion = await obtenerEjecucion(id)

        actualizar(ejecucion)
        if (ejecucionTerminada(ejecucion))
          return

        if (Date.now() - inicio >= POLLING_TOPE_MS) {
          actualizar({ ...ejecucion, estado: 'failed', mensaje: 'La exportación no terminó en 15 minutos.' })

          return
        }
        seguir(id, Math.min(POLLING_MAXIMO_MS, Math.round(intervalo * 1.5)), inicio)
      }
      catch (e) {
        if (!esCancelacion(e))
          seguir(id, Math.min(POLLING_MAXIMO_MS, intervalo * 2), inicio)
      }
    }, intervalo)

    temporizadores.set(id, temporizador)
  }

  async function rehidratar() {
    cargando.value = true
    try {
      const lista = await listarEjecuciones()

      lista.forEach(actualizar)
      lista.filter(t => !ejecucionTerminada(t)).forEach(t => seguir(t.id))
      error.value = null
      cargado.value = true
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  /** Carga la lista una sola vez por sesión (la llaman las pantallas del módulo al montarse). */
  async function asegurar() {
    if (!cargado.value && !cargando.value)
      await rehidratar()
  }

  /** Encola una exportación y empieza a seguirla. Devuelve el id de la ejecución. */
  async function iniciar(clave: string, titulo: string | null, solicitud: SolicitudExportacion): Promise<string> {
    const creada = await crearExportacion(clave, solicitud)

    solicitudes.set(creada.ejecucion_id, { clave, titulo, solicitud })
    actualizar({ ...creada.ejecucion, titulo: creada.ejecucion.titulo ?? titulo })
    seguir(creada.ejecucion_id)

    return creada.ejecucion_id
  }

  /** Registra y sigue una ejecución creada por otra pantalla (p. ej. un lote de recibos). */
  function registrar(ejecucion: Ejecucion) {
    actualizar(ejecucion)
    if (!ejecucionTerminada(ejecucion))
      seguir(ejecucion.id)
  }

  async function cancelar(id: string) {
    detenerSeguimiento(id)
    actualizar(await cancelarEjecucion(id))
  }

  /** Descarga con el token (Bearer) y guarda el archivo con su nombre. */
  async function descargar(ejecucion: Ejecucion) {
    const blob = await descargarEjecucion(ejecucion.id)
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')

    enlace.href = url
    enlace.download = ejecucion.nombre_archivo ?? `${ejecucion.object_key}.${ejecucion.formato ?? 'bin'}`
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1_000)
  }

  async function reintentar(id: string): Promise<string | null> {
    const original = solicitudes.get(id)
    if (!original)
      return null
    ocultas.value = new Set([...ocultas.value, id])

    return iniciar(original.clave, original.titulo, original.solicitud)
  }

  function ocultarTerminadas() {
    ocultas.value = new Set([...ocultas.value, ...tareas.value.filter(ejecucionTerminada).map(t => t.id)])
  }

  function detener() {
    temporizadores.forEach(clearTimeout)
    temporizadores.clear()
  }

  return {
    tareas,
    visibles,
    activas,
    listas,
    cargando,
    cargado,
    error,
    rehidratar,
    asegurar,
    iniciar,
    registrar,
    seguir,
    cancelar,
    descargar,
    reintentar,
    ocultarTerminadas,
    detener,
  }
})
