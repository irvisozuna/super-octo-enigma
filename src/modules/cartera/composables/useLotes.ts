import { computed, ref } from 'vue'
import { descargarDocumentoLote, obtenerLote, obtenerLotes, rearmarDocumentoLote } from '../services/carteraApi'
import type { Lote, Paginacion, RespuestaLote } from '../types/cartera'
import { descargarArchivo } from '../utils/cartera'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/** Lista de lotes, la más reciente primero, paginada en el servidor. */
export function useLotes(porPagina = 25) {
  const lotes = ref<Lote[]>([])
  const paginacion = ref<Paginacion>({ pagina: 1, por_pagina: porPagina, total: 0 })
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)

  async function cargar(pagina = paginacion.value.pagina) {
    cargando.value = true
    try {
      const r = await obtenerLotes(pagina, porPagina)

      lotes.value = r.lotes
      paginacion.value = r.paginacion
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  return { lotes, paginacion, cargando, error, cargar }
}

/** El documento sigue en la cola: se vuelve a preguntar hasta que esté listo o falle. */
export function documentoEnCurso(lote: Pick<Lote, 'documento'> | null): boolean {
  return lote?.documento === 'pendiente' || lote?.documento === 'generando'
}

/**
 * Un lote con sus notificaciones. Mientras el PDF se arma en la cola, pregunta cada `intervalo` ms.
 */
export function useLote(intervalo = 5000) {
  const lote = ref<RespuestaLote | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const errorAccion = ref<ErrorReporte | null>(null)
  const descargando = ref(false)
  const rearmando = ref(false)
  let id: string | null = null
  let temporizador: ReturnType<typeof setTimeout> | null = null

  const enCurso = computed(() => documentoEnCurso(lote.value))

  function programar() {
    if (temporizador)
      clearTimeout(temporizador)
    if (enCurso.value) {
      temporizador = setTimeout(() => {
        cargar()
      }, intervalo)
    }
  }

  async function cargar(nuevo?: string) {
    if (nuevo)
      id = nuevo
    if (!id)
      return
    cargando.value = true
    try {
      lote.value = await obtenerLote(id)
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
      programar()
    }
  }

  async function descargar() {
    if (!lote.value)
      return
    descargando.value = true
    errorAccion.value = null
    try {
      descargarArchivo(await descargarDocumentoLote(lote.value.id), `${lote.value.ref ?? 'lote'}.pdf`)
    }
    catch (e) {
      errorAccion.value = normalizarError(e)
    }
    finally {
      descargando.value = false
    }
  }

  async function rearmar() {
    if (!lote.value)
      return
    rearmando.value = true
    errorAccion.value = null
    try {
      const r = await rearmarDocumentoLote(lote.value.id)

      lote.value = { ...lote.value, ...r }
      programar()
    }
    catch (e) {
      errorAccion.value = normalizarError(e)
    }
    finally {
      rearmando.value = false
    }
  }

  function detener() {
    if (temporizador)
      clearTimeout(temporizador)
  }

  return { lote, cargando, error, errorAccion, descargando, rearmando, enCurso, cargar, descargar, rearmar, detener }
}
