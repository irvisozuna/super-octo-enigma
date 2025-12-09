import { type TenantData, useTenantStore } from '@/stores/tenant.store'

export interface TenantBootstrapConfig {
  apiBaseUrl?: string
  fallbackOrganization?: string
}

export class TenantBootstrapService {
  private config: TenantBootstrapConfig
  private _tenantStore: ReturnType<typeof useTenantStore> | null = null

  constructor(config: TenantBootstrapConfig = {}) {
    this.config = {
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
      fallbackOrganization: import.meta.env.VITE_API_ORGANIZATION || '',
      ...config,
    }
  }

  /**
   * Lazy getter for tenant store (to avoid Pinia initialization issues)
   */
  private get tenantStore(): ReturnType<typeof useTenantStore> {
    if (!this._tenantStore)
      this._tenantStore = useTenantStore()

    return this._tenantStore
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
   * Aplica el branding básico del tenant al DOM (solo para fallback)
   * La configuración completa se aplica en loadCompanyConfiguration
   */
  private applyBranding(tenantData: TenantData): void {
    // Solo aplicar logo de carga si existe (el resto lo hace loadCompanyConfiguration)
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
    const normalizeHex = (value?: string) => {
      if (!value)
        return value
      const trimmed = value.trim()

      return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    }

    const normalizedPrimary = normalizeHex(theme.primary)
    const normalizedSecondary = normalizeHex(theme.secondary)

    // Aplicar variables CSS globales
    if (normalizedPrimary) {
      document.documentElement.style.setProperty('--color-primary', normalizedPrimary)
      document.documentElement.style.setProperty('--initial-loader-color', normalizedPrimary)
    }

    if (normalizedSecondary)
      document.documentElement.style.setProperty('--color-secondary', normalizedSecondary)

    // Aplicar modo oscuro
    if (theme.dark)
      document.documentElement.classList.add('dark')
    else
      document.documentElement.classList.remove('dark')

    // Guardar en localStorage para persistencia
    if (normalizedPrimary)
      localStorage.setItem('aquasoft-initial-loader-color', normalizedPrimary)
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

    console.log('🌐 Fetching tenant from API:', { apiUrl, host, tenant })

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

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response')

      console.error('❌ Tenant API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new Error(`Failed to resolve tenant: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    console.log('📦 Received tenant data from API:', {
      hasCompanyId: !!data.companyId,
      hasSlug: !!data.slug,
      hasTheme: !!data.theme,
      keys: Object.keys(data),
    })

    // Validar estructura de datos con mensajes detallados
    if (!data) {
      console.error('❌ API returned null or undefined data')
      throw new Error('Invalid tenant data structure: API returned empty response')
    }

    if (!data.companyId) {
      console.error('❌ Missing companyId in tenant data:', data)
      throw new Error('Invalid tenant data structure: missing companyId field')
    }

    if (!data.slug) {
      console.error('❌ Missing slug in tenant data:', data)
      throw new Error('Invalid tenant data structure: missing slug field')
    }

    // Advertir si faltan campos opcionales importantes
    if (!data.theme)
      console.warn('⚠️ Missing theme in tenant data, will use defaults')

    if (!data.name)
      console.warn('⚠️ Missing name in tenant data')

    return data as TenantData
  }

