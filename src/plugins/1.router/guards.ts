import type { RouteNamedMap, _RouterTyped } from 'unplugin-vue-router'
import { useAbility } from '@casl/vue'
import type { User } from '@/types/types'
import { canNavigate } from '@layouts/plugins/casl'
import { useTenantStore } from '@/stores/tenant.store'
import { useCookie } from '@/@core/composable/useCookie'

export const setupGuards = (router: _RouterTyped<RouteNamedMap & { [key: string]: any }>) => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(to => {
    // Verificar que el tenant esté listo antes de continuar
    const tenantStore = useTenantStore()

    // Si el tenant no está listo y no es una ruta pública, esperar
    if (!tenantStore.isReady && !to.meta.public) {
      // Si hay error en el tenant, redirigir a pantalla de error
      if (tenantStore.hasError)
        return '/tenant-error'

      // Si aún está cargando, mostrar loader
      if (tenantStore.isLoading)
        return '/tenant-loading'
    }

    /*
     * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
     * Examples of public routes are, 404, under maintenance, etc.
     */
    if (to.meta.public)
      return

    /**
     * Check if user is logged in by checking if token & user data exists in local storage
     * Feel free to update this logic to suit your needs
     */
    const userCookie = useCookie('userData')
    const tokenCookie = useCookie('accessToken')
    const isLoggedIn = !!(userCookie.value || tokenCookie.value)
    const user = userCookie.value
    const userData = user as unknown as User

    /*
      If user is logged in and is trying to access login like page, redirect to home
      else allow visiting the page
      (WARN: Don't allow executing further by return statement because next code will check for permissions)
     */
    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn)
        return '/'
      else
        return undefined
    }

    // Rehidratar CASL desde sessionStorage si existe (antes de evaluar permisos)
    const cached = sessionStorage.getItem('userAbilityRules')
    if (cached) {
      try {
        const rules = JSON.parse(cached)
        const ability = useAbility()

        ability.update(rules)
      }
      catch (e) {
        // Si hay problema con el JSON o estado, lo ignoramos
        console.warn('No se pudieron restaurar abilities desde sessionStorage')
      }
    }

    if (!canNavigate(to) && to.matched.length) {
      /* eslint-disable indent */
      return isLoggedIn
        ? { name: 'not-authorized' }
        : {
            name: 'login',
            query: {
              ...to.query,
              to: to.fullPath !== '/' ? to.path : undefined,
            },
          }
      /* eslint-enable indent */
    }

    // Verificar el wizardStep y redirigir si es necesario
    if (isLoggedIn && userData) {
      const wizardStep = (userData as any).wizardStep ?? (userData as any)?.metadata?.wizardStep ?? 0

      // Si el wizardStep es menor a 3 y no está en una ruta de onboarding, redirigir a onboarding
      if (wizardStep < 3 && !to.path.startsWith('/pages/onboarding'))
        return 'pages/onboarding'

      // Si el wizardStep es mayor o igual a 3 y está en una ruta de onboarding, redirigir a home
      if (wizardStep >= 3 && to.path.startsWith('/pages/onboarding'))
        return '/'
    }

    // return 'login'
  })
}
