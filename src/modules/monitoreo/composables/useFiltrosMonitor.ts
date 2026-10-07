import { computed, reactive, watch } from 'vue'
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { EstadoSector } from '../types/mapa'
import type { FiltrosMonitor, ParametrosMonitor, RespuestaCatalogos, VistaMonitor } from '../types/monitor'
import { hoyLocal } from '../utils/tiempo'

export const ESTADOS_SECTOR: EstadoSector[] = ['pendiente', 'iniciado', 'terminado', 'rezagado', 'sin_esperadas']

export function filtrosIniciales(): FiltrosMonitor {
  return { vista: 'hoy', periodo: null, dia: null, gerencia: null, sistema: null, sector: null, lecturista: null, estado: null }
}

function entero(valor: unknown): number | null {
  const n = typeof valor === 'string' && valor !== '' ? Number(valor) : null

  return n !== null && Number.isInteger(n) && n > 0 ? n : null
}

/** Lee los filtros de la query de la ruta (para compartir la URL); lo que no se entiende se ignora. */
export function filtrosDesdeQuery(query: LocationQuery): FiltrosMonitor {
  const base = filtrosIniciales()
  const dia = typeof query.dia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.dia) ? query.dia : null
  const estado = typeof query.estado === 'string' && (ESTADOS_SECTOR as string[]).includes(query.estado) ? query.estado as EstadoSector : null

  return {
    ...base,
    vista: query.vista === 'periodo' ? 'periodo' : 'hoy',
    periodo: entero(query.periodo),
    dia,
    gerencia: entero(query.gerencia),
    sistema: entero(query.sistema),
    sector: entero(query.sector),
    lecturista: entero(query.lecturista),
    estado,
  }
}

/** Query de la ruta a partir de los filtros: solo lo que difiere del valor por defecto. */
export function queryDesdeFiltros(f: FiltrosMonitor): LocationQueryRaw {
  const q: LocationQueryRaw = {}
  if (f.vista !== 'hoy')
    q.vista = f.vista
  for (const k of ['periodo', 'dia', 'gerencia', 'sistema', 'sector', 'lecturista', 'estado'] as const) {
    const v = f[k]
    if (v !== null && v !== undefined && v !== '')
      q[k] = String(v)
  }

  return q
}

/** Parámetros para la API: `dia` solo en la vista "hoy"; sin `dia` el servidor usa hoy. */
export function parametrosDesdeFiltros(f: FiltrosMonitor): ParametrosMonitor {
  const p: ParametrosMonitor = {}
  if (f.periodo)
    p.periodo = f.periodo
  if (f.vista === 'hoy' && f.dia && f.dia !== hoyLocal())
    p.dia = f.dia
  if (f.gerencia)
    p.gerencia = f.gerencia
  if (f.sistema)
    p.sistema = f.sistema
  if (f.sector)
    p.sector = f.sector
  if (f.lecturista)
    p.lecturista = f.lecturista
  if (f.estado)
    p.estado = f.estado

  return p
}

/** ¿Hay algún filtro que acote sectores (sistema, sector o lecturista)? El mapa entonces resalta solo esos. */
export function acotaSectores(f: FiltrosMonitor): boolean {
  return f.sistema !== null || f.sector !== null || f.lecturista !== null
}

/**
 * Filtros de la pantalla principal: estado reactivo, opciones dependientes (los sistemas y sectores de la gerencia
 * elegida, los lecturistas de esa gerencia) y coherencia (al cambiar la gerencia se sueltan los filtros que ya no
 * pertenecen a ella).
 */
export function useFiltrosMonitor(catalogos: () => RespuestaCatalogos | null, inicial: FiltrosMonitor = filtrosIniciales()) {
  const filtros = reactive<FiltrosMonitor>({ ...inicial })

  const sistemas = computed(() => (catalogos()?.sistemas ?? []).filter(s => filtros.gerencia === null || s.gerencia_id === filtros.gerencia))

  const sectores = computed(() => (catalogos()?.sectores ?? []).filter(s =>
    (filtros.gerencia === null || s.gerencia_id === filtros.gerencia) && (filtros.sistema === null || s.sistema_id === filtros.sistema)))

  const lecturistas = computed(() => (catalogos()?.lecturistas ?? []).filter(l => filtros.gerencia === null || l.gerencia_id === filtros.gerencia || l.gerencia_id === null))
  const periodos = computed(() => catalogos()?.periodos ?? [])

  const periodoAbierto = computed(() => periodos.value.find(p => p.abierto) ?? periodos.value[0] ?? null)
  const periodoActual = computed(() => periodos.value.find(p => p.id === filtros.periodo) ?? periodoAbierto.value)

  const activos = computed(() => {
    const n = ['gerencia', 'sistema', 'sector', 'lecturista', 'estado'].filter(k => filtros[k as keyof FiltrosMonitor] !== null).length

    return n + (filtros.vista === 'hoy' && filtros.dia && filtros.dia !== hoyLocal() ? 1 : 0) + (filtros.periodo && filtros.periodo !== periodoAbierto.value?.id ? 1 : 0)
  })

  const parametros = computed(() => parametrosDesdeFiltros(filtros))

  // Coherencia: lo que deja de pertenecer a la gerencia o al sistema elegidos se suelta
  watch(() => filtros.gerencia, () => {
    if (filtros.sistema !== null && !sistemas.value.some(s => s.id === filtros.sistema))
      filtros.sistema = null
    if (filtros.sector !== null && !sectores.value.some(s => s.id === filtros.sector))
      filtros.sector = null
    if (filtros.lecturista !== null && !lecturistas.value.some(l => l.id === filtros.lecturista))
      filtros.lecturista = null
  })
  watch(() => filtros.sistema, () => {
    if (filtros.sector !== null && !sectores.value.some(s => s.id === filtros.sector))
      filtros.sector = null
  })

  function cambiarVista(vista: VistaMonitor) {
    filtros.vista = vista
    if (vista === 'periodo')
      filtros.dia = null
  }

  function limpiar() {
    Object.assign(filtros, filtrosIniciales(), { vista: filtros.vista })
  }

  function aplicar(nuevos: Partial<FiltrosMonitor>) {
    Object.assign(filtros, nuevos)
  }

  return { filtros, sistemas, sectores, lecturistas, periodos, periodoAbierto, periodoActual, activos, parametros, cambiarVista, limpiar, aplicar }
}
