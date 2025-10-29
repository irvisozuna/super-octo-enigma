import type { App } from 'vue'
import { watchEffect } from 'vue'
import { themeConfig } from '@themeConfig'

export default function (app: App) {
  // NOTA: No setear el título aquí porque ya se configuró en el preload del tenant
  // El tenant bootstrap configura el título correcto desde la configuración de la compañía
  // Si intentamos setearlo aquí, sobrescribiríamos el título del tenant con el valor por defecto

  // Solo setear el título si NO ha sido configurado previamente (document.title vacío o "Loading...")
  watchEffect(() => {
    if (!document.title || document.title === 'Loading...')
      document.title = themeConfig.app.title || 'Default Title'
  })
}
