import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import type { App } from 'vue'
import type { Rule } from './ability'

export default function (app: App) {
  // Prefer sessionStorage (persistido tras login) y cae a cookie si no existe
  let persistedRules: Rule[] = []
  try {
    if (typeof window !== 'undefined') {
      const fromSession = sessionStorage.getItem('userAbilityRules')
      if (fromSession)
        persistedRules = JSON.parse(fromSession) as Rule[]
    }
  }
  catch {
    persistedRules = []
  }

  // Fallback a cookie (legacy)
  if (!persistedRules?.length) {
    const userAbilityRules = useCookie<Rule[]>('userAbilityRules')
    persistedRules = userAbilityRules.value ?? []
  }

  // Define habilidades globales (por ejemplo, acceso a rutas públicas)
  const globalRules: Rule[] = [
    // { action: 'read', subject: 'Profile' }, // Todos pueden leer el perfil
  ]

  // Combina las habilidades globales con las habilidades específicas del usuario
  const initialAbility = createMongoAbility([
    ...globalRules,
    ...(persistedRules ?? []),
  ])

  // Configura el plugin de CASL para Vue
  app.use(abilitiesPlugin, initialAbility, {
    useGlobalProperties: true, // Hacer `ability` accesible en todo el app
  })
}
