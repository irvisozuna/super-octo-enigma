import type { App } from 'vue'
import { useI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import { VChip } from 'vuetify/components/VChip'
import { VSelect } from 'vuetify/components/VSelect'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import defaults from './defaults'
import { icons } from './icons'
import { themes } from './theme'
import { getI18n } from '@/plugins/i18n/index'
import { themeConfig } from '@themeConfig'

// Styles
import '@core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'

export default function (app: App) {
  const vuetify = createVuetify({
    /*
     * Alias del sistema de diseño: variantes con nombre sobre los componentes nativos de Vuetify, sin envoltorios.
     * Sus props por defecto están en defaults.ts. Los componentes compuestos (As*) viven en src/components/as.
     */
    aliases: {
      IconBtn: VBtn,
      AsBtnPrimario: VBtn,
      AsBtnSecundario: VBtn,
      AsBtnTerciario: VBtn,
      AsBtnIcono: VBtn,
      AsChipEstado: VChip,
      AsCampoFiltro: VSelect,
    },
    defaults,
    icons,

    // La marca ya no se lee de cookies ni la cambia el customizer: el tema es la fuente única (colores.json).
    theme: {
      defaultTheme: resolveVuetifyTheme(themeConfig.app.theme),
      themes,
    },
    locale: {
      adapter: createVueI18nAdapter({ i18n: getI18n(), useI18n }),
    },
  })

  app.use(vuetify)
}
