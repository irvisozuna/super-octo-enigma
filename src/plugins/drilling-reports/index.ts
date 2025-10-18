/**
 * Drilling Reports Module Plugin
 *
 * Registers the DrillingReportsModule with the Vue app
 */

import type { App } from 'vue'
import { installDrillingReportsModule } from '@/modules/DrillingReportsModule/installer'

export default function (app: App) {
  // Get router and i18n instances from app
  const router = app.config.globalProperties.$router
  const i18n = app.config.globalProperties.$i18n

  // Install the DrillingReportsModule
  installDrillingReportsModule(router, i18n)
}
