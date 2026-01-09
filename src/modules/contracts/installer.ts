/**
 * Contract Module Installer
 */

import type { I18n } from 'vue-i18n'
import { CONTRACT_PERMISSIONS, CONTRACT_PERMISSION_GROUPS } from './config/permissions'

export class ContractModuleInstaller {
  private i18n: I18n | null

  constructor(i18n?: I18n) {
    this.i18n = i18n || null
  }

  async install() {
    try {
      this.addCaslAbilities()
      return true
    }
    catch (error) {
      console.error('❌ Error installing ContractModule:', error)
      return false
    }
  }

  private addCaslAbilities() {
    const abilities = [
      { action: 'read', subject: 'Contract' },
      { action: 'create', subject: 'Contract' },
      { action: 'update', subject: 'Contract' },
      { action: 'delete', subject: 'Contract' },
    ]

    if (!window.caslAbilities)
      window.caslAbilities = []

    window.caslAbilities.push(...abilities)
  }

  getMetadata() {
    return {
      name: 'ContractModule',
      version: '1.0.0',
      description: 'Module for managing customer contracts',
      permissions: CONTRACT_PERMISSIONS,
      permissionGroups: CONTRACT_PERMISSION_GROUPS,
    }
  }
}

export async function installContractModule(i18n?: I18n) {
  const installer = new ContractModuleInstaller(i18n)
  return await installer.install()
}

export default {
  install: async (app: any) => {
    const i18n = app.config.globalProperties.$i18n
    const installer = new ContractModuleInstaller(i18n)
    await installer.install()
    app.config.globalProperties.$contractModule = installer
  },
}
