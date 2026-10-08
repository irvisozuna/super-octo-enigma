import { computed, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useContractStore } from '../stores/contractStore'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/** Paginación como la devuelve la API de Soporte (`limit`, `page` de entrada; `total` de salida). */
export interface PaginacionApi {
  limit: number
  offset: number
  count: number
  total: number
}

export interface RespuestaLista<T> {
  data: T[]
  pagination: PaginacionApi
}

type Fila = Record<string, any>

/** Copia de la fila con los nulos como «» y una clave estable para la tabla. */
export function filaLimpia<T extends Fila>(fila: T, clave: number): T & { _k: number } {
  const limpia: Fila = { _k: clave }
  for (const [k, v] of Object.entries(fila))
    limpia[k] = v === null ? '' : v

  return limpia as T & { _k: number }
}

/**
 * Lista paginada en el servidor de una pestaña de la ficha de contrato (facturas, pagos, lecturas, órdenes, convenios,
 * ajustes, notas). Carga al montar y cada vez que la pestaña vuelve a estar activa o cambia el contrato; ignora las
 * respuestas que llegan tarde; el error queda disponible para AsEstado en vez de perderse en la consola.
 *
 *   const lista = useListaContrato((id, p) => store.getBillingsByContract(id, p), () => props.activa)
 */
export function useListaContrato<T extends Fila = Fila>(
  obtener: (idCuenta: string, params: Record<string, unknown>) => Promise<RespuestaLista<T>>,
  activa: () => boolean,
  porPaginaInicial = 10,
) {
  const store = useContractStore()
  const filas = ref<(T & { _k: number })[]>([]) as Ref<(T & { _k: number })[]>
  const cargando = ref(false)
  const error = ref<ErrorReporte | null>(null)
  const pagina = ref(1)
  const porPagina = ref(porPaginaInicial)
  const total = ref(0)
  let peticion = 0

  const paginacion = computed(() => ({ pagina: pagina.value, porPagina: porPagina.value, total: total.value }))

  async function cargar() {
    const id = store.item?.id_account
    if (!id)
      return
    const n = ++peticion

    cargando.value = true
    error.value = null
    try {
      const r = await obtener(String(id), { limit: porPagina.value, page: pagina.value })
      if (n !== peticion)
        return
      const base = (pagina.value - 1) * porPagina.value

      filas.value = (r.data ?? []).map((f, i) => filaLimpia(f, base + i))
      total.value = r.pagination?.total ?? filas.value.length
    }
    catch (e) {
      if (n === peticion)
        error.value = normalizarError(e)
    }
    finally {
      if (n === peticion)
        cargando.value = false
    }
  }

  function cambiarPagina(p: number) {
    pagina.value = p
    cargar()
  }

  function cambiarPorPagina(n: number) {
    porPagina.value = n
    pagina.value = 1
    cargar()
  }

  onMounted(cargar)
  watch(activa, v => {
    if (v)
      cargar()
  })
  watch(() => store.item?.id_account, () => {
    pagina.value = 1
    if (activa())
      cargar()
  })

  return { filas, cargando, error, paginacion, pagina, porPagina, total, cargar, cambiarPagina, cambiarPorPagina }
}
