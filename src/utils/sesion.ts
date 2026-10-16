/*
 * Sesión de Atención (XEL1-514).
 *
 * El token del login caduca en el servidor (12 h). Cerrar sesión lo revoca en la API y
 * cualquier 401 de una petición con token regresa al login: así un token vencido o
 * revocado no deja la pantalla llena de errores.
 */
import { useCookie } from '@core/composable/useCookie'
import { ability } from '@/plugins/casl/ability'

const COOKIES_SESION = ['accessToken', 'userData', 'userAbilityRules', 'profile', 'company', 'dolibarrToken']

const baseUrl = () => import.meta.env.VITE_API_BASE_URL || '/api'

// El router se importa al usarse: los clientes HTTP que llaman aquí se cargan antes que él
const irAlLogin = async (to?: string) => {
  const { router } = await import('@/plugins/1.router')

  await router.push({ name: 'login', query: to && to !== '/' ? { to } : undefined })
}

/** Borra las cookies de la sesión y los permisos. */
export function limpiarSesion() {
  COOKIES_SESION.forEach(nombre => {
    useCookie(nombre).value = null
  })
  ability.update([])
}

/** Revoca el token en la API y sale al login. Si la API no responde, la sesión se borra igual. */
export async function cerrarSesion() {
  const token = useCookie('accessToken').value

  if (token) {
    try {
      await fetch(`${baseUrl()}/auth/logout`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Organization': `${import.meta.env.VITE_API_ORGANIZATION ?? ''}`,
        },
      })
    }
    catch (error) {
      console.error('[sesion] No se pudo revocar el token al cerrar sesión', error)
    }
  }

  // Primero se sale y luego se borran los permisos, para que el menú no parpadee al redirigir
  useCookie('accessToken').value = null
  useCookie('userData').value = null
  await irAlLogin()
  limpiarSesion()
}

let redirigiendo = false

/**
 * Llamar cuando una petición responde 401. Solo actúa si la petición llevaba token
 * (un 401 del login es "credenciales inválidas", no una sesión vencida).
 */
export async function sesionVencida(url = '') {
  if (redirigiendo || !useCookie('accessToken').value || url.includes('/auth/login'))
    return

  redirigiendo = true
  try {
    const { router } = await import('@/plugins/1.router')
    const actual = router.currentRoute.value.fullPath

    limpiarSesion()
    await irAlLogin(actual)
  }
  finally {
    redirigiendo = false
  }
}
