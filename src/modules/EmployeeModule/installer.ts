/**
 * Employee Module Installer
 *
 * Handles the registration and installation of the Employee module
 */

import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

// Import module routes and menu
import employeeRoutes from './config/routes'
import employeeMenu from './config/menu'
import { EMPLOYEE_PERMISSIONS, EMPLOYEE_PERMISSION_GROUPS } from './config/permissions'

export class EmployeeModuleInstaller {
  private router: any
  private i18n: any

  constructor() {
    this.setupDependencies()
  }

  private setupDependencies() {
    // Get router from the current app context
    try {
      this.router = useRouter()
    }
    catch (error) {
      console.warn('Router not available in current context, will register routes later')
      this.router = null
    }

    // Get i18n from the current app context
    try {
      this.i18n = useI18n()
    }
    catch (error) {
      console.warn('i18n not available in current context')
      this.i18n = null
    }
  }

  async install() {
    console.log('🚀 Installing EmployeeModule...')

    try {
      // Register routes
      this.registerRoutes()

      // Add menu items
      this.addMenuItems()

      // Add translations
      await this.addTranslations()

      // Add CASL abilities
      this.addCaslAbilities()

      console.log('✅ EmployeeModule installed successfully!')

      return true
    }
    catch (error) {
      console.error('❌ Error installing EmployeeModule:', error)

      return false
    }
  }

  private registerRoutes() {
    console.log('📁 Registering employee routes...')

    if (!this.router) {
      console.warn('Router not available, routes will be registered when router is available')

      return
    }

    employeeRoutes.forEach(route => {
      this.router.addRoute(route)
    })
  }

  private addMenuItems() {
    console.log('📋 Adding employee menu items...')

    // Add menu items to the main navigation
    if (window.mainMenu)
      window.mainMenu.push(...employeeMenu)
  }

  private async addTranslations() {
    console.log('🌐 Adding employee translations...')

    try {
      // Dynamic imports for translation files
      const [enTranslations, esTranslations] = await Promise.all([
        import('./locales/en.json'),
        import('./locales/es.json'),
      ])

      if (this.i18n && this.i18n.global) {
        this.i18n.global.mergeLocaleMessage('en', enTranslations.default)
        this.i18n.global.mergeLocaleMessage('es', esTranslations.default)
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

      if (this.i18n && this.i18n.global) {
        this.i18n.global.mergeLocaleMessage('en', fallbackTranslations.en)
        this.i18n.global.mergeLocaleMessage('es', fallbackTranslations.es)
      }
    }
  }

  private addCaslAbilities() {
    console.log('🔐 Adding employee CASL abilities...')

    // Add CASL abilities for module permissions
    const abilities = [
      // Employee general
      { action: 'read', subject: 'employees' },

      // View permissions
      { action: 'view', subject: 'employees' },
      { action: 'view', subject: 'employee-detail' },

      // CRUD permissions
      { action: 'create', subject: 'employees' },
      { action: 'update', subject: 'employees' },
      { action: 'delete', subject: 'employees' },

      // Status management
      { action: 'suspend', subject: 'employees' },
      { action: 'reactivate', subject: 'employees' },
      { action: 'terminate', subject: 'employees' },

      // Special permissions
      { action: 'view', subject: 'employee-salaries' },
      { action: 'update', subject: 'employee-salaries' },
      { action: 'export', subject: 'employees' },
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
export async function installEmployeeModule() {
  const installer = new EmployeeModuleInstaller()
  return await installer.install()
}

/**
 * Default export as Vue plugin
 */
export default {
  install: async (app: any) => {
    const installer = new EmployeeModuleInstaller()
    await installer.install()

    // Store installer instance on app for later use
    app.config.globalProperties.$employeeModule = installer
  },
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    mainMenu?: any[]
    caslAbilities?: any[]
  }
}
