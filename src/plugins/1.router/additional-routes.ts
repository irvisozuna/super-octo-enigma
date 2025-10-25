import type { RouteRecordRaw } from 'vue-router'
import { useCookie } from '@/@core/composable/useCookie'
import { useTenantStore } from '@/stores/tenant.store'

// 👉 Redirects
export const redirects: RouteRecordRaw[] = [
  // ℹ️ We are redirecting to different pages based on role and tenant configuration.
  // NOTE: Role is just for UI purposes. ACL is based on abilities.
  {
    path: '/',
    name: 'index',
    redirect: (to: any) => {
      // TODO: Get type from backend
      const userData = useCookie<Record<string, any> | null | undefined>('userData')
      const accessToken = useCookie<string | null | undefined>('accessToken')
      const roleName = (userData.value as any)?.roles?.[0]?.name?.toString()?.toLowerCase()

      // If logged in (has userData), route to home page
      if (userData.value || accessToken.value) {
        // Obtener homeUrl del tenant si existe
        try {
          const tenantStore = useTenantStore()
          const homeUrl = (tenantStore.data as any)?.homeUrl

          // Si el tenant tiene homeUrl configurado, usarlo
          if (homeUrl) {
            console.log('🏠 Redirecting to tenant homeUrl:', homeUrl)

            return { name: homeUrl }
          }
        }
        catch (error) {
          // Si hay error accediendo al store (Pinia no disponible), continuar con fallback
          console.warn('⚠️ Tenant store not available, using fallback routing:', error)
        }

        // Fallback basado en rol
        if (roleName === 'admin')
          return { name: 'dashboards-crm' }

        // Default landing for any authenticated role
        return { name: 'dashboards-crm' }
      }

      // Not logged in → go to login preserving query
      return { name: 'login', query: to.query }
    },
  },
]

export const routes: RouteRecordRaw[] = [

]
