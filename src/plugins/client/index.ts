import type { App } from 'vue'
import { installClientModule } from '@/modules/ClientModule/installer'

export default function (app: App) {
  const router = app.config.globalProperties.$router
  const i18n = app.config.globalProperties.$i18n

  installClientModule(router, i18n)
}
