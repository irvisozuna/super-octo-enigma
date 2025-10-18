/**
 * Drilling Reports Module Installer
 *
 * Handles the registration and installation of the Drilling Reports module
 */

import type { I18n } from 'vue-i18n'

// Import module config
import { DRILLING_REPORTS_PERMISSIONS, DRILLING_REPORTS_PERMISSION_GROUPS } from './config/permissions'

export class DrillingReportsModuleInstaller {
  private i18n: I18n | null

  constructor(i18n?: I18n) {
    this.i18n = i18n || null
  }

  async install() {
    console.log('🚀 Installing DrillingReportsModule...')

    try {
      // Routes are auto-loaded by router plugin via routes.ts in module root
      // No need to register them manually with router.addRoute()

      // Note: Menu items are loaded automatically by initializeMenus() from navigation/index.ts

      // Add translations
      await this.addTranslations()

      // Add CASL abilities
      this.addCaslAbilities()

      console.log('✅ DrillingReportsModule installed successfully!')

      return true
    }
    catch (error) {
      console.error('❌ Error installing DrillingReportsModule:', error)

      return false
    }
  }

  private async addTranslations() {
    console.log('🌐 Adding drilling reports translations...')

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
      console.error('Error loading drilling reports translations:', error)

      // Fallback: minimal translations if files can't be loaded
      const fallbackTranslations = {
        en: {
          navigation: { drillingReports: 'Drilling Reports' },
        },
        es: {
          navigation: { drillingReports: 'Reportes de Perforación' },
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
    console.log('🔐 Adding drilling reports CASL abilities...')

    // Add CASL abilities for module permissions
    const abilities = [
      // Drilling Reports general
      { action: 'read', subject: 'drilling-reports' },

      // View permissions
      { action: 'view', subject: 'drilling-reports' },
      { action: 'view', subject: 'drilling-report-detail' },

      // CRUD permissions
      { action: 'create', subject: 'drilling-reports' },
      { action: 'update', subject: 'drilling-reports' },
      { action: 'delete', subject: 'drilling-reports' },

      // Workflow permissions
      { action: 'complete', subject: 'drilling-reports' },
      { action: 'approve', subject: 'drilling-reports' },
      { action: 'reject', subject: 'drilling-reports' },
      { action: 'sign', subject: 'drilling-reports' },

      // Activity permissions
      { action: 'add', subject: 'drilling-report-activities' },
      { action: 'update', subject: 'drilling-report-activities' },
      { action: 'delete', subject: 'drilling-report-activities' },

      // Consumption permissions
      { action: 'add', subject: 'drilling-report-consumptions' },
      { action: 'update', subject: 'drilling-report-consumptions' },
      { action: 'delete', subject: 'drilling-report-consumptions' },

      // Tool permissions
      { action: 'assign', subject: 'drilling-report-tools' },
      { action: 'update', subject: 'drilling-report-tools' },
      { action: 'delete', subject: 'drilling-report-tools' },

      // Export permissions
      { action: 'export', subject: 'drilling-reports' },

      // Statistics permissions
      { action: 'view', subject: 'drilling-report-statistics' },
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
      name: 'DrillingReportsModule',
      version: '1.0.0',
      description: 'Drilling reports management module with DDD and Clean Architecture',
      permissions: DRILLING_REPORTS_PERMISSIONS,
      permissionGroups: DRILLING_REPORTS_PERMISSION_GROUPS,
    }
  }
}

/**
 * Install function for plugin-style registration
 */
export async function installDrillingReportsModule(router?: any, i18n?: I18n) {
  const installer = new DrillingReportsModuleInstaller(i18n)

  return await installer.install()
}

/**
 * Default export as Vue plugin
 */
export default {
  install: async (app: any) => {
    const i18n = app.config.globalProperties.$i18n

    const installer = new DrillingReportsModuleInstaller(i18n)

    await installer.install()

    // Store installer instance on app for later use
    app.config.globalProperties.$drillingReportsModule = installer
  },
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    caslAbilities?: any[]
  }
}
