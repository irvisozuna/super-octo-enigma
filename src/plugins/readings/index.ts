import type { App } from 'vue'
import { installReadingsModule } from '@/modules/Readings/installer'

export default function (app: App) {
  const router = app.config.globalProperties.$router
  const i18n = app.config.globalProperties.$i18n

  installReadingsModule(router, i18n)
}
