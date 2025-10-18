/**
 * Documents Module Plugin
 *
 * Registers the DocumentsModule with the Vue app
 */

import type { App } from 'vue'
import { DocumentsModuleContainer } from '../../modules/DocumentsModule/config/container'
import { installDocumentsModule } from '../../modules/DocumentsModule/installer'

export default function (app: App) {
  // Install the DocumentsModule
  installDocumentsModule(app)

  // Provide the container for dependency injection
  app.provide('documentsContainer', DocumentsModuleContainer)
}
