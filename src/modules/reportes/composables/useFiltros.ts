import { computed, onScopeDispose, ref, shallowRef, unref } from 'vue'
import type { MaybeRef } from 'vue'
import { esCancelacion } from '../services/errores'
import { opcionesFiltro } from '../services/reportesApi'
import type { FiltroDef, Opcion, ValoresFiltros } from '../types/reporte'
import { aPayload as construirPayload, estaVacio, etiquetaValor, valorInicial } from '../utils/filtros'

/**
 * Estado de los filtros de un reporte: valores, opciones (fijas o remotas), cascada padre → hijo,
 * validación de obligatorios y el payload que se manda al API.
 */
export function useFiltros(definiciones: MaybeRef<FiltroDef[]>) {
  const defs = computed(() => unref(definiciones))
  const valores = ref<ValoresFiltros>({})
  const opciones = shallowRef<Record<string, Opcion[]>>({})
  const cargandoOpciones = ref<Record<string, boolean>>({})
  const errores = ref<Record<string, string>>({})
  const controladores = new Map<string, AbortController>()

  const completo = computed(() => defs.value.every(def => !def.requerido || !estaVacio(valores.value[def.key])))
  const faltantes = computed(() => defs.value.filter(def => def.requerido && estaVacio(valores.value[def.key])))

  function aplicarDefaults() {
    const iniciales: ValoresFiltros = {}
    for (const def of defs.value)
      iniciales[def.key] = valorInicial(def)
    valores.value = iniciales
    errores.value = {}
  }

  function hijosDe(key: string) {
    return defs.value.filter(def => def.depende_de.includes(key))
  }

  function establecer(key: string, valor: unknown) {
    valores.value = { ...valores.value, [key]: valor }
    if (errores.value[key]) {
      const { [key]: _, ...resto } = errores.value

      errores.value = resto
    }

    // Cascada: al cambiar el padre se limpian los hijos y se recargan sus opciones
    for (const hijo of hijosDe(key)) {
      valores.value = { ...valores.value, [hijo.key]: hijo.tipo === 'multiselect' ? [] : null }
      void cargarOpciones(hijo)
    }
  }

  function validar(): boolean {
    const nuevos: Record<string, string> = {}
    for (const def of faltantes.value)
      nuevos[def.key] = 'requerido'
    errores.value = nuevos

    return Object.keys(nuevos).length === 0
  }

  async function cargarOpciones(def: FiltroDef, q?: string) {
    if (!def.opciones_remotas) {
      opciones.value = { ...opciones.value, [def.key]: def.opciones ?? [] }

      return
    }

    const padres: Record<string, unknown> = {}
    for (const padre of def.depende_de) {
      if (estaVacio(valores.value[padre])) {
        opciones.value = { ...opciones.value, [def.key]: [] }

        return
      }
      padres[padre] = valores.value[padre]
    }

    controladores.get(def.key)?.abort()

    const controlador = new AbortController()

    controladores.set(def.key, controlador)
    cargandoOpciones.value = { ...cargandoOpciones.value, [def.key]: true }

    try {
      const limite = typeof def.config.limit === 'number' ? def.config.limit : undefined
      const resultado = await opcionesFiltro(def.key, { padres, q, limite }, { signal: controlador.signal })

      opciones.value = { ...opciones.value, [def.key]: resultado }
    }
    catch (e) {
      if (!esCancelacion(e))
        opciones.value = { ...opciones.value, [def.key]: [] }
    }
    finally {
      if (controladores.get(def.key) === controlador) {
        controladores.delete(def.key)
        cargandoOpciones.value = { ...cargandoOpciones.value, [def.key]: false }
      }
    }
  }

  /** Carga las opciones de todos los filtros con lista (los de búsqueda esperan a que el usuario escriba). */
  function cargarTodasLasOpciones() {
    for (const def of defs.value) {
      if (def.tipo !== 'search' && def.tipo !== 'text' && def.tipo !== 'number' && def.tipo !== 'boolean' && def.tipo !== 'date_range')
        void cargarOpciones(def)
    }
  }

  function aPayload(): ValoresFiltros {
    return construirPayload(defs.value, valores.value)
  }

  function etiqueta(def: FiltroDef, valor: unknown = valores.value[def.key]): string {
    return etiquetaValor(def, valor, opciones.value[def.key] ?? def.opciones ?? [])
  }

  function limpiar() {
    aplicarDefaults()
  }

  onScopeDispose(() => {
    controladores.forEach(c => c.abort())
    controladores.clear()
  })

  return {
    defs,
    valores,
    opciones,
    cargandoOpciones,
    errores,
    completo,
    faltantes,
    aplicarDefaults,
    establecer,
    validar,
    cargarOpciones,
    cargarTodasLasOpciones,
    aPayload,
    etiqueta,
    limpiar,
  }
}

export type Filtros = ReturnType<typeof useFiltros>
