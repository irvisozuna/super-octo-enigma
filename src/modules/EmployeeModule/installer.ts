/**
 * Employee Module Installer
 *
 * Handles the registration and installation of the Employee module
 */

import type { I18n } from 'vue-i18n'

// Import module config
import { EMPLOYEE_PERMISSIONS, EMPLOYEE_PERMISSION_GROUPS } from './config/permissions'

export class EmployeeModuleInstaller {
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
      console.error('❌ Error installing EmployeeModule:', error)

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
      console.error('Error loading employee translations:', error)

      // Fallback: minimal translations if files can't be loaded
      const fallbackTranslations = {
        en: {
          navigation: { employees: 'Employees' },
        },
        es: {
          navigation: { employees: 'Empleados' },
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
      // Employee general
      { action: 'read', subject: 'Employee' },

      // View permissions
      { action: 'view', subject: 'Employee' },
      { action: 'view', subject: 'employee-detail' },

      // CRUD permissions
      { action: 'create', subject: 'Employee' },
      { action: 'update', subject: 'Employee' },
      { action: 'delete', subject: 'Employee' },

      // Status management
      { action: 'suspend', subject: 'Employee' },
      { action: 'reactivate', subject: 'Employee' },
      { action: 'terminate', subject: 'Employee' },

      // Special permissions
      { action: 'view', subject: 'employee-salaries' },
      { action: 'update', subject: 'employee-salaries' },
      { action: 'export', subject: 'Employee' },
      { action: 'view', subject: 'employment-history' },

      // Skills & Certifications
      { action: 'manage', subject: 'employee-skills' },
      { action: 'manage', subject: 'employee-certifications' },
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
      name: 'EmployeeModule',
      version: '1.0.0',
      description: 'Employee management module with DDD and Clean Architecture',
      permissions: EMPLOYEE_PERMISSIONS,
      permissionGroups: EMPLOYEE_PERMISSION_GROUPS,
    }
  }
}

/**
 * Install function for plugin-style registration
 */
export async function installEmployeeModule(router?: Router, i18n?: I18n) {
  const installer = new EmployeeModuleInstaller(router, i18n)

  return await installer.install()
}

/**
 * Default export as Vue plugin
 */
export default {
  install: async (app: any) => {
    const router = app.config.globalProperties.$router
    const i18n = app.config.globalProperties.$i18n

    const installer = new EmployeeModuleInstaller(router, i18n)

    await installer.install()

    // Store installer instance on app for later use
    app.config.globalProperties.$employeeModule = installer
  },
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    caslAbilities?: any[]
  }
}
