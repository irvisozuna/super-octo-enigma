import { computed, ref } from 'vue'
import { descargarPendientesSector, obtenerDetalleSector } from '../services/monitoreoApi'
import type { ParametrosMonitor } from '../types/monitor'
import type { RespuestaDetalleSector } from '../types/sector'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/** Serie de 24 horas con las lecturas de cada una (las horas sin lecturas en 0), para la gráfica. */
export function serieHoraria(horas: { hora: number; lecturas: number }[], desde = 5, hasta = 20): { hora: number; lecturas: number }[] {
  const porHora = new Map(horas.map(h => [h.hora, h.lecturas]))
  const min = Math.min(desde, ...horas.map(h => h.hora))
  const max = Math.max(hasta, ...horas.map(h => h.hora))
  const serie: { hora: number; lecturas: number }[] = []
  for (let h = min; h <= max; h++)
    serie.push({ hora: h, lecturas: porHora.get(h) ?? 0 })

  return serie
}

/** Nombre de archivo que manda el servidor en Content-Disposition, o uno por defecto. */
export function nombreArchivo(sector: string, periodo: number | null): string {
  const limpio = sector.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '')

  return `pendientes_${limpio || 'sector'}_${periodo ?? 'periodo'}.xlsx`
}

/** Detalle de un sector (solo lectura) y exportación de sus pendientes a Excel. */
export function useDetalleSector() {
  const detalle = ref<RespuestaDetalleSector | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const exportando = ref(false)
  const errorExportar = ref<ErrorReporte | null>(null)
  const parametros = ref<ParametrosMonitor>({})
  const sectorId = ref<number | null>(null)

  let controlador: AbortController | null = null

  const noVisible = computed(() => error.value?.codigo === 'NO_ENCONTRADO')
  const avance = computed(() => detalle.value?.avance ?? null)
  const soloTarifaFija = computed(() => !!avance.value && avance.value.esperadas_medidas === 0 && avance.value.tarifa_fija > 0)
  const leyeronSinAsignar = computed(() => (detalle.value?.lecturistas ?? []).filter(l => !l.asignado && l.lecturas > 0))
  const asignadosSinLeer = computed(() => (detalle.value?.lecturistas ?? []).filter(l => l.asignado && l.lecturas === 0))

  async function cargar(sector: number, params: ParametrosMonitor) {
    controlador?.abort()
    controlador = new AbortController()
    sectorId.value = sector
    parametros.value = { ...params }
    cargando.value = true
    error.value = null
    errorExportar.value = null
    detalle.value = null
    try {
      detalle.value = await obtenerDetalleSector(sector, params, { signal: controlador.signal })
    }
    catch (e) {
      const n = normalizarError(e)
      if (n.codigo !== 'CANCELADO')
        error.value = n
    }
    finally {
      cargando.value = false
    }
  }

  /** Descarga el Excel de pendientes con el token y lo guarda desde el navegador. */
  async function exportar(): Promise<boolean> {
    if (sectorId.value === null || !detalle.value)
      return false
    exportando.value = true
    errorExportar.value = null
    try {
      const blob = await descargarPendientesSector(sectorId.value, parametros.value)
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')

      enlace.href = url
      enlace.download = nombreArchivo(detalle.value.sector.nombre, detalle.value.periodo?.id ?? null)
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1_000)

      return true
    }
    catch (e) {
      const n = normalizarError(e)
      if (n.codigo !== 'CANCELADO')
        errorExportar.value = n

      return false
    }
    finally {
      exportando.value = false
    }
  }

  function limpiar() {
    controlador?.abort()
    controlador = null
    detalle.value = null
    error.value = null
    errorExportar.value = null
    sectorId.value = null
  }

  return { detalle, avance, cargando, error, noVisible, exportando, errorExportar, soloTarifaFija, leyeronSinAsignar, asignadosSinLeer, cargar, exportar, limpiar }
}
