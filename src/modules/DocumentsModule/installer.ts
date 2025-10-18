/**
 * Documents Module Installer
 *
 * Handles module installation and configuration
 */

import type { App } from 'vue'
import { DocumentsModuleContainer } from './config/container'

/**
 * Install the Documents module
 */
export function installDocumentsModule(app: App): void {
  console.log('📦 Installing DocumentsModule...')

  // Routes are auto-loaded by router plugin via routes.ts in module root
  // No need to register them manually with router.addRoute()

  // Provide container for dependency injection
  app.provide('documentsContainer', DocumentsModuleContainer)

  console.log('✅ DocumentsModule installed successfully!')
}
