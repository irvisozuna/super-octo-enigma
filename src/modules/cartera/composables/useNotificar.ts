import { computed, reactive, ref } from 'vue'
import { contarCuentas, generarLote, obtenerCatalogos, vistaPrevia } from '../services/carteraApi'
import type { CuentaCandidata, FiltrosBusqueda, OrdenVistaPrevia, RespuestaCatalogos, RespuestaGenerar, ResumenBusqueda } from '../types/cartera'
import { cuerpoBusqueda, deGerencias, filtrosBusquedaIniciales, hijosDe, recortar } from '../utils/cartera'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/*
 * Notificar (F3 en pantalla): filtros, conteo, vista previa, selección de cuentas y generación del lote.
 * El conteo se pide solo al cambiar filtros (con espera); la lista se pide a mano porque puede ser larga.
 * Al generar, el servidor vuelve a buscar y descarta las marcadas que ya no cumplen.
 */
export function useNotificar(espera = 400) {
  const catalogos = ref<RespuestaCatalogos | null>(null)
  const filtros = reactive<FiltrosBusqueda>(filtrosBusquedaIniciales())
  const resumen = ref<ResumenBusqueda | null>(null)
  const cuentas = ref<CuentaCandidata[]>([])
  const capacidad = ref(45)
  const seleccion = ref<Set<number>>(new Set())
  const notificador = ref<string | null>(null)
  const contando = ref(false)
  const cargandoLista = ref(false)
  const generando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const resultado = ref<RespuestaGenerar | null>(null)
  const listaVigente = ref(false)
  const orden = ref<OrdenVistaPrevia>('recorrido')

  let temporizador: ReturnType<typeof setTimeout> | null = null
  let controladorConteo: AbortController | null = null

  const sistemas = computed(() => hijosDe(catalogos.value?.sistemas ?? [], filtros.gerencias))
  const sectores = computed(() => hijosDe(catalogos.value?.sectores ?? [], filtros.sistemas))
  const tiposContrato = computed(() => deGerencias(catalogos.value?.tipos_contrato ?? [], filtros.gerencias))
  const seleccionadas = computed(() => cuentas.value.filter(c => seleccion.value.has(c.contrato)))
  const totalSeleccionado = computed(() => seleccionadas.value.reduce((s, c) => s + c.adeudo, 0))
  const excedeCapacidad = computed(() => seleccion.value.size > capacidad.value)

  // XEL1-774: si el servidor no lo dice, se toma como apagada; el servidor rechaza igual
  const generacionActiva = computed(() => catalogos.value?.generacion_activa === true)
  const puedeGenerar = computed(() => generacionActiva.value && listaVigente.value && seleccion.value.size > 0 && !!notificador.value && !generando.value)

  async function iniciar() {
    try {
      catalogos.value = await obtenerCatalogos()
      capacidad.value = catalogos.value.configuracion.capacidad_lote
      await contar()
    }
    catch (e) {
      error.value = normalizarError(e)
    }
  }

  async function contar() {
    controladorConteo?.abort()
    controladorConteo = new AbortController()
    contando.value = true
    try {
      resumen.value = await contarCuentas(cuerpoBusqueda(filtros), { signal: controladorConteo.signal })
      error.value = null
    }
    catch (e) {
      if ((e as { name?: string }).name === 'AbortError')
        return
      error.value = normalizarError(e)
    }
    finally {
      contando.value = false
    }
  }

  /** Cambia filtros: la lista que se veía deja de valer y el conteo se repite tras una pausa. */
  function aplicar(parcial: Partial<FiltrosBusqueda>) {
    Object.assign(filtros, parcial)
    filtros.sistemas = recortar(filtros.sistemas, sistemas.value)
    filtros.sectores = recortar(filtros.sectores, sectores.value)
    filtros.tipos_contrato = recortar(filtros.tipos_contrato, tiposContrato.value)
    listaVigente.value = false
    if (temporizador)
      clearTimeout(temporizador)
    temporizador = setTimeout(() => {
      contar()
    }, espera)
  }

  function limpiar() {
    aplicar(filtrosBusquedaIniciales())
  }

  /**
   * Trae la lista y deja marcadas las primeras según la capacidad sugerida, en el orden elegido: recorrido o prioridad
   * (XEL1-663). El lote siempre se genera en orden de recorrido.
   */
  async function verCuentas() {
    cargandoLista.value = true
    try {
      const r = await vistaPrevia(cuerpoBusqueda(filtros), orden.value)

      cuentas.value = r.cuentas
      resumen.value = r.resumen
      capacidad.value = r.capacidad_sugerida
      seleccion.value = new Set(r.cuentas.slice(0, r.capacidad_sugerida).map(c => c.contrato))
      listaVigente.value = true
      error.value = null
    }
    catch (e) {
      error.value = normalizarError(e)
    }
    finally {
      cargandoLista.value = false
    }
  }

  function alternar(contrato: number) {
    const s = new Set(seleccion.value)

    s.has(contrato) ? s.delete(contrato) : s.add(contrato)
    seleccion.value = s
  }

  function marcar(contratos: number[], marcadas: boolean) {
    const s = new Set(seleccion.value)
    for (const c of contratos)
      marcadas ? s.add(c) : s.delete(c)
    seleccion.value = s
  }

  async function generar(): Promise<RespuestaGenerar | null> {
    if (!puedeGenerar.value || !notificador.value)
      return null
    generando.value = true
    try {
      // El servidor las acomoda en orden de recorrido
      const contratos = seleccionadas.value.map(c => c.contrato)

      resultado.value = await generarLote(cuerpoBusqueda(filtros), contratos, notificador.value)
      error.value = null
      listaVigente.value = false

      return resultado.value
    }
    catch (e) {
      error.value = normalizarError(e)

      return null
    }
    finally {
      generando.value = false
    }
  }

  function detener() {
    if (temporizador)
      clearTimeout(temporizador)
    controladorConteo?.abort()
  }

  return {
    catalogos,
    filtros,
    resumen,
    cuentas,
    capacidad,
    seleccion,
    notificador,
    contando,
    cargandoLista,
    generando,
    error,
    resultado,
    listaVigente,
    orden,
    sistemas,
    sectores,
    tiposContrato,
    seleccionadas,
    totalSeleccionado,
    excedeCapacidad,
    generacionActiva,
    puedeGenerar,
    iniciar,
    contar,
    aplicar,
    limpiar,
    verCuentas,
    alternar,
    marcar,
    generar,
    detener,
  }
}
