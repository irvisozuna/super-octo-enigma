import { computed, reactive, ref } from 'vue'

/**
 * COMPOSABLE GLOBAL REUTILIZABLE
 * Gestión centralizada de estados de carga para operaciones asíncronas
 * Útil para cualquier componente que necesite trackear múltiples operaciones
 */

export interface LoadingStateOptions {
  timeout?: number
  onTimeout?: () => void
}

export function useLoadingState(keys: string[] = []) {
  // Estado de carga individual por key
  const loadingStates = reactive<Record<string, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {}),
  )

  // Contadores de operaciones concurrentes
  const loadingCounts = reactive<Record<string, number>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
  )

  // Timeouts para detectar operaciones colgadas
  const timeouts = reactive<Record<string, NodeJS.Timeout | null>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: null }), {}),
  )

  /**
   * Verificar si algo está cargando
   */
  const isLoading = computed(() =>
    Object.values(loadingStates).some(state => state),
  )

  /**
   * Verificar si un key específico está cargando
   */
  function isKeyLoading(key: string): boolean {
    return loadingStates[key] || false
  }

  /**
   * Obtener todos los keys que están cargando
   */
  const loadingKeys = computed(() =>
    Object.keys(loadingStates).filter(key => loadingStates[key]),
  )

  /**
   * Iniciar estado de carga
   */
  function startLoading(key: string, options: LoadingStateOptions = {}) {
    // Incrementar contador de operaciones concurrentes
    if (!loadingCounts[key])
      loadingCounts[key] = 0

    loadingCounts[key]++

    loadingStates[key] = true

    // Configurar timeout si se especifica
    if (options.timeout) {
      // Limpiar timeout anterior si existe
      if (timeouts[key])
        clearTimeout(timeouts[key]!)

      timeouts[key] = setTimeout(() => {
        console.warn(`Loading timeout for key: ${key}`)
        stopLoading(key)

        if (options.onTimeout)
          options.onTimeout()
      }, options.timeout)
    }
  }

  /**
   * Detener estado de carga
   */
  function stopLoading(key: string) {
    // Decrementar contador
    if (loadingCounts[key] > 0) {
      loadingCounts[key]--
    }

    // Solo marcar como no cargando si no hay más operaciones pendientes
    if (loadingCounts[key] === 0) {
      loadingStates[key] = false

      // Limpiar timeout si existe
      if (timeouts[key]) {
        clearTimeout(timeouts[key]!)
        timeouts[key] = null
      }
    }
  }

  /**
   * Resetear todos los estados de carga
   */
  function resetAll() {
    Object.keys(loadingStates).forEach(key => {
      loadingStates[key] = false
      loadingCounts[key] = 0

      if (timeouts[key]) {
        clearTimeout(timeouts[key]!)
        timeouts[key] = null
      }
    })
  }

  /**
   * Wrapper para ejecutar función con loading state
   */
  async function withLoading<T>(
    key: string,
    fn: () => Promise<T>,
    options: LoadingStateOptions = {},
  ): Promise<T> {
    startLoading(key, options)

    try {
      return await fn()
    }
    finally {
      stopLoading(key)
    }
  }

  /**
   * Wrapper para múltiples operaciones con loading
   */
  async function withMultipleLoading<T>(
    operations: Array<{
      key: string
      fn: () => Promise<any>
      options?: LoadingStateOptions
    }>,
  ): Promise<any[]> {
    // Iniciar todos los loading states
    operations.forEach(op => startLoading(op.key, op.options))

    try {
      // Ejecutar todas las operaciones en paralelo
      const results = await Promise.allSettled(
        operations.map(op => op.fn()),
      )

      return results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value
        }
        else {
          console.error('Operation failed:', result.reason)

          return null
        }
      })
    }
    finally {
      // Detener todos los loading states
      operations.forEach(op => stopLoading(op.key))
    }
  }

  /**
   * Agregar nuevo key dinámicamente
   */
  function addLoadingKey(key: string) {
    if (!(key in loadingStates)) {
      loadingStates[key] = false
      loadingCounts[key] = 0
      timeouts[key] = null
    }
  }

  /**
   * Remover key
   */
  function removeLoadingKey(key: string) {
    if (timeouts[key])
      clearTimeout(timeouts[key]!)

    delete loadingStates[key]
    delete loadingCounts[key]
    delete timeouts[key]
  }

  return {
    // Estado
    loadingStates: readonly(loadingStates),
    loadingCounts: readonly(loadingCounts),

    // Computed
    isLoading,
    loadingKeys,

    // Methods
    isKeyLoading,
    startLoading,
    stopLoading,
    resetAll,
    withLoading,
    withMultipleLoading,
    addLoadingKey,
    removeLoadingKey,
  }
}

/**
 * Versión simple para un solo estado de carga
 */
export function useSimpleLoading(initialState = false) {
  const loading = ref(initialState)
  const error = ref<Error | null>(null)

  async function withLoading<T>(fn: () => Promise<T>): Promise<T | null> {
    loading.value = true
    error.value = null

    try {
      return await fn()
    }
    catch (e) {
      error.value = e as Error

      return null
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    withLoading,
  }
}
