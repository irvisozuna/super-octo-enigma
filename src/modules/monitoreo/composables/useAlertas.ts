import { computed, reactive, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'
import { accionarAlerta, obtenerAlertas, obtenerEventosAlerta } from '../services/monitoreoApi'
import type { AccionAlerta, Alerta, EventoAlerta, FiltrosAlertas, RespuestaAlertas } from '../types/alertas'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

export function filtrosAlertasIniciales(): FiltrosAlertas {
  return { estado: 'activas', severidad: null, regla: null, tipo: null, gerencia: null, q: '', pagina: 1, por_pagina: 50 }
}

/** Parámetros para la API: solo lo que tiene valor. */
export function parametrosAlertas(f: FiltrosAlertas): Record<string, string | number> {
  const p: Record<string, string | number> = { estado: f.estado, pagina: f.pagina, por_pagina: f.por_pagina }
  if (f.severidad)
    p.severidad = f.severidad
  if (f.regla)
    p.regla = f.regla
  if (f.tipo)
    p.tipo = f.tipo
  if (f.gerencia)
    p.gerencia = f.gerencia
  if (f.q.trim())
    p.q = f.q.trim()

  return p
}

/** A dónde lleva "ver en el monitor" según el sujeto de la alerta (null si no hay a dónde ir). */
export function destinoSujeto(a: Alerta): RouteLocationRaw | null {
  const partes = a.sujeto_id.split(':')
  const periodo = a.periodo_id ? { periodo: String(a.periodo_id), vista: 'periodo' } : {}
  const detalle = a.detalle ?? {}
  const sectorDetalle = typeof detalle.sector_id === 'number' ? String(detalle.sector_id) : null
  const ir = (query: Record<string, string>): RouteLocationRaw => ({ name: 'monitoreoInicio', query })

  if (a.sujeto_tipo === 'sector')
    return partes[0] === '0' ? null : ir({ sector: partes[0], ...periodo })
  if (a.sujeto_tipo === 'lecturista' && a.regla === 'R11')
    return sectorDetalle ? ir({ sector: sectorDetalle, ...periodo }) : null
  if (a.sujeto_tipo === 'lecturista' && a.regla === 'R8')
    return ir({ lecturista: partes[0], dia: partes[1] })
  if (a.sujeto_tipo === 'lecturista' || a.sujeto_tipo === 'dispositivo')
    return ir({ lecturista: partes[0] })
  if (a.sujeto_tipo === 'lectura' || a.sujeto_tipo === 'contrato')
    return sectorDetalle ? ir({ sector: sectorDetalle, ...periodo }) : null
  if (a.sujeto_tipo === 'gerencia')
    return partes[0] === '0' ? null : ir({ gerencia: partes[0], ...periodo })

  return null
}

/** Bandeja de alertas: filtros, paginación, acciones y refresco automático cada minuto mientras la pestaña esté visible. */
export function useAlertas(refrescoMs = 60_000) {
  const filtros = reactive<FiltrosAlertas>(filtrosAlertasIniciales())
  const datos = ref<RespuestaAlertas | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const accionando = ref<string | null>(null)
  const errorAccion = ref<ErrorReporte | null>(null)
  const eventos = ref<EventoAlerta[]>([])
  const cargandoEventos = ref(false)

  let controlador: AbortController | null = null

  const filas = computed(() => datos.value?.filas ?? [])
  const total = computed(() => datos.value?.total ?? 0)
  const resumen = computed(() => datos.value?.resumen ?? null)
  const reglas = computed(() => datos.value?.reglas ?? [])
  const puedeOperar = computed(() => datos.value?.puede_operar ?? false)
  const paginas = computed(() => Math.max(1, Math.ceil(total.value / filtros.por_pagina)))

  async function cargar(silencioso = false) {
    controlador?.abort()
    controlador = new AbortController()
    if (!silencioso)
      cargando.value = true
    try {
      datos.value = await obtenerAlertas(parametrosAlertas(filtros), { signal: controlador.signal })
      error.value = null
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

  function aplicar(parcial: Partial<FiltrosAlertas>) {
    Object.assign(filtros, parcial)
    if (!('pagina' in parcial))
      filtros.pagina = 1

    return cargar()
  }

  function cancelar() {
    controlador?.abort()
  }

  async function accionar(id: string, accion: AccionAlerta, opciones: { nota?: string | null; horas?: number } = {}): Promise<Alerta | null> {
    accionando.value = id
    errorAccion.value = null
    try {
      const fila = await accionarAlerta(id, accion, opciones)
      if (datos.value) {
        const i = datos.value.filas.findIndex(f => f.id === id)
        if (i >= 0)
          datos.value.filas.splice(i, 1, fila)
      }
      cargar(true) // conteos y filtro de estado al día

      return fila
    }
    catch (e) {
      errorAccion.value = normalizarError(e)

      return null
    }
    finally {
      accionando.value = null
    }
  }

  async function verEventos(id: string) {
    cargandoEventos.value = true
    eventos.value = []
    try {
      eventos.value = (await obtenerEventosAlerta(id)).eventos
    }
    catch (e) {
      errorAccion.value = normalizarError(e)
    }
    finally {
      cargandoEventos.value = false
    }
  }

  const visible = useDocumentVisibility()

  const { pause, resume } = useIntervalFn(() => {
    if (visible.value === 'visible' && !cargando.value && accionando.value === null)
      cargar(true)
  }, refrescoMs, { immediate: true })

  return { filtros, datos, filas, total, paginas, resumen, reglas, puedeOperar, cargando, error, accionando, errorAccion, eventos, cargandoEventos, cargar, aplicar, cancelar, accionar, verEventos, pausarRefresco: pause, reanudarRefresco: resume }
}
