import { computed, reactive, ref } from 'vue'
import { decidirCoordenada, descargarCoordenadasCsv, obtenerCoordenadas } from '../services/monitoreoApi'
import type { FiltrosCoordenadas, PropuestaCoordenada, RespuestaCoordenadas } from '../types/coordenadas'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

export function filtrosCoordenadasIniciales(): FiltrosCoordenadas {
  return { tipo: null, estado: 'propuesta', gerencia: null, confianza: null, q: '', pagina: 1, por_pagina: 50 }
}

/** Parámetros para la API: solo lo que tiene valor. */
export function parametrosCoordenadas(f: FiltrosCoordenadas, paginar = true): Record<string, string | number> {
  const p: Record<string, string | number> = {}
  if (f.tipo)
    p.tipo = f.tipo
  if (f.estado)
    p.estado = f.estado
  if (f.gerencia)
    p.gerencia = f.gerencia
  if (f.confianza)
    p.confianza = f.confianza
  if (f.q.trim())
    p.q = f.q.trim()
  if (paginar) {
    p.pagina = f.pagina
    p.por_pagina = f.por_pagina
  }

  return p
}

/** Lista de propuestas de coordenada, decisiones y CSV. El servidor acota al alcance y decide quién puede decidir. */
export function useCoordenadas() {
  const filtros = reactive<FiltrosCoordenadas>(filtrosCoordenadasIniciales())
  const datos = ref<RespuestaCoordenadas | null>(null)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const decidiendo = ref<number | null>(null)
  const errorDecision = ref<ErrorReporte | null>(null)
  const exportando = ref(false)

  let controlador: AbortController | null = null

  const filas = computed(() => datos.value?.filas ?? [])
  const total = computed(() => datos.value?.total ?? 0)
  const paginas = computed(() => Math.max(1, Math.ceil(total.value / filtros.por_pagina)))
  const resumen = computed(() => datos.value?.resumen ?? null)
  const puedeDecidir = computed(() => datos.value?.puede_decidir ?? false)
  const abiertas = computed(() => (resumen.value ? resumen.value.sin_coordenada.propuesta + resumen.value.desactualizada.propuesta : 0))

  async function cargar() {
    controlador?.abort()
    controlador = new AbortController()
    cargando.value = true
    error.value = null
    try {
      datos.value = await obtenerCoordenadas(parametrosCoordenadas(filtros), { signal: controlador.signal })
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

  function aplicar(cambios: Partial<FiltrosCoordenadas>) {
    Object.assign(filtros, cambios)
    if (!('pagina' in cambios))
      filtros.pagina = 1

    return cargar()
  }

  /** Decide sobre una fila y la reemplaza en la lista con lo que devuelve el servidor (sin recargar todo). */
  async function decidir(fila: PropuestaCoordenada, accion: 'aceptar' | 'descartar' | 'reabrir', nota?: string | null): Promise<boolean> {
    decidiendo.value = fila.contrato_id
    errorDecision.value = null
    try {
      const nueva = await decidirCoordenada(fila.contrato_id, accion, nota)
      if (datos.value) {
        datos.value = {
          ...datos.value,
          filas: datos.value.filas.map(f => (f.contrato_id === nueva.contrato_id ? nueva : f)),
          resumen: moverResumen(datos.value.resumen, fila, nueva),
        }
      }

      return true
    }
    catch (e) {
      const n = normalizarError(e)
      if (n.codigo !== 'CANCELADO')
        errorDecision.value = n

      return false
    }
    finally {
      decidiendo.value = null
    }
  }

  async function exportar(): Promise<boolean> {
    exportando.value = true
    try {
      const blob = await descargarCoordenadasCsv(parametrosCoordenadas(filtros, false))
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')

      enlace.href = url
      enlace.download = `coordenadas_propuestas_${new Date().toISOString().slice(0, 10)}.csv`
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
    finally {
      exportando.value = false
    }
  }

  function cancelar() {
    controlador?.abort()
  }

  return { filtros, datos, filas, total, paginas, resumen, puedeDecidir, abiertas, cargando, error, decidiendo, errorDecision, exportando, cargar, aplicar, decidir, exportar, cancelar }
}

/** Ajusta los conteos del resumen al cambiar el estado de una fila (sin volver al servidor). */
export function moverResumen(resumen: RespuestaCoordenadas['resumen'], antes: PropuestaCoordenada, despues: PropuestaCoordenada): RespuestaCoordenadas['resumen'] {
  if (antes.estado === despues.estado)
    return resumen
  const copia = { ...resumen, [antes.tipo]: { ...resumen[antes.tipo] } }

  copia[antes.tipo][antes.estado] = Math.max(0, copia[antes.tipo][antes.estado] - 1)
  copia[antes.tipo][despues.estado] = (copia[antes.tipo][despues.estado] ?? 0) + 1

  return copia
}
