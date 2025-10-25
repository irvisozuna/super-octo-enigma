import { createApp } from 'vue'

import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { initTenant } from '@core/initTenant'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'

// Debug helpers (only in development)
if (import.meta.env.DEV) {
  import('@/utils/vueDebugHelper').then(({ installVueDebugHelpers }) => {
    installVueDebugHelpers()
  })
}

/**
 * Bootstrap de la aplicación
 * ORDEN CRÍTICO:
 * 1. Pre-cargar tenant → Setear cookies/localStorage con colores
 * 2. Crear app → Registrar plugins → Vuetify lee los cookies con colores correctos
 * 3. Inicializar tenant completo (stores, cache)
 * 4. Montar app → Remover loading
 */
async function bootstrapApp() {
  try {
    console.log('🚀 Starting app bootstrap...')

    // 1. PRE-CARGAR tenant y configuración (sin Vue/Pinia, solo cookies)
    console.log('⏳ Pre-loading tenant configuration...')

    const { preloadTenantConfiguration } = await import('@core/initTenant')

    await preloadTenantConfiguration()
    console.log('✅ Pre-load complete. Current title:', document.title)

    // 2. Crear vue app
    console.log('🔧 Creating Vue app...')

    const app = createApp(App)

    // 3. Register plugins (Vuetify ahora lee cookies con valores correctos)
    console.log('🔌 Registering plugins (Pinia, Router, Vuetify)...')
    registerPlugins(app)

    // 4. Inicializar tenant completo (stores, cache) - Pinia ya está disponible
    console.log('⏳ Initializing tenant stores...')
    await initTenant()

    // 5. Mount vue app
    console.log('⚡ Mounting app...')
    app.mount('#app')

    // 6. Remover loading screen
    console.log('✅ App mounted successfully!')

    const loadingBg = document.getElementById('loading-bg')
    if (loadingBg)
      loadingBg.style.display = 'none'
  }
  catch (error) {
    console.error('❌ Failed to bootstrap app:', error)

    // Intentar montar la app de todas formas (sin personalización)
    const app = createApp(App)

    registerPlugins(app)
    app.mount('#app')

    // Remover loading screen incluso si hay error
    const loadingBg = document.getElementById('loading-bg')
    if (loadingBg)
      loadingBg.style.display = 'none'
  }
}

// Ejecutar bootstrap
bootstrapApp()
