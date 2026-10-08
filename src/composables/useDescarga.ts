import { ref } from 'vue'

/*
 * Descarga de archivos generados por la API (Excel, PDF, CSV) con un solo estado de "exportando" y de error.
 * Sustituye a las copias de `URL.createObjectURL` + `<a download>` que había en seis composables.
 *
 *   const { exportando, error, descargar } = useDescarga()
 *   await descargar(() => api.ranking.xlsx(filtros), 'ranking_2026-10.xlsx', 'xlsx')
 */
export function useDescarga() {
  /** Formato que se está exportando ahora (o null). Sirve para el `loading` del botón que lo pidió. */
  const exportando = ref<string | null>(null)
  const error = ref<unknown>(null)

  function guardarBlob(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')

    enlace.href = url
    enlace.download = nombre
    enlace.rel = 'noopener'
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  /**
   * Pide el archivo y lo guarda. Devuelve true si se descargó; el error queda en `error` y se vuelve a lanzar solo si
   * se pide con `relanzar`.
   */
  async function descargar(obtener: () => Promise<Blob>, nombre: string, formato = 'archivo', relanzar = false): Promise<boolean> {
    exportando.value = formato
    error.value = null
    try {
      guardarBlob(await obtener(), nombre)

      return true
    }
    catch (e) {
      error.value = e
      if (relanzar)
        throw e

      return false
    }
    finally {
      exportando.value = null
    }
  }

  return { exportando, error, descargar, guardarBlob }
}
