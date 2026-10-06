import { computed, onScopeDispose, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import { esCancelacion, normalizarError } from '../services/errores'
import type { ErrorReporte } from '../services/errores'
import { generarDocumento, listarDocumentos, opcionesFiltro } from '../services/reportesApi'
import type { DocumentoDef, DocumentoGenerado } from '../types/documento'
import type { Opcion } from '../types/reporte'
import { estaVacio } from '../utils/filtros'

/** Convierte el PDF en base64 a un Blob del mismo origen (previsualizar en iframe, imprimir y descargar). */
export function base64ABlob(base64: string, mime = 'application/pdf'): Blob {
  const bytes = atob(base64)
  const buffer = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++)
    buffer[i] = bytes.charCodeAt(i)

  return new Blob([buffer], { type: mime })
}

/**
 * Documentos por contrato (duplicado de recibo, constancias): lista los permitidos, pide el periodo
 * cuando hace falta y genera el PDF. Cada generación cancela la anterior y libera el blob previo.
 */
export function useDocumentos(contrato: MaybeRef<string>) {
  const documentos = ref<DocumentoDef[]>([])
  const periodos = ref<Opcion[]>([])
  const seleccionado = ref<string | null>(null)
  const periodo = ref<number | string | null>(null)

  const cargando = ref(false)
  const generando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const resultado = ref<DocumentoGenerado | null>(null)
  const urlPdf = ref<string | null>(null)

  const documento = computed(() => documentos.value.find(d => d.key === seleccionado.value) ?? null)

  const puedeGenerar = computed(() => documento.value !== null
    && (!documento.value.requiere_periodo || !estaVacio(periodo.value))
    && !generando.value
    && !estaVacio(unref(contrato)))

  let controlador: AbortController | null = null

  function nuevaSenal(): AbortSignal {
    controlador?.abort()
    controlador = new AbortController()

    return controlador.signal
  }

  function liberar() {
    if (urlPdf.value)
      URL.revokeObjectURL(urlPdf.value)
    urlPdf.value = null
    resultado.value = null
  }

  async function cargar() {
    cargando.value = true
    error.value = null

    const signal = nuevaSenal()
    try {
      const [docs, opciones] = await Promise.all([
        listarDocumentos(unref(contrato), { signal }),
        opcionesFiltro('periodo', { limite: 36 }, { signal }),
      ])

      documentos.value = docs
      periodos.value = opciones
      seleccionado.value ??= docs[0]?.key ?? null
      periodo.value ??= docs.find(d => d.periodo_default != null)?.periodo_default ?? opciones[0]?.value ?? null
    }
    catch (e) {
      if (!esCancelacion(e))
        error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  async function generar() {
    if (!puedeGenerar.value || !documento.value)
      return
    generando.value = true
    error.value = null
    liberar()

    const signal = nuevaSenal()
    try {
      const generado = await generarDocumento(documento.value.key, {
        contrato: unref(contrato),
        periodo: documento.value.requiere_periodo ? periodo.value : undefined,
      }, { signal })

      resultado.value = generado
      urlPdf.value = URL.createObjectURL(base64ABlob(generado.pdf_base64, generado.mime))
    }
    catch (e) {
      if (!esCancelacion(e))
        error.value = normalizarError(e)
    }
    finally {
      generando.value = false
    }
  }

  function descargar() {
    if (!urlPdf.value || !resultado.value)
      return
    const enlace = document.createElement('a')

    enlace.href = urlPdf.value
    enlace.download = resultado.value.nombre_archivo
    enlace.click()
  }

  onScopeDispose(() => {
    controlador?.abort()
    liberar()
  })

  return {
    documentos,
    periodos,
    documento,
    seleccionado,
    periodo,
    cargando,
    generando,
    error,
    resultado,
    urlPdf,
    puedeGenerar,
    cargar,
    generar,
    descargar,
  }
}
