import { computed, ref } from 'vue'
import { copiarCalendario, descargarPlantillaCalendario, guardarCalendario, importarCalendario, obtenerCalendario } from '../services/monitoreoApi'
import type { EdicionCalendario, FilaCalendario, RespuestaCalendario, ResultadoCopia, ResultadoGuardado, ResultadoImportacion } from '../types/calendario'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/** Edición de una fila tal como está en pantalla (vacío = null). */
export function edicionDe(fila: FilaCalendario): EdicionCalendario {
  return { sector_id: fila.sector_id, programada: fila.programada || null, limite: fila.limite || null, lecturista_id: fila.lecturista_id ?? null, nota: fila.nota?.trim() || null }
}

export function mismaEdicion(a: EdicionCalendario, b: EdicionCalendario): boolean {
  return a.programada === b.programada && a.limite === b.limite && a.lecturista_id === b.lecturista_id && (a.nota ?? null) === (b.nota ?? null)
}

/** Días del mes con los sectores programados o con límite ese día (vista de calendario). */
export function agruparPorDia(filas: FilaCalendario[]): Record<string, { programados: FilaCalendario[]; limites: FilaCalendario[] }> {
  const out: Record<string, { programados: FilaCalendario[]; limites: FilaCalendario[] }> = {}
  const celda = (d: string) => (out[d] ??= { programados: [], limites: [] })
  for (const f of filas) {
    if (f.programada)
      celda(f.programada).programados.push(f)
    if (f.limite)
      celda(f.limite).limites.push(f)
  }

  return out
}

/** Calendario de lectura de un periodo: consulta, edición con cambios pendientes, copia del periodo anterior e importación. */
export function useCalendario() {
  const datos = ref<RespuestaCalendario | null>(null)
  const filas = ref<FilaCalendario[]>([])
  const originales = ref<Map<number, EdicionCalendario>>(new Map())
  const cargando = ref(false)
  const guardando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const ultimoResultado = ref<ResultadoGuardado | ResultadoCopia | ResultadoImportacion | null>(null)
  const periodo = ref<number | null>(null)
  const gerencia = ref<number | null>(null)

  let controlador: AbortController | null = null

  const cambios = computed(() => filas.value.map(edicionDe).filter(e => {
    const o = originales.value.get(e.sector_id)

    return !o || !mismaEdicion(o, e)
  }))

  const hayCambios = computed(() => cambios.value.length > 0)
  const puedeEditar = computed(() => datos.value?.puede_editar ?? false)
  const porDia = computed(() => agruparPorDia(filas.value))

  async function cargar(periodoId: number | null, gerenciaId: number | null) {
    controlador?.abort()
    controlador = new AbortController()
    periodo.value = periodoId
    gerencia.value = gerenciaId
    cargando.value = true
    error.value = null
    try {
      const r = await obtenerCalendario(periodoId, gerenciaId, { signal: controlador.signal })

      datos.value = r
      filas.value = r.sectores.map(s => ({ ...s }))
      originales.value = new Map(r.sectores.map(s => [s.sector_id, edicionDe(s)]))
      if (r.periodo)
        periodo.value = r.periodo.id
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

  async function guardar(): Promise<ResultadoGuardado | null> {
    if (!periodo.value || !cambios.value.length)
      return null
    guardando.value = true
    error.value = null
    try {
      const r = await guardarCalendario(periodo.value, cambios.value)

      ultimoResultado.value = r
      await cargar(periodo.value, gerencia.value)

      return r
    }
    catch (e) {
      const n = normalizarError(e)
      if (n.codigo !== 'CANCELADO')
        error.value = n

      return null
    }
    finally {
      guardando.value = false
    }
  }

  async function copiar(desde: number, sobrescribir = false): Promise<ResultadoCopia | null> {
    if (!periodo.value)
      return null
    guardando.value = true
    error.value = null
    try {
      const r = await copiarCalendario(periodo.value, desde, sobrescribir)

      ultimoResultado.value = r
      await cargar(periodo.value, gerencia.value)

      return r
    }
    catch (e) {
      const n = normalizarError(e)
      if (n.codigo !== 'CANCELADO')
        error.value = n

      return null
    }
    finally {
      guardando.value = false
    }
  }

  async function importar(archivo: File): Promise<ResultadoImportacion | null> {
    if (!periodo.value)
      return null
    guardando.value = true
    error.value = null
    try {
      const r = await importarCalendario(periodo.value, archivo)

      ultimoResultado.value = r
      await cargar(periodo.value, gerencia.value)

      return r
    }
    catch (e) {
      const n = normalizarError(e)
      if (n.codigo !== 'CANCELADO')
        error.value = n

      return null
    }
    finally {
      guardando.value = false
    }
  }

  async function plantilla(): Promise<boolean> {
    if (!periodo.value)
      return false
    try {
      const blob = await descargarPlantillaCalendario(periodo.value, gerencia.value)
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')

      enlace.href = url
      enlace.download = `calendario_${periodo.value}.xlsx`
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1_000)

      return true
    }
    catch (e) {
      const n = normalizarError(e)
      if (n.codigo !== 'CANCELADO')
        error.value = n

      return false
    }
  }

  function descartarCambios() {
    filas.value = (datos.value?.sectores ?? []).map(s => ({ ...s }))
  }

  return { datos, filas, cambios, hayCambios, puedeEditar, porDia, cargando, guardando, error, ultimoResultado, periodo, gerencia, cargar, guardar, copiar, importar, plantilla, descartarCambios }
}
