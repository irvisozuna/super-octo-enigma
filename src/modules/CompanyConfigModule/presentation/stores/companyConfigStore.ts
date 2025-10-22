import { defineStore } from 'pinia'
import { useTheme } from 'vuetify'
import { useConfigStore } from '@core/stores/config'
import { cookieRef, namespaceConfig } from '@layouts/stores/config'
import { useStorage } from '@vueuse/core'
import type { CompanyConfigEntity } from '../../domain/entities/CompanyConfigEntity'
import { CompanyConfigApiService } from '../../infrastructure/api/CompanyConfigApiService'
import { LoadCompanyConfigUseCase } from '../../application/usecases/LoadCompanyConfigUseCase'
import { SaveCompanyConfigUseCase } from '../../application/usecases/SaveCompanyConfigUseCase'

interface CompanyConfigState {
  config: CompanyConfigEntity | null
  loading: boolean
  saving: boolean
  error: string | null
  isDirty: boolean
  originalConfig: CompanyConfigEntity | null
}

export const useCompanyConfigStore = defineStore('companyConfig', {
  state: (): CompanyConfigState => ({
    config: null,
    loading: false,
    saving: false,
    error: null,
    isDirty: false,
    originalConfig: null,
  }),

  getters: {
    hasConfig: state => !!state.config,
    hasUnsavedChanges: state => state.isDirty,
    currentConfig: state => state.config,
  },

  actions: {
    /**
     * Load company configuration
     */
    async loadConfig(companyId: string, forceRefresh = false) {
      this.loading = true
      this.error = null

      try {
        const repository = new CompanyConfigApiService()
        const useCase = new LoadCompanyConfigUseCase(repository)
        const config = await useCase.execute(companyId, forceRefresh)

        this.config = config
        this.originalConfig = { ...config }
        this.isDirty = false

        // Apply configuration to the app
        await this.applyConfiguration(config)
      }
      catch (error: any) {
        this.error = error.message || 'Error loading configuration'
        console.error('Failed to load company config:', error)
      }
      finally {
        this.loading = false
      }
    },

    /**
     * Save company configuration
     */
    async saveConfig() {
      if (!this.config) return

      this.saving = true
      this.error = null

      try {
        const repository = new CompanyConfigApiService()
        const useCase = new SaveCompanyConfigUseCase(repository)
        const savedConfig = await useCase.execute(this.config)

        this.config = savedConfig
        this.originalConfig = { ...savedConfig }
        this.isDirty = false

        // NO llamar applyConfiguration aquí porque:
        // 1. Ya fue aplicado en el customizer antes de guardar
        // 2. applyConfiguration usa useTheme() que solo puede ser llamado desde setup functions
        // El customizer ya aplicó todos los cambios visualmente antes de llamar saveConfig()

        return savedConfig
      }
      catch (error: any) {
        this.error = error.message || 'Error saving configuration'
        throw error
      }
      finally {
        this.saving = false
      }
    },

    /**
     * Update configuration locally (without saving)
     */
    updateConfig(updates: Partial<CompanyConfigEntity>) {
      if (!this.config) return

      this.config = {
        ...this.config,
        ...updates,
      }

      // Mark as dirty if different from original
      this.isDirty = JSON.stringify(this.config) !== JSON.stringify(this.originalConfig)
    },

    /**
     * Apply configuration to the application
     */
    async applyConfiguration(config: CompanyConfigEntity) {
      const vuetifyTheme = useTheme()
      const configStore = useConfigStore()

      // Guardar en el estado del store
      this.config = { ...config }
      this.originalConfig = { ...config }
      this.isDirty = false

      // Apply colors
      vuetifyTheme.themes.value.light.colors.primary = config.primaryColor
      vuetifyTheme.themes.value.light.colors['primary-darken-1'] = config.primaryDarkenColor
      vuetifyTheme.themes.value.dark.colors.primary = config.primaryColor
      vuetifyTheme.themes.value.dark.colors['primary-darken-1'] = config.primaryDarkenColor

      vuetifyTheme.themes.value.light.colors.secondary = config.secondaryColor
      vuetifyTheme.themes.value.light.colors['secondary-darken-1'] = config.secondaryDarkenColor
      vuetifyTheme.themes.value.dark.colors.secondary = config.secondaryColor
      vuetifyTheme.themes.value.dark.colors['secondary-darken-1'] = config.secondaryDarkenColor

      // Store in cookies for persistence
      cookieRef('lightThemePrimaryColor', null).value = config.primaryColor
      cookieRef('darkThemePrimaryColor', null).value = config.primaryColor
      cookieRef('lightThemePrimaryDarkenColor', null).value = config.primaryDarkenColor
      cookieRef('darkThemePrimaryDarkenColor', null).value = config.primaryDarkenColor
      cookieRef('lightThemeSecondaryColor', null).value = config.secondaryColor
      cookieRef('darkThemeSecondaryColor', null).value = config.secondaryColor
      cookieRef('lightThemeSecondaryDarkenColor', null).value = config.secondaryDarkenColor
      cookieRef('darkThemeSecondaryDarkenColor', null).value = config.secondaryDarkenColor

      // Apply theme settings
      configStore.theme = config.theme
      configStore.skin = config.skin
      configStore.isVerticalNavSemiDark = config.semiDarkMenu

      // Apply layout settings
      if (config.layout === 'collapsed') {
        configStore.isVerticalNavCollapsed = true
        configStore.appContentLayoutNav = 'vertical'
      }
      else {
        configStore.isVerticalNavCollapsed = false
        configStore.appContentLayoutNav = config.layout
      }

      configStore.appContentWidth = config.contentWidth

      // Update app title
      document.title = config.appTitle

      // Update initial loader color
      useStorage<string | null>(namespaceConfig('initial-loader-color'), null).value = config.primaryColor

      // Apply logos if available
      if (config.favicon) {
        this.updateFavicon(config.favicon)
      }
    },

    /**
     * Update favicon
     */
    updateFavicon(faviconUrl: string) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
        || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = faviconUrl
      document.getElementsByTagName('head')[0].appendChild(link)
    },

    /**
     * Reset to original configuration
     */
    resetConfig() {
      if (this.originalConfig) {
        this.config = { ...this.originalConfig }
        this.isDirty = false
        this.applyConfiguration(this.config)
      }
    },

    /**
     * Force refresh configuration from server
     */
    async forceRefresh(companyId: string) {
      // Clear cache first
      const repository = new CompanyConfigApiService()
      await repository.clearCache(companyId)

      // Reload with force refresh
      await this.loadConfig(companyId, true)
    },

    /**
     * Upload and update logo
     */
    async uploadLogo(companyId: string, file: File, type: 'login' | 'menu' | 'favicon'): Promise<string> {
      try {
        const repository = new CompanyConfigApiService()
        const url = await repository.uploadLogo(companyId, file, type)

        // Update config with new logo URL
        if (this.config) {
          if (type === 'login') {
            this.config.loginLogo = url
          }
          else if (type === 'menu') {
            this.config.menuLogo = url
          }
          else if (type === 'favicon') {
            this.config.favicon = url
            this.updateFavicon(url)
          }
          this.isDirty = true
        }

        return url
      }
      catch (error) {
        console.error('Error uploading logo:', error)
        throw error
      }
    },
  },
})