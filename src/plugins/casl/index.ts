import { abilitiesPlugin } from '@casl/vue'
import type { App } from 'vue'
import { ability } from './ability'
import type { Rule } from './ability'

export default function (app: App) {
  const userAbilityRules = useCookie<Rule[]>('userAbilityRules')

  // Una sola instancia para toda la app: la misma que importan los módulos (menú de reportes, guardas) y la que
  // devuelve useAbility(). Con dos instancias, el menú consultaba una vacía y no mostraba lo que el rol permite.
  ability.update(userAbilityRules.value ?? [])

  app.use(abilitiesPlugin, ability, {
    useGlobalProperties: true, // Hacer `ability` accesible en todo el app
  })
}
