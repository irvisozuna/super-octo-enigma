import type { App } from 'vue'
import { watchEffect } from 'vue'
import { themeConfig } from '@themeConfig'

export default function (app: App) {
  watchEffect(() => {
    document.title = themeConfig.app.title || 'Default Title'
  })
}
