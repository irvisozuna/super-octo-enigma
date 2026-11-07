import { reactive, ref } from 'vue'
import { guardarAgente, obtenerAgentes, obtenerCatalogo, obtenerOrdenes, obtenerPuente } from '../services/ordenesApi'
import type { Agente, EdicionAgente, FiltrosOrdenes, Orden, Paginacion, RespuestaPuente, TipoOrden } from '../types/ordenes'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

export function filtrosOrdenesIniciales(): FiltrosOrdenes {
  return { tipo: null, estado: null, agente: null, cuenta: '', abiertas: null }
}

/** Parámetros para la API: solo lo que tiene valor; `abiertas` va como 1/0. */
export function parametrosOrdenes(f: FiltrosOrdenes, pagina: number, porPagina: number): Record<string, string | number> {
  const p: Record<string, string | number> = { page: pagina, por_pagina: porPagina }
  if (f.tipo)
    p.tipo = f.tipo
  if (f.estado)
    p.estado = f.estado
  if (f.agente)
    p.agente = f.agente
  if (f.cuenta.trim())
    p.cuenta = f.cuenta.trim()
  if (f.abiertas !== null)
    p.abiertas = f.abiertas ? 1 : 0

  return p
}

/** Órdenes de trabajo de todos los tipos, con filtros y paginación del servidor. */
export function useOrdenes(porPagina = 50) {
  const filtros = reactive<FiltrosOrdenes>(filtrosOrdenesIniciales())
  const tipos = ref<TipoOrden[]>([])
  const filas = ref<Orden[]>([])
  const paginacion = ref<Paginacion>({ pagina: 1, por_pagina: porPagina, total: 0 })
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)

  async function cargar(pagina = 1) {
    cargando.value = true
    try {
      const r = await obtenerOrdenes(parametrosOrdenes(filtros, pagina, porPagina))

      filas.value = r.ordenes
      paginacion.value = r.paginacion
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  async function iniciar() {
    tipos.value = (await obtenerCatalogo().catch(() => null))?.tipos ?? []
    await cargar(1)
  }

  function aplicar(parcial: Partial<FiltrosOrdenes>) {
    Object.assign(filtros, parcial)
    if ('tipo' in parcial)
      filtros.estado = null

    return cargar(1)
  }

  return { filtros, tipos, filas, paginacion, cargando, error, cargar, iniciar, aplicar }
}

/** Agentes de campo: lista y alta o edición (solo quien administra órdenes). */
export function useAgentes() {
  const agentes = ref<Agente[]>([])
  const puedeAdministrar = ref(false)
  const cargando = ref(false)
  const guardando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const errorGuardar = ref<ErrorReporte | null>(null)

  async function cargar() {
    cargando.value = true
    try {
      const r = await obtenerAgentes()

      agentes.value = r.agentes
      puedeAdministrar.value = r.puede_administrar
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  async function guardar(id: string | null, datos: EdicionAgente): Promise<Agente | null> {
    guardando.value = true
    errorGuardar.value = null
    try {
      const a = await guardarAgente(id, { ...datos, nombre: datos.nombre.trim() })
      const i = agentes.value.findIndex(x => x.id === a.id)

      i >= 0 ? agentes.value.splice(i, 1, a) : agentes.value.push(a)
      agentes.value.sort((x, y) => x.nombre.localeCompare(y.nombre))

      return a
    }
    catch (e) {
      errorGuardar.value = normalizarError(e)

      return null
    }
    finally {
      guardando.value = false
    }
  }

  return { agentes, puedeAdministrar, cargando, guardando, error, errorGuardar, cargar, guardar }
}

/** Estado del puente hacia Aquasoft Comercial (solo Sistemas). */
export function usePuente() {
  const datos = ref<RespuestaPuente | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)

  async function cargar() {
    cargando.value = true
    try {
      datos.value = await obtenerPuente()
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargando.value = false
    }
  }

  return { datos, cargando, error, cargar }
}
