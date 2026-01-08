import type { I18n } from 'vue-i18n'

export class ReadingsModuleInstaller {
  private readonly i18n: I18n | null

  constructor(i18n?: I18n) {
    this.i18n = i18n || null
  }

  async install() {
    try {
      await this.addTranslations()
      return true
    }
    catch (error) {
      console.error('Error installing ReadingsModule:', error)
      return false
    }
  }

  private async addTranslations() {
    try {
      const [enTranslations, esTranslations] = await Promise.all([
        import('./locales/en.json'),
        import('./locales/es.json'),
      ])

      if (this.i18n) {
        const i18nGlobal = (this.i18n as any).global || this.i18n

        if (i18nGlobal.mergeLocaleMessage) {
          i18nGlobal.mergeLocaleMessage('en', enTranslations.default)
          i18nGlobal.mergeLocaleMessage('es', esTranslations.default)
        }
      }
    }
    catch (error) {
      console.error('Error loading ReadingsModule translations:', error)
    }
  }
}

export async function installReadingsModule(_router?: any, i18n?: I18n) {
  const installer = new ReadingsModuleInstaller(i18n)

  return await installer.install()
}

export default {
  install: async (app: any) => {
    const i18n = app.config.globalProperties.$i18n
    const installer = new ReadingsModuleInstaller(i18n)

    await installer.install()

    app.config.globalProperties.$readingsModule = installer
  },
}
