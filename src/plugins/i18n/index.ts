import { cookieRef } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'
import type { App } from 'vue'
import { createI18n } from 'vue-i18n'

const globalMessages = Object.fromEntries(
  Object.entries(
    import.meta.glob<{ default: any }>('./locales/*.json', { eager: true }))
    .map(([key, value]) => [key.slice(10, -5), value.default]),
)
// Carga los archivos de cada módulo ubicados en 'modules/*/locales/'
const moduleMessages = Object.fromEntries(
  Object.entries(
    import.meta.glob<{ default: any }>('@/modules/**/locales/*.json', { eager: true })
  ).map(([key, value]) => {
    // Supongamos que la ruta es algo como: './modules/miModulo/locales/en.json'
    // Separamos la ruta para extraer el nombre del módulo y el locale.
    const segments = key.split('/')

    // segments = [".", "modules", "miModulo", "locales", "en.json"]
    const moduleName = segments[3]
    // Extraemos el locale eliminando la extensión ".json"
    const locale = segments[5].slice(0, -5)
    console.log(locale);
    // Puedes estructurar el objeto de salida según lo que necesites.
    // Por ejemplo, podrías usar una clave compuesta o agrupar por idioma.
    // En este ejemplo se crea una clave del tipo 'miModulo.en'
    return [`${moduleName}.${locale}`, value.default]
  })
)

const messages = {}
for (const [locale, globalTranslation] of Object.entries(globalMessages)) {
  messages[locale] = {
    // Colocamos primero las traducciones globales
    ...globalTranslation,
  }
}
Object.entries(moduleMessages).forEach(([compoundKey, moduleTranslation]) => {
  // Suponemos que la clave compuesta es 'moduleName.locale'
  const [moduleName, locale] = compoundKey.split('.')
  // Si no existe el idioma en el objeto final, lo inicializamos
  if (!messages[locale]) {
    messages[locale] = {}
  }
  // Puedes asignar las traducciones del módulo bajo su propio namespace
  messages[locale][moduleName] = moduleTranslation
})

let _i18n: any = null

export const getI18n = () => {
  if (_i18n === null) {
    _i18n = createI18n({
      legacy: false,
      locale: cookieRef('language', themeConfig.app.i18n.defaultLocale).value,
      fallbackLocale: 'es',
      messages,
    })
  }

  return _i18n
}

export default function (app: App) {
  app.use(getI18n())
}
