import { computed, reactive, ref } from 'vue'
import { cancelarNotificacion, capturarEnBloque, capturarResultado, descargarDocumentoNotificacion, obtenerNotificacion, obtenerNotificaciones } from '../services/carteraApi'
import type { FichaNotificacion, FiltrosNotificaciones, Notificacion, Paginacion, RespuestaCapturaBloque, ResultadoNotificacion } from '../types/cartera'
import { descargarArchivo, esCapturable, filtrosNotificacionesIniciales, parametrosNotificaciones } from '../utils/cartera'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/** Lista de notificaciones con filtros, paginada en el servidor, y la selección para capturar en bloque. */
export function useNotificaciones(porPagina = 50) {
  const filtros = reactive<FiltrosNotificaciones>(filtrosNotificacionesIniciales())
  const filas = ref<Notificacion[]>([])
  const paginacion = ref<Paginacion>({ pagina: 1, por_pagina: porPagina, total: 0 })
  const puedeOperar = ref(false)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const seleccion = ref<Set<string>>(new Set())
  let controlador: AbortController | null = null

  const capturables = computed(() => filas.value.filter(esCapturable))
  const activos = computed(() => Object.entries(filtros).filter(([, v]) => v !== null && v !== '').length)

  async function cargar(pagina = 1) {
    controlador?.abort()
    controlador = new AbortController()
    cargando.value = true
    try {
      const r = await obtenerNotificaciones(parametrosNotificaciones(filtros, pagina, porPagina), { signal: controlador.signal })

      filas.value = r.notificaciones
      paginacion.value = r.paginacion
      puedeOperar.value = r.puede_operar
      error.value = null

      // La selección solo conserva lo que sigue a la vista y se puede capturar
      const visibles = new Set(capturables.value.map(f => f.id))

      seleccion.value = new Set([...seleccion.value].filter(id => visibles.has(id)))
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

  function aplicar(parcial: Partial<FiltrosNotificaciones>) {
    Object.assign(filtros, parcial)

    return cargar(1)
  }

  function limpiar() {
    return aplicar(filtrosNotificacionesIniciales())
  }

  function alternar(id: string) {
    const s = new Set(seleccion.value)

    s.has(id) ? s.delete(id) : s.add(id)
    seleccion.value = s
  }

  function marcarTodas(marcadas: boolean) {
    seleccion.value = marcadas ? new Set(capturables.value.map(f => f.id)) : new Set()
  }

  function detener() {
    controlador?.abort()
  }

  return { filtros, filas, paginacion, puedeOperar, cargando, error, seleccion, capturables, activos, cargar, aplicar, limpiar, alternar, marcarTodas, detener }
}

/** Captura del mismo resultado para varias notificaciones; devuelve cuántas y cuáles no se pudieron. */
export function useCapturaBloque() {
  const enviando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const resultado = ref<RespuestaCapturaBloque | null>(null)

  async function capturar(ids: string[], resultadoNotificacion: ResultadoNotificacion, fecha: string, observacion?: string | null) {
    enviando.value = true
    error.value = null
    try {
      resultado.value = await capturarEnBloque(ids, resultadoNotificacion, fecha, observacion)

      return resultado.value
    }
    catch (e) {
      error.value = normalizarError(e)

      return null
    }
    finally {
      enviando.value = false
    }
  }

  return { enviando, error, resultado, capturar }
}

/** Ficha de una notificación: datos, historial, captura de resultado, cancelación y reimpresión. */
export function useFichaNotificacion() {
  const ficha = ref<FichaNotificacion | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const errorAccion = ref<ErrorReporte | null>(null)
  const accionando = ref<'resultado' | 'cancelar' | 'documento' | null>(null)

  const capturable = computed(() => !!ficha.value && ficha.value.puede_operar && esCapturable(ficha.value))

  async function cargar(id: string) {
    cargando.value = true
    try {
      ficha.value = await obtenerNotificacion(id)
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  async function accion<T>(tipo: 'resultado' | 'cancelar' | 'documento', fn: () => Promise<T>): Promise<T | null> {
    accionando.value = tipo
    errorAccion.value = null
    try {
      return await fn()
    }
    catch (e) {
      errorAccion.value = normalizarError(e)

      return null
    }
    finally {
      accionando.value = null
    }
  }

  async function capturar(resultado: ResultadoNotificacion, fecha: string, observacion?: string | null) {
    if (!ficha.value)
      return null
    const r = await accion('resultado', () => capturarResultado(ficha.value!.id, resultado, fecha, observacion))
    if (r)
      ficha.value = r

    return r
  }

  async function cancelar(motivo: string) {
    if (!ficha.value)
      return null
    const r = await accion('cancelar', () => cancelarNotificacion(ficha.value!.id, motivo))
    if (r)
      ficha.value = r

    return r
  }

  async function reimprimir() {
    if (!ficha.value)
      return
    const blob = await accion('documento', () => descargarDocumentoNotificacion(ficha.value!.id))
    if (blob)
      descargarArchivo(blob, `${ficha.value.ref}.pdf`)
  }

  return { ficha, cargando, error, errorAccion, accionando, capturable, cargar, capturar, cancelar, reimprimir }
}
