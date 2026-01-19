import type { App } from 'vue'
import { installContractModule } from '@/modules/contracts/installer'

export default function (app: App) {
  const i18n = app.config.globalProperties.$i18n

  installContractModule(i18n)
}
