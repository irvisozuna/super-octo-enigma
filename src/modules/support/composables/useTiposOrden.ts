import { ref } from 'vue'
import { useContractStore } from '../stores/contractStore'

/*
 * Nombre legible del tipo de una orden de trabajo. La orden trae la clave del catálogo de Aquasoft Comercial
 * (`READING_INSPECTION`); el nombre («Inspección de lectura») está en el catálogo que ya sirve la API. Se pide una vez
 * por sesión y se comparte entre la pestaña de órdenes y el detalle.
 */
const nombres = ref<Record<string, string>>({})
let peticion: Promise<void> | null = null

/** El catálogo trae «Other» sin traducir; se corrige aquí. */
const CORRECCIONES: Record<string, string> = { OTHER: 'Otro' }

export function useTiposOrden() {
  const store = useContractStore()

  if (!peticion) {
    peticion = store.customAction('/getTypeCodes', 'GET', { itemsPerPage: 1000, page: 1 })
      .then((lista: { rowid: string; name: string }[]) => {
        nombres.value = Object.fromEntries((Array.isArray(lista) ? lista : []).map(t => [t.rowid, t.name.replace(/\xA0/g, ' ')]))
      })
      .catch(() => {
        // Sin catálogo se muestra la clave; se reintenta la próxima vez que se use
        peticion = null
      })
  }

  /** Nombre del tipo; si la clave no está en el catálogo (tipo inactivo), la propia clave. */
  function nombreTipo(clave: unknown): string {
    const c = String(clave ?? '')

    return c ? CORRECCIONES[c] ?? nombres.value[c] ?? c : '—'
  }

  return { nombreTipo }
}
