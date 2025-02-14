// src/composables/useCrud.ts
import { onMounted, watch } from 'vue'

interface UseCrudOptions {
  autoFetch?: boolean
}

/**
 * Engancha un store CRUD: observa cambios en page, filters, etc.
 */
export function useCrud(store: any, options: UseCrudOptions = {}) {
  const { autoFetch = true } = options

  onMounted(() => {
    if (autoFetch) {
      store.fetchList()
    }
  })

  watch(
    () => [store.page, store.itemsPerPage, store.sortBy, store.sortOrder, store.filters],
    () => {
      if (autoFetch) {
        store.fetchList()
      }
    },
    { deep: true },
  )

  // Retornar todo el store (o lo que necesites)
  return { ...store }
}
