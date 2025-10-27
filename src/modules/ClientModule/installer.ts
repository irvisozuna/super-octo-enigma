/**
 * Client Module Installer
 *
 * Handles the registration and installation of the Client module
 */

import type { I18n } from 'vue-i18n'

// Import module config
import { CLIENT_PERMISSIONS, CLIENT_PERMISSION_GROUPS } from './config/permissions'

export class ClientModuleInstaller {
  private i18n: I18n | null

  constructor(i18n?: I18n) {
    this.i18n = i18n || null
  }

  async install() {
    try {
      // Routes are auto-loaded by router plugin via routes.ts in module root
      // No need to register them manually with router.addRoute()

      // Note: Menu items are loaded automatically by initializeMenus() from navigation/index.ts

      // Add translations
      await this.addTranslations()

      // Add CASL abilities
      this.addCaslAbilities()

      return true
    }
    catch (error) {
      console.error('❌ Error installing ClientModule:', error)

      return false
    }
  }

  private async addTranslations() {
    try {
      // Dynamic imports for translation files
      const [enTranslations, esTranslations] = await Promise.all([
        import('./locales/en.json'),
        import('./locales/es.json'),
      ])

      if (this.i18n) {
        const i18nGlobal = (this.i18n as any).global || this.i18n
        if (i18nGlobal.mergeLocaleMessage) {
          i18nGlobal.mergeLocaleMessage('en', enTranslations.default)
          i18nGlobal.mergeLocaleMessage('es', esTranslations.default)
        }
      }
    }
    catch (error) {
      console.error('Error loading client translations:', error)

      // Fallback: minimal translations if files can't be loaded
      const fallbackTranslations = {
        en: {
          navigation: { clients: 'Clients' },
        },
        es: {
          navigation: { clients: 'Clientes' },
        },
      }

      if (this.i18n) {
        const i18nGlobal = (this.i18n as any).global || this.i18n
        if (i18nGlobal.mergeLocaleMessage) {
          i18nGlobal.mergeLocaleMessage('en', fallbackTranslations.en)
          i18nGlobal.mergeLocaleMessage('es', fallbackTranslations.es)
        }
      }
    }
  }

  private addCaslAbilities() {
    // Add CASL abilities for module permissions
    const abilities = [
      // Client general
      { action: 'read', subject: 'Client' },

      // View permissions
      { action: 'view', subject: 'Client' },
      { action: 'view', subject: 'client-detail' },

      // CRUD permissions
      { action: 'create', subject: 'Client' },
      { action: 'update', subject: 'Client' },
      { action: 'delete', subject: 'Client' },

      // Status management
      { action: 'activate', subject: 'Client' },
      { action: 'suspend', subject: 'Client' },
      { action: 'deactivate', subject: 'Client' },
      { action: 'blacklist', subject: 'Client' },

      // Special permissions
      { action: 'view', subject: 'client-credit-limit' },
      { action: 'update', subject: 'client-credit-limit' },
      { action: 'export', subject: 'Client' },
      { action: 'view', subject: 'client-status-history' },

      // Contact management
      { action: 'manage', subject: 'client-contacts' },
    ]

    // Store abilities in window for CASL integration
    if (!window.caslAbilities)
      window.caslAbilities = []

    window.caslAbilities.push(...abilities)
  }

  /**
   * Get module metadata
   */
  getMetadata() {
    return {
      name: 'ClientModule',
      version: '1.0.0',
      description: 'Client management module with DDD and Clean Architecture',
      permissions: CLIENT_PERMISSIONS,
      permissionGroups: CLIENT_PERMISSION_GROUPS,
    }
  }
}

/**
 * Install function for plugin-style registration
 */
export async function installClientModule(i18n?: I18n) {
  const installer = new ClientModuleInstaller(i18n)

  return await installer.install()
}

/**
 * Default export as Vue plugin
 */
export default {
  install: async (app: any) => {
    const i18n = app.config.globalProperties.$i18n

    const installer = new ClientModuleInstaller(i18n)

    await installer.install()

    // Store installer instance on app for later use
    app.config.globalProperties.$clientModule = installer
  },
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    caslAbilities?: any[]
  }
}
