import { type TenantData, useTenantStore } from '@/stores/tenant.store'

export interface TenantBootstrapConfig {
  apiBaseUrl?: string
  fallbackOrganization?: string
}

export class TenantBootstrapService {
  private config: TenantBootstrapConfig
  private tenantStore = useTenantStore()

  constructor(config: TenantBootstrapConfig = {}) {
    this.config = {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
      fallbackOrganization: import.meta.env.VITE_API_ORGANIZATION || '',
      ...config,
    }
  }

  /**
   * Detecta el host actual o el tenant desde query parameter (modo dev)
   */
  private detectHostOrTenant(): { host: string; tenant?: string } {
    const url = new URL(window.location.href)
    const host = url.hostname

    // En modo desarrollo, permitir ?tenant=<slug>
    const tenantParam = url.searchParams.get('tenant')

    return {
      host,
      tenant: tenantParam || undefined,
    }
  }

  /**
   * Aplica el branding del tenant al DOM
   */
  private applyBranding(tenantData: TenantData): void {
    // Actualizar título
    if (tenantData.name)
      document.title = tenantData.name

    // Actualizar favicon
    if (tenantData.assets.favicon)
      this.updateFavicon(tenantData.assets.favicon)

    // Aplicar colores del tema
    if (tenantData.theme)
      this.applyTheme(tenantData.theme)

    // Aplicar logo de carga si existe
    if (tenantData.assets.loading)
      this.updateLoadingLogo(tenantData.assets.loading)
  }

  /**
   * Actualiza el favicon del documento
   */
  private updateFavicon(faviconUrl: string): void {
    // Remover favicons existentes
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]')

    existingFavicons.forEach(link => link.remove())

    // Crear nuevo favicon
    const link = document.createElement('link')

    link.rel = 'icon'
    link.href = faviconUrl
    document.head.appendChild(link)
  }

  /**
   * Aplica el tema del tenant
   */
  private applyTheme(theme: TenantData['theme']): void {
    // Aplicar variables CSS globales
    if (theme.primary) {
      document.documentElement.style.setProperty('--color-primary', theme.primary)
      document.documentElement.style.setProperty('--initial-loader-color', theme.primary)
    }

    if (theme.secondary)
      document.documentElement.style.setProperty('--color-secondary', theme.secondary)

    // Aplicar modo oscuro
    if (theme.dark)
      document.documentElement.classList.add('dark')
    else
      document.documentElement.classList.remove('dark')

    // Guardar en localStorage para persistencia
    if (theme.primary)
      localStorage.setItem('aquasoft-initial-loader-color', theme.primary)
  }

  /**
   * Actualiza el logo de carga
   */
  private updateLoadingLogo(loadingUrl: string): void {
    const loadingLogo = document.querySelector('.loading-logo')
    if (loadingLogo)
      loadingLogo.innerHTML = `<img src="${loadingUrl}" alt="Loading logo" style="max-width: 86px; max-height: 48px;">`
  }

  /**
   * Resuelve la configuración del tenant desde el backend
   */
  private async resolveTenantFromAPI(host: string, tenant?: string): Promise<TenantData> {
    const apiUrl = `${this.config.apiBaseUrl}/auth/tenant`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Tenant-Slug': tenant || '',
      },
      body: JSON.stringify({
        host,
        tenant,
      }),
    })

    if (!response.ok)
      throw new Error(`Failed to resolve tenant: ${response.status} ${response.statusText}`)

    const data = await response.json()

    // Validar estructura de datos
    if (!data.companyId || !data.slug || !data.name)
      throw new Error('Invalid tenant data structure')

    return data as TenantData
  }

  /**
   * Proceso principal de bootstrap del tenant
   */
  async bootstrap(): Promise<void> {
    try {
      this.tenantStore.setLoading(true)
      this.tenantStore.reset()

      // 1. Detectar host o tenant
      const { host, tenant } = this.detectHostOrTenant()

      // 2. Intentar cargar desde cache primero
      const cachedData = this.tenantStore.loadFromCache()
      if (cachedData) {
        console.log('Loading tenant from cache:', cachedData.slug)
        this.tenantStore.setTenantData(cachedData)
        this.applyBranding(cachedData)

        return
      }

      // 3. Resolver desde API
      console.log('Resolving tenant from API:', { host, tenant })

      const tenantData = await this.resolveTenantFromAPI(host, tenant)

      // 4. Aplicar branding
      this.applyBranding(tenantData)

      // 5. Guardar en store y cache
      this.tenantStore.setTenantData(tenantData)
      this.tenantStore.saveToCache()

      console.log('Tenant bootstrap completed:', tenantData.slug)
    }
    catch (error) {
      console.error('Tenant bootstrap failed:', error)

      // Si hay un fallback organization, usarlo
      if (this.config.fallbackOrganization) {
        console.log('Using fallback organization:', this.config.fallbackOrganization)

        const fallbackData: TenantData = {
          companyId: 'fallback',
          slug: this.config.fallbackOrganization,
          name: 'Default Organization',
          assets: {},
          theme: {
            primary: '#7367F0',
            secondary: '#8C9EFF',
            dark: false,
          },
          i18n: {
            locale: 'es',
            timezone: 'UTC',
          },
          version: '1.0.0',
        }

        this.tenantStore.setTenantData(fallbackData)
        this.applyBranding(fallbackData)
      }
      else {
        this.tenantStore.setError(error instanceof Error ? error.message : 'Failed to resolve tenant')
      }
    }
  }

  /**
   * Fuerza una nueva resolución del tenant (ignora cache)
   */
  async forceRefresh(): Promise<void> {
    this.tenantStore.clearCache()
    await this.bootstrap()
  }

  /**
   * Obtiene la organización actual (para uso en APIs)
   */
  getCurrentOrganization(): string {
    return this.tenantStore.organization || this.config.fallbackOrganization || ''
  }
}

// Función para obtener la instancia del servicio (lazy initialization)
let _tenantBootstrapService: TenantBootstrapService | null = null

export const getTenantBootstrapService = (): TenantBootstrapService => {
  if (!_tenantBootstrapService)
    _tenantBootstrapService = new TenantBootstrapService()

  return _tenantBootstrapService
}

// Exportar getter para compatibilidad (sin instanciar inmediatamente)
export const tenantBootstrapService = {
  get bootstrap() {
    return getTenantBootstrapService().bootstrap.bind(getTenantBootstrapService())
  },
  get forceRefresh() {
    return getTenantBootstrapService().forceRefresh.bind(getTenantBootstrapService())
  },
  get getCurrentOrganization() {
    return getTenantBootstrapService().getCurrentOrganization.bind(getTenantBootstrapService())
  },
}