  /**
   * Proceso principal de bootstrap del tenant
   * NOTA: Si el tenant ya fue pre-cargado, solo inicializa stores
   */
  async bootstrap(): Promise<void> {
    try {
      this.tenantStore.setLoading(true)

      // 1. Intentar cargar desde localStorage (ya pre-cargado)
      const cachedData = this.tenantStore.loadFromCache()
      if (cachedData) {
        console.log('📦 Tenant already pre-loaded, initializing stores:', cachedData.slug)
        this.tenantStore.setTenantData(cachedData)

        // NO aplicar branding/configuración aquí - ya se hizo en preload
        // Solo guardar en cache de Pinia para uso posterior
        const { CompanyConfigCacheService } = await import('@/modules/CompanyConfigModule/infrastructure/cache/CompanyConfigCacheService')
        const cacheService = new CompanyConfigCacheService()
        const cachedConfig = await cacheService.getCachedConfig(cachedData.companyId)

        if (cachedConfig) {
          const { useCompanyConfigStore } = await import('@/modules/CompanyConfigModule/presentation/stores/companyConfigStore')
          const companyConfigStore = useCompanyConfigStore()

          companyConfigStore.config = cachedConfig
          companyConfigStore.originalConfig = { ...cachedConfig }
          companyConfigStore.isDirty = false
        }

        this.tenantStore.setLoading(false)

        return
      }

      // 2. Si no hay cache (caso raro), cargar desde API
      console.log('⚠️ No pre-loaded tenant found, loading from API...')
      this.tenantStore.reset()

      const { host, tenant } = this.detectHostOrTenant()
      const tenantData = await this.resolveTenantFromAPI(host, tenant)

      this.applyBranding(tenantData)
      this.tenantStore.setTenantData(tenantData)
      this.tenantStore.saveToCache()

      await this.loadCompanyConfiguration(tenantData.companyId, tenantData)

      this.tenantStore.setLoading(false)
      console.log('✅ Tenant bootstrap completed:', tenantData.slug)
    }
    catch (error) {
      console.error('Tenant bootstrap failed:', error)

      if (this.config.fallbackOrganization) {
        console.log('Using fallback organization:', this.config.fallbackOrganization)

        const fallbackData: TenantData = {
          companyId: 'fallback',
          slug: this.config.fallbackOrganization,
          name: 'Default Organization',
          assets: {
            logo: undefined,
            menu: undefined,
            favicon: undefined,
            loading: undefined,
          },
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

        console.log('📋 Applying fallback tenant data:', {
          companyId: fallbackData.companyId,
          slug: fallbackData.slug,
          hasTheme: !!fallbackData.theme,
          theme: fallbackData.theme,
        })

        this.tenantStore.setTenantData(fallbackData)
        this.applyBranding(fallbackData)
        await this.loadCompanyConfiguration(fallbackData.companyId)
      }
      else {
        this.tenantStore.setError(error instanceof Error ? error.message : 'Failed to resolve tenant')
      }

      this.tenantStore.setLoading(false)
    }
  }

  /**
   * Carga la configuración de la compañía
   */
  private async loadCompanyConfiguration(companyId: string, tenantData?: TenantData): Promise<void> {
    try {
      console.log('🎨 Loading company configuration for:', companyId)

      // SIEMPRE usar la configuración del tenant si está disponible
      // El tenant bootstrap ya trae toda la configuración necesaria
      if (tenantData && this.hasCompanyConfig(tenantData)) {
        console.log('✅ Using company configuration from tenant response')

        const config = {
          companyId,
          primaryColor: tenantData.primaryColor || '#7367F0',
          primaryDarkenColor: tenantData.primaryDarkenColor || '#675DD8',
          secondaryColor: tenantData.secondaryColor || '#FF9F43',
          secondaryDarkenColor: tenantData.secondaryDarkenColor || '#E6892E',
          theme: (tenantData.theme as any) || 'light',
          skin: tenantData.skin || 'default',
          semiDarkMenu: tenantData.semiDarkMenu || false,
          layout: tenantData.layout || 'vertical',
          contentWidth: tenantData.contentWidth || 'fluid',
          appTitle: tenantData.appTitle || tenantData.name || 'Application',
          loginLogo: tenantData.assets?.logo,
          menuLogo: tenantData.assets?.logo,
          favicon: tenantData.assets?.favicon,
          version: tenantData.version ? Number.parseInt(tenantData.version.toString()) : 1,
          updatedAt: tenantData.updatedAt,
        }

        console.log('🎨 Configuration to apply:', {
          primaryColor: config.primaryColor,
          secondaryColor: config.secondaryColor,
          theme: config.theme,
          skin: config.skin,
          appTitle: config.appTitle,
          layout: config.layout,
          semiDarkMenu: config.semiDarkMenu,
        })

        // Aplicar configuración sin usar composables de Vue (para bootstrap)
        console.log('🔧 Applying configuration via cookies and storage...')
        await this.applyConfigurationBootstrap(config)

        // Guardar en cache para próximas cargas
        const { CompanyConfigCacheService } = await import('@/modules/CompanyConfigModule/infrastructure/cache/CompanyConfigCacheService')
        const cacheService = new CompanyConfigCacheService()

        await cacheService.saveCachedConfig(config)

        // Guardar en el store (sin aplicar, solo para que esté disponible)
        const { useCompanyConfigStore } = await import('@/modules/CompanyConfigModule/presentation/stores/companyConfigStore')
        const companyConfigStore = useCompanyConfigStore()

        companyConfigStore.config = config
        companyConfigStore.originalConfig = { ...config }
        companyConfigStore.isDirty = false

        console.log('✅ Company configuration applied successfully!')
        console.log('🍪 Cookies set for persistence')
        console.log('💾 Cache saved to IndexedDB')
      }
      else {
        console.log('⚠️ No company configuration in tenant response, using defaults')
        console.log('📋 Tenant data:', tenantData)
      }
    }
    catch (error) {
      console.error('❌ Failed to load company configuration:', error)
      console.error('Error details:', error)

      // La aplicación puede continuar con la configuración por defecto
    }
  }

  /**
   * Aplica la configuración usando cookies y localStorage (sin composables de Vue)
   * Esto se usa durante el bootstrap antes de que Vue esté completamente inicializado
   */
  private async applyConfigurationBootstrap(config: any): Promise<void> {
    const { cookieRef, namespaceConfig } = await import('@layouts/stores/config')
    const { useStorage } = await import('@vueuse/core')

    // Guardar colores en cookies para ambos temas
    cookieRef('lightThemePrimaryColor', null).value = config.primaryColor
    cookieRef('darkThemePrimaryColor', null).value = config.primaryColor
    cookieRef('lightThemePrimaryDarkenColor', null).value = config.primaryDarkenColor
    cookieRef('darkThemePrimaryDarkenColor', null).value = config.primaryDarkenColor
    cookieRef('lightThemeSecondaryColor', null).value = config.secondaryColor
    cookieRef('darkThemeSecondaryColor', null).value = config.secondaryColor
    cookieRef('lightThemeSecondaryDarkenColor', null).value = config.secondaryDarkenColor
    cookieRef('darkThemeSecondaryDarkenColor', null).value = config.secondaryDarkenColor

    // Guardar initial loader color
    useStorage<string | null>(namespaceConfig('initial-loader-color'), null).value = config.primaryColor

    // Actualizar título de la app
    if (config.appTitle)
      document.title = config.appTitle

    // Actualizar favicon si existe
    if (config.favicon)
      this.updateFavicon(config.favicon)

    console.log('✅ Bootstrap configuration applied (cookies + storage)')
  }

  /**
   * Verifica si el tenant trae configuración de compañía
   */
  private hasCompanyConfig(tenantData: any): boolean {
    return !!(
      tenantData.primaryColor
      || tenantData.theme
      || tenantData.appTitle
      || tenantData.skin
      || tenantData.layout
    )
  }

  /**
   * Fuerza una nueva resolución del tenant (ignora cache)
   */
  async forceRefresh(): Promise<void> {
    this.tenantStore.clearCache()

    // También limpiar cache de configuración
    const companyId = this.tenantStore.currentTenant?.companyId
    if (companyId) {
      // Import dinámico para evitar dependencia circular
      const { useCompanyConfigStore } = await import('@/modules/CompanyConfigModule/presentation/stores/companyConfigStore')
      const companyConfigStore = useCompanyConfigStore()

      await companyConfigStore.forceRefresh(companyId)
    }

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
