import { computed, ref } from 'vue'
import { obtenerCambiosMapa, obtenerSectoresMapa, obtenerSinCoordenada, obtenerTomasMapa } from '../services/monitoreoApi'
import type { CambioToma, ConteoEstados, SectoresCollection, TomasCollection } from '../types/mapa'
import { contarEstados, conteoVacio, fusionarCambios } from '../utils/geojson'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/**
 * Datos del mapa: tomas por estado, contornos de sector y tomas sin coordenada (no se pintan, pero cuentan) de un
 * periodo, acotados por el servidor al alcance del usuario. La carga completa baja una vez (ETag: el navegador
 * revalida solo); después solo se piden los cambios.
 */
export function useMapaTomas() {
  const tomas = ref<TomasCollection>({ type: 'FeatureCollection', features: [] })
  const sectores = ref<SectoresCollection>({ type: 'FeatureCollection', features: [] })
  const sinCoordenada = ref<Record<string, ConteoEstados> | null>(null)
  const conteos = ref<ConteoEstados>(conteoVacio())
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const hasta = ref<string | null>(null)
  const periodo = ref<number | null>(null)
  const gerencia = ref<number | null>(null)
  const actualizado = ref<Date | null>(null)

  const total = computed(() => Object.values(conteos.value).reduce((a, b) => a + b, 0))

  async function cargar(periodoId: number | null, gerenciaId: number | null, signal?: AbortSignal) {
    cargando.value = true
    error.value = null
    periodo.value = periodoId
    gerencia.value = gerenciaId
    try {
      const desde = new Date().toISOString()

      const [t, s, sc] = await Promise.all([
        obtenerTomasMapa(periodoId, gerenciaId, { signal }),
        obtenerSectoresMapa(periodoId, gerenciaId, { signal }),
        obtenerSinCoordenada(periodoId, gerenciaId, { signal }).catch(() => null),
      ])

      tomas.value = t
      sectores.value = s
      sinCoordenada.value = sc?.sectores ?? null
      conteos.value = contarEstados(t.features)
      hasta.value = desde
      actualizado.value = new Date()
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

  /** Pide los cambios desde la última marca y los aplica; devuelve los que tocaron tomas presentes. */
  async function refrescar(signal?: AbortSignal): Promise<CambioToma[]> {
    if (!hasta.value)
      return []
    try {
      const respuesta = await obtenerCambiosMapa(periodo.value, gerencia.value, hasta.value, { signal })
      const resultado = fusionarCambios(tomas.value, respuesta.cambios)

      tomas.value = resultado.coleccion
      conteos.value = resultado.conteos
      hasta.value = respuesta.hasta
      actualizado.value = new Date()

      return resultado.aplicados
    }
    catch (e) {
      const normalizado = normalizarError(e)
      if (normalizado.codigo !== 'CANCELADO')
        error.value = normalizado

      return []
    }
  }

  return { tomas, sectores, sinCoordenada, conteos, total, cargando, error, hasta, periodo, gerencia, actualizado, cargar, refrescar }
}
