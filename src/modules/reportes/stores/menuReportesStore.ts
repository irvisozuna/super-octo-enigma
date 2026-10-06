import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { normalizarError } from '../services/errores'
import type { ErrorReporte } from '../services/errores'
import { obtenerMenu } from '../services/reportesApi'
import type { CategoriaMenu, DocumentoMenu, TipoElementoMenu } from '../types/api'

/** Menú de reportes del usuario (ya filtrado por permisos en el servidor); lo comparten el índice, el visor y la navegación. */
export const useMenuReportesStore = defineStore('menuReportes', () => {
  const categorias = ref<CategoriaMenu[]>([])
  const documentos = ref<DocumentoMenu[]>([])
  const cargado = ref(false)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)

  const claves = computed(() => new Set(categorias.value.flatMap(c => c.elementos.map(e => `${e.tipo}:${e.key}`))))

  function tieneClave(clave: string, tipo: TipoElementoMenu = 'reporte') {
    return claves.value.has(`${tipo}:${clave}`)
  }

  async function cargar(signal?: AbortSignal) {
    cargando.value = true
    try {
      const respuesta = await obtenerMenu({ signal })

      categorias.value = respuesta.categorias
      documentos.value = respuesta.documentos
      cargado.value = true
      error.value = null
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO')
        error.value = normalizado
    }
    finally {
      cargando.value = false
    }
  }

  function limpiar() {
    categorias.value = []
    documentos.value = []
    cargado.value = false
    error.value = null
  }

  return { categorias, documentos, cargado, cargando, error, claves, tieneClave, cargar, limpiar }
})
