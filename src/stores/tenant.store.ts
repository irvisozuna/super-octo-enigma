import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface TenantAssets {
  logo?: string
  menu?: string
  favicon?: string
  loading?: string
}

export interface TenantTheme {
  primary: string
  secondary: string
  dark: boolean
}

export interface TenantI18n {
  locale: string
  timezone: string
}

export interface TenantData {
  companyId: string
  slug: string
  name: string
  assets: TenantAssets
  theme: TenantTheme
  i18n: TenantI18n
  plan?: string
  flags?: Record<string, any>
  version: string

  // Company configuration fields (opcional, viene del backend)
  primaryColor?: string
  primaryDarkenColor?: string
  secondaryColor?: string
  secondaryDarkenColor?: string
  skin?: 'default' | 'bordered'
  semiDarkMenu?: boolean
  layout?: 'vertical' | 'collapsed' | 'horizontal'
  contentWidth?: 'boxed' | 'fluid'
  appTitle?: string
  homeUrl?: string // URL de inicio después del login (ej: "/dashboards/crm")
  updatedAt?: string
}

export interface TenantState {
  data: TenantData | null
  ready: boolean
  error: string | null
  loading: boolean
}

export const useTenantStore = defineStore('tenant', () => {
  // State
  const data = ref<TenantData | null>(null)
  const ready = ref(false)
  const error = ref<string | null>(null)
  const loading = ref(false)

  // Getters
  const isReady = computed(() => ready.value && !error.value)
  const hasError = computed(() => !!error.value)
  const isLoading = computed(() => loading.value)
  const organization = computed(() => data.value?.slug || '')

  // Actions
  function setLoading(value: boolean) {
    loading.value = value
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
    ready.value = true
    loading.value = false
  }

  function setTenantData(tenantData: TenantData) {
    data.value = tenantData
    ready.value = true
    error.value = null
    loading.value = false
  }

  function reset() {
    data.value = null
    ready.value = false
    error.value = null
    loading.value = false
  }

  // Cache management
  function saveToCache() {
    if (data.value) {
      const cacheData = {
        data: data.value,
        timestamp: Date.now(),
        version: data.value.version,
      }

      localStorage.setItem('tenantBoot', JSON.stringify(cacheData))
    }
  }

  function loadFromCache(): TenantData | null {
    try {
      const cached = localStorage.getItem('tenantBoot')
      if (!cached)
        return null

      const cacheData = JSON.parse(cached)

      // Check if cache is still valid (optional TTL of 15 minutes)
      const TTL = 15 * 60 * 1000 // 15 minutes
      if (Date.now() - cacheData.timestamp > TTL) {
        localStorage.removeItem('tenantBoot')

        return null
      }

      return cacheData.data
    }
    catch (error) {
      console.warn('Error loading tenant cache:', error)
      localStorage.removeItem('tenantBoot')

      return null
    }
  }

  function clearCache() {
    localStorage.removeItem('tenantBoot')
  }

  return {
    // State
    data,
    ready,
    error,
    loading,

    // Getters
    isReady,
    hasError,
    isLoading,
    organization,

    // Actions
    setLoading,
    setError,
    setTenantData,
    reset,
    saveToCache,
    loadFromCache,
    clearCache,
  }
})
