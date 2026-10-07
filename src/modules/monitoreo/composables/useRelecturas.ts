import { computed, reactive, ref } from 'vue'
import { cancelarRelectura, descargarRelecturasPdf, obtenerRelecturas } from '../services/monitoreoApi'
import type { FiltrosRelecturas, Relectura, RespuestaRelecturas } from '../types/relecturas'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

export function filtrosRelecturasIniciales(): FiltrosRelecturas {
  return { periodo: null, gerencia: null, sector: null, lecturista: null, estado: 'solicitada' }
}

/** Parámetros para la API: solo lo que tiene valor. */
export function parametrosRelecturas(f: FiltrosRelecturas): Record<string, string | number> {
  const p: Record<string, string | number> = { estado: f.estado }
  if (f.periodo)
    p.periodo = f.periodo
  if (f.gerencia)
    p.gerencia = f.gerencia
  if (f.sector)
    p.sector = f.sector
  if (f.lecturista)
    p.lecturista = f.lecturista

  return p
}

/** Agrupa las pendientes por lecturista y sector en orden de secuencia (misma agrupación que la lista imprimible). */
export function agruparPendientes(filas: Relectura[]): { clave: string; lecturista: string; sector: string; filas: Relectura[] }[] {
  const grupos = new Map<string, { clave: string; lecturista: string; sector: string; filas: Relectura[] }>()
  for (const f of filas) {
    const lecturista = f.lecturista ?? 'Sin lecturista'
    const sector = f.sector ?? 'Sin sector'
    const clave = `${f.lecturista_id ?? 0}|${f.sector_id ?? 0}`
    if (!grupos.has(clave))
      grupos.set(clave, { clave, lecturista, sector, filas: [] })
    grupos.get(clave)!.filas.push(f)
  }

  return [...grupos.values()]
    .sort((a, b) => a.lecturista.localeCompare(b.lecturista) || a.sector.localeCompare(b.sector))
    .map(g => ({ ...g, filas: [...g.filas].sort((a, b) => (a.secuencia ?? Number.MAX_SAFE_INTEGER) - (b.secuencia ?? Number.MAX_SAFE_INTEGER)) }))
}

export function useRelecturas() {
  const filtros = reactive<FiltrosRelecturas>(filtrosRelecturasIniciales())
  const datos = ref<RespuestaRelecturas | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const accionando = ref<string | null>(null)
  const errorAccion = ref<ErrorReporte | null>(null)
  const exportando = ref(false)

  let controlador: AbortController | null = null

  const filas = computed(() => datos.value?.filas ?? [])
  const conteos = computed(() => datos.value?.conteos ?? { solicitada: 0, releida: 0, cancelada: 0 })
  const puedeOperar = computed(() => datos.value?.puede_operar ?? false)
  const grupos = computed(() => agruparPendientes(filas.value))

  async function cargar() {
    controlador?.abort()
    controlador = new AbortController()
    cargando.value = true
    try {
      datos.value = await obtenerRelecturas(parametrosRelecturas(filtros), { signal: controlador.signal })
      error.value = null
      if (datos.value.periodo && !filtros.periodo)
        filtros.periodo = datos.value.periodo.id
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

  function aplicar(parcial: Partial<FiltrosRelecturas>) {
    Object.assign(filtros, parcial)

    return cargar()
  }

  async function cancelar(id: string, nota?: string | null): Promise<Relectura | null> {
    accionando.value = id
    errorAccion.value = null
    try {
      const r = await cancelarRelectura(id, nota)
      if (datos.value) {
        const i = datos.value.filas.findIndex(f => f.id === id)
        if (i >= 0) {
          if (filtros.estado === 'solicitada')
            datos.value.filas.splice(i, 1)
          else datos.value.filas.splice(i, 1, r)
        }
        datos.value.conteos.solicitada = Math.max(0, datos.value.conteos.solicitada - 1)
        datos.value.conteos.cancelada += 1
      }

      return r
    }
    catch (e) {
      errorAccion.value = normalizarError(e)

      return null
    }
    finally {
      accionando.value = null
    }
  }

  async function exportarPdf() {
    exportando.value = true
    errorAccion.value = null
    try {
      const blob = await descargarRelecturasPdf(parametrosRelecturas(filtros))
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `relecturas_pendientes_${filtros.periodo ?? ''}.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
    catch (e) {
      errorAccion.value = normalizarError(e)
    }
    finally {
      exportando.value = false
    }
  }

  function detener() {
    controlador?.abort()
  }

  return { filtros, datos, filas, grupos, conteos, puedeOperar, cargando, error, accionando, errorAccion, exportando, cargar, aplicar, cancelar, exportarPdf, detener }
}
