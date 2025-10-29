import { type TenantData } from '@/stores/tenant.store'

/**
 * PRE-CARGA el tenant y configura cookies ANTES de que Vue se inicialice
 * Esto asegura que Vuetify lea los colores correctos cuando se registra
 */
export const preloadTenantConfiguration = async (): Promise<void> => {
  try {
    console.log('🔍 Pre-loading tenant configuration (before Vue initialization)...')

    // 1. Detectar host/tenant
    const { host, tenant } = detectHostOrTenant()

    // 2. Intentar cargar desde cache primero
    const cachedTenant = loadTenantFromLocalStorage()

    let tenantData: TenantData | null = null

    if (cachedTenant) {
      console.log('📦 Using cached tenant:', cachedTenant.slug)
      tenantData = cachedTenant
    }
    else {
      // 3. Cargar desde API
      console.log('🌐 Fetching tenant from API:', { host, tenant })
      tenantData = await fetchTenantFromAPI(host, tenant)

      // Guardar en localStorage para próxima carga
      if (tenantData)
        saveTenantToLocalStorage(tenantData)
    }

    // 4. Si tenemos tenant data, aplicar configuración a cookies/localStorage
    if (tenantData) {
      await applyConfigurationToStorage(tenantData)
      console.log('✅ Tenant configuration pre-loaded successfully!')
    }
  }
  catch (error) {
    console.error('⚠️ Failed to pre-load tenant configuration:', error)

    // Continuar de todas formas - la app usará valores por defecto
  }
}

/**
 * Inicializa el tenant COMPLETO (stores, cache) DESPUÉS de que Pinia esté disponible
 */
export const initTenant = async (): Promise<void> => {
  try {
    console.log('⏳ Initializing tenant stores and cache...')

    const { tenantBootstrapService } = await import('@/services/tenantBootstrapService')

    await tenantBootstrapService.bootstrap()
    console.log('✅ Tenant stores initialized successfully')
  }
  catch (error) {
    console.error('❌ Tenant store initialization failed:', error)
  }
}

// ============================================================================
// Funciones auxiliares (no usan Vue/Pinia)
// ============================================================================

function detectHostOrTenant(): { host: string; tenant?: string } {
  const url = new URL(window.location.href)
  const host = url.hostname
  const tenantParam = url.searchParams.get('tenant')

  return {
    host,
    tenant: tenantParam || undefined,
  }
}

function loadTenantFromLocalStorage(): TenantData | null {
  try {
    const cached = localStorage.getItem('tenant-data')
    if (!cached)
      return null

    const data = JSON.parse(cached)

    // Validar que no esté expirado (24 horas)
    const cacheTime = localStorage.getItem('tenant-cache-time')
    if (cacheTime) {
      const elapsed = Date.now() - Number.parseInt(cacheTime)
      const maxAge = 24 * 60 * 60 * 1000 // 24 horas

      if (elapsed > maxAge) {
        console.log('⏰ Tenant cache expired')

        return null
      }
    }

    return data as TenantData
  }
  catch (error) {
    console.error('Failed to load tenant from cache:', error)

    return null
  }
}

function saveTenantToLocalStorage(tenantData: TenantData): void {
  try {
    localStorage.setItem('tenant-data', JSON.stringify(tenantData))
    localStorage.setItem('tenant-cache-time', Date.now().toString())
  }
  catch (error) {
    console.error('Failed to save tenant to cache:', error)
  }
}

async function fetchTenantFromAPI(host: string, tenant?: string): Promise<TenantData | null> {
  try {
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/tenant`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Tenant-Slug': tenant || '',
      },
      body: JSON.stringify({ host, tenant }),
    })

    if (!response.ok)
      throw new Error(`Failed to fetch tenant: ${response.status}`)

    const data = await response.json()

    if (!data.companyId || !data.slug)
      throw new Error('Invalid tenant data structure')

    return data as TenantData
  }
  catch (error) {
    console.error('Failed to fetch tenant from API:', error)

    return null
  }
}

async function applyConfigurationToStorage(tenantData: TenantData): Promise<void> {
  // Extraer configuración del tenant
  const config = {
    primaryColor: (tenantData as any).primaryColor || tenantData.theme?.primary || '#7367F0',
    primaryDarkenColor: (tenantData as any).primaryDarkenColor || '#675DD8',
    secondaryColor: (tenantData as any).secondaryColor || tenantData.theme?.secondary || '#FF9F43',
    secondaryDarkenColor: (tenantData as any).secondaryDarkenColor || '#E6892E',
    appTitle: (tenantData as any).appTitle || tenantData.name || 'Application',
    favicon: tenantData.assets?.favicon,
  }

  console.log('🎨 Applying configuration:', config)

  // Función auxiliar para setear cookie
  const setCookie = (name: string, value: string) => {
    const expires = new Date()

    expires.setFullYear(expires.getFullYear() + 1) // 1 año
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  }

  // Setear cookies de colores (Vuetify los leerá al inicializarse)
  setCookie('aquasoft-lightThemePrimaryColor', config.primaryColor)
  setCookie('aquasoft-darkThemePrimaryColor', config.primaryColor)
  setCookie('aquasoft-lightThemePrimaryDarkenColor', config.primaryDarkenColor)
  setCookie('aquasoft-darkThemePrimaryDarkenColor', config.primaryDarkenColor)
  setCookie('aquasoft-lightThemeSecondaryColor', config.secondaryColor)
  setCookie('aquasoft-darkThemeSecondaryColor', config.secondaryColor)
  setCookie('aquasoft-lightThemeSecondaryDarkenColor', config.secondaryDarkenColor)
  setCookie('aquasoft-darkThemeSecondaryDarkenColor', config.secondaryDarkenColor)

  // Setear localStorage para initial loader
  localStorage.setItem('aquasoft-initial-loader-color', config.primaryColor)

  // Aplicar al DOM inmediatamente
  document.documentElement.style.setProperty('--initial-loader-color', config.primaryColor)

  // Actualizar título
  if (config.appTitle) {
    console.log('📝 Setting document title to:', config.appTitle)
    document.title = config.appTitle
    console.log('📝 Document title set:', document.title)
  }
  else {
    console.warn('⚠️ No appTitle found in configuration')
  }

  // Actualizar favicon
  if (config.favicon) {
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]')

    existingFavicons.forEach(link => link.remove())

    const link = document.createElement('link')

    link.rel = 'icon'
    link.href = config.favicon
    document.head.appendChild(link)
  }

  console.log('✅ Configuration applied to storage and DOM')
}

export default initTenant
