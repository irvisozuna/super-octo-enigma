<script setup lang="ts">
import { useTheme } from 'vuetify'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'
import { useTenantTheme } from '@/composables/useTenantTheme'
import { useTenantStore } from '@/stores/tenant.store'
import { initTenant } from '@core/initTenant'
import TenantBootstrapLoader from '@/components/TenantBootstrapLoader.vue'
import TenantErrorScreen from '@/components/TenantErrorScreen.vue'

const { global } = useTheme()
const tenantStore = useTenantStore()

// ℹ️ Sync current theme with initial loader theme
initCore()
initConfigStore()

const configStore = useConfigStore()

// Aplicar tema del tenant
const { applyBranding } = useTenantTheme()

// Inicializar tenant de manera asíncrona
initTenant()
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <!-- ℹ️ This is required to set the background color of active nav link based on currently active global theme's primary -->
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <!-- Mostrar loader o error del tenant si no está listo -->
      <TenantBootstrapLoader v-if="tenantStore.isLoading" />
      <TenantErrorScreen v-else-if="tenantStore.hasError" />

      <!-- Mostrar la app normal si el tenant está listo -->
      <template v-else>
        <RouterView />
        <ScrollToTop />
        <GlobalSnackbar />
        <DialogGlobal />
      </template>
    </VApp>
  </VLocaleProvider>
</template>
