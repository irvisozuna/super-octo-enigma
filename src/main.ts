import { createApp } from 'vue'

import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'

// Debug helpers (only in development)
if (import.meta.env.DEV) {
  import('@/utils/vueDebugHelper').then(({ installVueDebugHelpers }) => {
    installVueDebugHelpers()
  })
}

// Create vue app
const app = createApp(App)

// Register plugins
registerPlugins(app)

// Mount vue app
app.mount('#app')
