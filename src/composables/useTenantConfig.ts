import { computed } from 'vue'
import { useTenantStore } from '@/stores/tenant.store'

/**
 * Composable para acceder a la configuración del tenant
 * Proporciona logos, título y otros datos de branding dinámicamente
 */
export function useTenantConfig() {
  const tenantStore = useTenantStore()

  console.log('🔍 Tenant data:', tenantStore.data)

  // Logo para el login (desde assets.logo o assets.loading)
  const loginLogo = computed(() => {
    return tenantStore.data?.assets?.logo || tenantStore.data?.assets?.loading || null
  })

  // Logo para el menú
  const menuLogo = computed(() => {
    const logo = tenantStore.data?.assets?.menu || null

    console.log('🎨 menuLogo computed:', {
      hasData: !!tenantStore.data,
      assets: tenantStore.data?.assets,
      menu: tenantStore.data?.assets?.menu,
      result: logo,
    })

    return logo
  })

  // Favicon
  const favicon = computed(() => {
    return tenantStore.data?.assets?.favicon || null
  })

  // Título de la aplicación
  const appTitle = computed(() => {
    return (tenantStore.data as any)?.appTitle || tenantStore.data?.name || 'Application'
  })

  // Nombre del tenant
  const tenantName = computed(() => {
    return tenantStore.data?.name || 'Application'
  })

  // Colores primarios
  const primaryColor = computed(() => {
    return (tenantStore.data as any)?.primaryColor || tenantStore.data?.theme?.primary || '#7367F0'
  })

  const secondaryColor = computed(() => {
    return (tenantStore.data as any)?.secondaryColor || tenantStore.data?.theme?.secondary || '#FF9F43'
  })

  return {
    loginLogo,
    menuLogo,
    favicon,
    appTitle,
    tenantName,
    primaryColor,
    secondaryColor,
  }
}
