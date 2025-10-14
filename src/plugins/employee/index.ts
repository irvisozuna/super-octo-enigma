import type { App } from 'vue'
import { installEmployeeModule } from '@/modules/EmployeeModule/installer'

export default function (app: App) {
  const router = app.config.globalProperties.$router
  const i18n = app.config.globalProperties.$i18n

  installEmployeeModule(router, i18n)
}
