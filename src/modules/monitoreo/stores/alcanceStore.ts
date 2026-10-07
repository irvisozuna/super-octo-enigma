import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { obtenerMe } from '../services/monitoreoApi'
import type { RespuestaMe } from '../types/api'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'

/** Permisos y alcance por gerencia del usuario en el monitoreo; lo comparten el inicio, los filtros y el quiosco. */
export const useAlcanceStore = defineStore('monitoreoAlcance', () => {
  const me = ref<RespuestaMe | null>(null)
  const cargado = ref(false)
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)

  const gerencias = computed(() => me.value?.alcance.gerencias ?? [])
  const todas = computed(() => me.value?.alcance.todas ?? false)
  const sinAsignar = computed(() => me.value?.alcance.sin_asignar ?? false)
  const puedeOperar = computed(() => me.value?.permisos.operar ?? false)
  const puedeAdministrar = computed(() => me.value?.permisos.administrar ?? false)

  async function cargar(signal?: AbortSignal) {
    cargando.value = true
    try {
      me.value = await obtenerMe({ signal })
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
    me.value = null
    cargado.value = false
    error.value = null
  }

  return { me, cargado, cargando, error, gerencias, todas, sinAsignar, puedeOperar, puedeAdministrar, cargar, limpiar }
})
