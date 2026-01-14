import type { App } from 'vue'
import { installWorkOrdersModule } from '@/modules/WorkOrders/installer'

export default function (app: App) {
  const router = app.config.globalProperties.$router
  const i18n = app.config.globalProperties.$i18n

  installWorkOrdersModule(router, i18n)
}
