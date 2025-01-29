import { themeConfig } from '@themeConfig'
import type { App } from 'vue'
import { watchEffect } from 'vue'

export default function (app: App) {
  watchEffect(() => {
    document.title = themeConfig.app.title || 'Default Title'
  })
}
