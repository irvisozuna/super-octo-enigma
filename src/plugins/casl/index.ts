import { createMongoAbility } from '@casl/ability';
import { abilitiesPlugin } from '@casl/vue';
import type { App } from 'vue';
import type { Rule } from './ability';

export default function (app: App) {
  const userAbilityRules = useCookie<Rule[]>('userAbilityRules');

  // Define habilidades globales (por ejemplo, acceso a rutas públicas)
  const globalRules: Rule[] = [
    { action: 'read', subject: 'Profile' }, // Todos pueden leer el perfil
  ];

  // Combina las habilidades globales con las habilidades específicas del usuario
  const initialAbility = createMongoAbility([
    ...globalRules,
    ...(userAbilityRules.value ?? []), // Reglas cargadas dinámicamente
  ]);

  // Configura el plugin de CASL para Vue
  app.use(abilitiesPlugin, initialAbility, {
    useGlobalProperties: true, // Hacer `ability` accesible en todo el app
  });
}
