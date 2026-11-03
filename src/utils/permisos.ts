/*
 * Permisos al día sin volver a iniciar sesión (XEL1-624).
 *
 * Las reglas CASL llegan con el login y se guardan en la cookie userAbilityRules. Si a la persona le cambian
 * los roles con la sesión abierta, se vuelven a pedir al servidor al recargar la página, al volver a la
 * ventana y antes de mandarla a "No estás autorizado". El servidor sigue aplicando el permiso de cada reporte.
 */
import type { RouteLocationNormalized } from 'vue-router'
import { useCookie } from '@core/composable/useCookie'
import { ability } from '@/plugins/casl/ability'
import type { Rule } from '@/plugins/casl/ability'
import { obtenerAbilities } from '@/modules/reportes/services/reportesApi'

// Al volver a la ventana no se pregunta más de una vez cada 30 s
const ESPERA_MS = 30_000

let ultima = 0
let enCurso: Promise<boolean> | null = null

/** Pide las reglas actuales al servidor y, si cambiaron, las aplica. Devuelve true si cambiaron. */
export function refrescarPermisos({ forzar = false } = {}): Promise<boolean> {
  if (!useCookie('accessToken').value)
    return Promise.resolve(false)
  if (enCurso)
    return enCurso
  if (!forzar && Date.now() - ultima < ESPERA_MS)
    return Promise.resolve(false)

  enCurso = (async () => {
    try {
      const reglas = (await obtenerAbilities()).userAbilityRules as Rule[]

      ultima = Date.now()
      if (JSON.stringify(reglas) === JSON.stringify(ability.rules))
        return false

      useCookie<Rule[]>('userAbilityRules').value = reglas
      ability.update(reglas) // el menú de reportes se recarga con el evento 'updated'

      return true
    }
    catch (error) {
      console.error('[permisos] No se pudieron actualizar los permisos', error)

      return false
    }
    finally {
      enCurso = null
    }
  })()

  return enCurso
}

/**
 * Lo mismo que canNavigate de @layouts, pero con la instancia única de ability: después de un await el guardia
 * ya no está en el contexto de la app y useAbility() no se puede llamar.
 */
export function puedeNavegar(to: RouteLocationNormalized): boolean {
  const destino = to.matched[to.matched.length - 1]
  if (destino?.meta?.action && destino?.meta?.subject)
    return ability.can(destino.meta.action as never, destino.meta.subject as never)

  return to.matched.some(ruta => ability.can(ruta.meta.action as never, ruta.meta.subject as never))
}

/** Al cargar la app y cada vez que la ventana vuelve a estar a la vista. */
export function vigilarPermisos() {
  void refrescarPermisos({ forzar: true })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible')
      void refrescarPermisos()
  })
}
