import { User } from '@/types/types'
import { canNavigate } from '@layouts/plugins/casl'
import { puedeNavegar, refrescarPermisos } from '@/utils/permisos'
import type { RouteNamedMap, _RouterTyped } from 'unplugin-vue-router'

export const setupGuards = (router: _RouterTyped<RouteNamedMap & { [key: string]: any }>) => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach(async to => {
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
    const isLoggedIn = !!(useCookie('userData').value && useCookie('accessToken').value)
    const user = useCookie('userData').value
    const userData = user as unknown as User;
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

    // Los roles pudieron cambiar con la sesión abierta: antes de negar se confirma con el servidor (XEL1-624)
    if (!canNavigate(to) && to.matched.length && !(isLoggedIn && await refrescarPermisos({ forzar: true }) && puedeNavegar(to))) {
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

      const wizardStep = userData.wizardStep || 0;
      // Si el wizardStep es menor a 3 y no está en una ruta de onboarding, redirigir a onboarding
      if (wizardStep < 3 && !to.path.startsWith('/pages/onboarding')) {
        return 'pages/onboarding'
      } else if (wizardStep >= 3 && to.path.startsWith('/pages/onboarding')) {
        // Si el wizardStep es mayor o igual a 3 y está en una ruta de onboarding, redirigir a la página de inicio
        return '/'
      }
    }
    // return 'login'
    
  })
}
