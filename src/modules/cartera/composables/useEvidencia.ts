import { ref } from 'vue'
import { borrarEvidencia, descargarEvidencia, obtenerEvidencias, subirEvidencias } from '../services/carteraApi'
import type { Evidencia, RespuestaEvidencias, TipoEvidencia } from '../types/cartera'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/**
 * Evidencia de una notificación (XEL1-661). Los archivos están en el disco privado: las miniaturas se piden con la
 * sesión y se muestran como URL del navegador, que se liberan al cambiar de notificación.
 */
export function useEvidencia() {
  const datos = ref<RespuestaEvidencias | null>(null)
  const miniaturas = ref<Record<string, string>>({})
  const cargando = ref(false)
  const subiendo = ref(false)
  const error = ref<ErrorReporte | null>(null)
  let aviso: string | null = null

  function liberar() {
    Object.values(miniaturas.value).forEach(u => URL.revokeObjectURL(u))
    miniaturas.value = {}
  }

  async function cargarMiniaturas(lista: Evidencia[]) {
    for (const e of lista.filter(x => x.mime.startsWith('image/') && !miniaturas.value[x.id])) {
      try {
        miniaturas.value = { ...miniaturas.value, [e.id]: URL.createObjectURL(await descargarEvidencia(e.id)) }
      }
      catch {
        // Sin miniatura: queda el enlace para abrirla
      }
    }
  }

  async function cargar(id: string) {
    if (id !== aviso)
      liberar()
    aviso = id
    cargando.value = true
    try {
      datos.value = await obtenerEvidencias(id)
      error.value = null
      await cargarMiniaturas(datos.value.evidencias)
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  async function subir(tipo: TipoEvidencia, archivos: File[]): Promise<number> {
    if (!aviso || !archivos.length)
      return 0
    subiendo.value = true
    error.value = null
    try {
      const r = await subirEvidencias(aviso, tipo, archivos)

      await cargar(aviso)

      return r.guardadas.length
    }
    catch (e) {
      error.value = normalizarError(e)

      return 0
    }
    finally {
      subiendo.value = false
    }
  }

  async function borrar(id: string): Promise<boolean> {
    try {
      await borrarEvidencia(id)
      if (miniaturas.value[id])
        URL.revokeObjectURL(miniaturas.value[id])
      if (datos.value)
        datos.value.evidencias = datos.value.evidencias.filter(e => e.id !== id)

      return true
    }
    catch (e) {
      error.value = normalizarError(e)

      return false
    }
  }

  async function abrir(e: Evidencia) {
    const url = miniaturas.value[e.id] ?? URL.createObjectURL(await descargarEvidencia(e.id))

    window.open(url, '_blank', 'noopener')
  }

  return { datos, miniaturas, cargando, subiendo, error, cargar, subir, borrar, abrir, liberar }
}
