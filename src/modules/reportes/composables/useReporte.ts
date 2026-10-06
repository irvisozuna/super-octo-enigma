import { computed, onScopeDispose, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import { normalizarError } from '../services/errores'
import type { ErrorReporte } from '../services/errores'
import { ejecutarReporte, obtenerEjecucion, obtenerReporte } from '../services/reportesApi'
import type { Ejecucion } from '../types/exportacion'
import { esConsultaEnCurso } from '../types/reporte'
import type { Fila, OrdenDef, ReporteConfig, ResultadoConsulta, ValoresFiltros } from '../types/reporte'
import { senalConTiempoLimite } from '../utils/senales'

/** Tiempo máximo de espera del cliente; el servidor responde 202 a los 25 s si la consulta es larga. */
export const TIEMPO_LIMITE_MS = 40_000

const POLLING_INICIAL_MS = 2_000
const POLLING_MAXIMO_MS = 10_000
const POLLING_TOPE_MS = 15 * 60_000

/** Error que simula una respuesta HTTP para que normalizarError lo trate como cualquier otro. */
class ErrorEjecucion extends Error {
  status = 500
  body: { codigo: string; mensaje: string; reintentable: boolean }

  constructor(ejecucion: Ejecucion) {
    super(ejecucion.mensaje ?? 'La consulta en segundo plano falló.')
    this.body = { codigo: ejecucion.estado === 'expired' ? 'TIEMPO_AGOTADO' : 'SERVIDOR', mensaje: this.message, reintentable: true }
  }
}

/**
 * Estado de un reporte en el visor: configuración, filtros aplicados, página de resultados, totales
 * y la información de caché. Cada consulta cancela la anterior; cambiar filtros u orden regresa a la página 1.
 */
export function useReporte(clave: MaybeRef<string>) {
  const config = ref<ReporteConfig | null>(null)
  const cargandoConfig = ref(false)
  const cargando = ref(false)
  const enSegundoPlano = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const errorConfig = ref<ErrorReporte | null>(null)

  const filas = ref<Fila[]>([])
  const totalFilas = ref(0)
  const totales = ref<Record<string, number | string> | null>(null)
  const pagina = ref(1)
  const porPagina = ref(50)
  const orden = ref<OrdenDef[]>([])
  const filtrosAplicados = ref<ValoresFiltros | null>(null)

  const consultaId = ref<string | null>(null)
  const actualizadoEn = ref<string | null>(null)
  const desdeCache = ref(false)
  const duracionMs = ref(0)
  const consultado = computed(() => filtrosAplicados.value !== null)

  let controlador: AbortController | null = null

  async function cargarConfig() {
    cargandoConfig.value = true
    errorConfig.value = null
    try {
      const respuesta = await obtenerReporte(unref(clave))

      config.value = respuesta
      porPagina.value = respuesta.por_pagina_default
      orden.value = respuesta.orden_default.map(o => ({ columna: o.columna, dir: o.dir }))
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO')
        errorConfig.value = normalizado
    }
    finally {
      cargandoConfig.value = false
    }
  }

  function aplicarResultado(resultado: ResultadoConsulta) {
    filas.value = resultado.filas
    totalFilas.value = resultado.total_filas
    totales.value = resultado.totales
    consultaId.value = resultado.consulta_id
    actualizadoEn.value = resultado.cached_at
    desdeCache.value = resultado.cache_hit
    duracionMs.value = resultado.duracion_ms
  }

  function cancelar() {
    controlador?.abort()
    controlador = null
  }

  async function esperar(ms: number, signal: AbortSignal) {
    await new Promise<void>((resolve, reject) => {
      const temporizador = setTimeout(resolve, ms)

      signal.addEventListener('abort', () => {
        clearTimeout(temporizador)
        reject(signal.reason ?? new DOMException('cancelado', 'AbortError'))
      }, { once: true })
    })
  }

  /** La consulta se terminó en segundo plano (202): se consulta su estado hasta que acabe. */
  async function esperarEjecucion(id: string, signal: AbortSignal) {
    const inicio = Date.now()
    let intervalo = POLLING_INICIAL_MS

    while (Date.now() - inicio < POLLING_TOPE_MS) {
      await esperar(intervalo, signal)

      const ejecucion = await obtenerEjecucion(id, { signal })

      if (ejecucion.estado === 'done')
        return
      if (ejecucion.estado === 'failed' || ejecucion.estado === 'canceled' || ejecucion.estado === 'expired')
        throw new ErrorEjecucion(ejecucion)
      intervalo = Math.min(POLLING_MAXIMO_MS, Math.round(intervalo * 1.5))
    }

    throw new ErrorEjecucion({ estado: 'expired', mensaje: null } as Ejecucion)
  }

  async function ejecutar({ forzar = false } = {}) {
    if (!filtrosAplicados.value)
      return

    cancelar()
    controlador = new AbortController()

    const propio = controlador
    const limite = senalConTiempoLimite(TIEMPO_LIMITE_MS, propio.signal)

    cargando.value = true
    error.value = null
    try {
      const respuesta = await ejecutarReporte(unref(clave), {
        filtros: filtrosAplicados.value,
        pagina: pagina.value,
        por_pagina: porPagina.value,
        orden: orden.value,
        forzar,
        incluir_totales: true,
        consulta_id: consultaId.value,
      }, { signal: limite.signal })

      if (esConsultaEnCurso(respuesta)) {
        enSegundoPlano.value = true
        limite.limpiar()
        await esperarEjecucion(respuesta.ejecucion_id, propio.signal)
        enSegundoPlano.value = false

        // Ya está en caché: la misma petición vuelve enseguida
        const final = await ejecutarReporte(unref(clave), {
          filtros: filtrosAplicados.value,
          pagina: pagina.value,
          por_pagina: porPagina.value,
          orden: orden.value,
          incluir_totales: true,
        }, { signal: propio.signal })

        if (!esConsultaEnCurso(final))
          aplicarResultado(final)
      }
      else {
        aplicarResultado(respuesta)
      }
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO')
        error.value = normalizado
    }
    finally {
      limite.limpiar()
      if (controlador === propio) {
        cargando.value = false
        enSegundoPlano.value = false
        controlador = null
      }
    }
  }

  async function consultar(filtros: ValoresFiltros) {
    filtrosAplicados.value = filtros
    pagina.value = 1
    await ejecutar()
  }

  async function irAPagina(nueva: number) {
    pagina.value = nueva
    await ejecutar()
  }

  async function cambiarPorPagina(nuevo: number) {
    porPagina.value = nuevo
    pagina.value = 1
    await ejecutar()
  }

  async function ordenar(nuevo: OrdenDef[]) {
    orden.value = nuevo
    pagina.value = 1
    await ejecutar()
  }

  async function actualizar() {
    await ejecutar({ forzar: true })
  }

  onScopeDispose(cancelar)

  return {
    config,
    cargandoConfig,
    cargando,
    enSegundoPlano,
    error,
    errorConfig,
    filas,
    totalFilas,
    totales,
    pagina,
    porPagina,
    orden,
    filtrosAplicados,
    consultado,
    consultaId,
    actualizadoEn,
    desdeCache,
    duracionMs,
    cargarConfig,
    consultar,
    irAPagina,
    cambiarPorPagina,
    ordenar,
    actualizar,
    cancelar,
  }
}

export type Reporte = ReturnType<typeof useReporte>
