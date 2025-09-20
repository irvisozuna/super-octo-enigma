import type { RouteRecordRaw } from 'vue-router'
import { useCookie } from '@/@core/composable/useCookie'

// 👉 Redirects
export const redirects: RouteRecordRaw[] = [
  // ℹ️ We are redirecting to different pages based on role.
  // NOTE: Role is just for UI purposes. ACL is based on abilities.
  {
    path: '/',
    name: 'index',
    redirect: (to: any) => {
      // TODO: Get type from backend
      const userData = useCookie<Record<string, any> | null | undefined>('userData')
      const accessToken = useCookie<string | null | undefined>('accessToken')
      const roleName = (userData.value as any)?.roles?.[0]?.name?.toString()?.toLowerCase()

      // If logged in (has userData), route to a default home even if role isn't matched explicitly
      if (userData.value || accessToken.value) {
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
