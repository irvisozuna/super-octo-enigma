import { deepMerge } from '@antfu/utils'
import type { App } from 'vue'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import defaults from './defaults'
import { icons } from './icons'
import { staticPrimaryColor, staticPrimaryDarkenColor, themes } from './theme'
import { getI18n } from '@/plugins/i18n/index'
import { themeConfig } from '@themeConfig'

// Styles
import { cookieRef } from '@/@layouts/stores/config'
import '@core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'

export default function (app: App) {
  const cookieThemeValues = {
    defaultTheme: resolveVuetifyTheme(themeConfig.app.theme),
    themes: {
      light: {
        colors: {
          'primary': cookieRef('lightThemePrimaryColor', staticPrimaryColor).value,
          'primary-darken-1': cookieRef('lightThemePrimaryDarkenColor', staticPrimaryDarkenColor).value,
        },
      },
      dark: {
        colors: {
          'primary': cookieRef('darkThemePrimaryColor', staticPrimaryColor).value,
          'primary-darken-1': cookieRef('darkThemePrimaryDarkenColor', staticPrimaryDarkenColor).value,
        },
      },
    },
  }

  const optionTheme = deepMerge({ themes }, cookieThemeValues)

  const vuetify = createVuetify({
    aliases: {
      IconBtn: VBtn,
    },
    defaults,
    icons,
    theme: optionTheme,
    locale: {
      adapter: createVueI18nAdapter({ i18n: getI18n(), useI18n }),
    },
  })

  // React to cookie changes set elsewhere (e.g., tenant bootstrap) and update theme live
  const lightPrimary = cookieRef<string>('lightThemePrimaryColor', staticPrimaryColor)
  const lightPrimaryDarken = cookieRef<string>('lightThemePrimaryDarkenColor', staticPrimaryDarkenColor)
  const darkPrimary = cookieRef<string>('darkThemePrimaryColor', staticPrimaryColor)
  const darkPrimaryDarken = cookieRef<string>('darkThemePrimaryDarkenColor', staticPrimaryDarkenColor)

  const lightSecondary = cookieRef<string | null>('lightThemeSecondaryColor', null)
  const lightSecondaryDarken = cookieRef<string | null>('lightThemeSecondaryDarkenColor', null)
  const darkSecondary = cookieRef<string | null>('darkThemeSecondaryColor', null)
  const darkSecondaryDarken = cookieRef<string | null>('darkThemeSecondaryDarkenColor', null)

  const normalizeHex = (value?: string | null) => {
    if (!value)
      return undefined
    const trimmed = value.trim()

    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  }

  watch([lightPrimary, lightPrimaryDarken, lightSecondary, lightSecondaryDarken], () => {
    const theme = vuetify.theme.themes.value.light
    if (!theme)
      return
    const p = normalizeHex(lightPrimary.value) || staticPrimaryColor
    const pd = normalizeHex(lightPrimaryDarken.value) || staticPrimaryDarkenColor

    theme.colors.primary = p
    theme.colors['primary-darken-1'] = pd

    const s = normalizeHex(lightSecondary.value)
    const sd = normalizeHex(lightSecondaryDarken.value)
    if (s)
      theme.colors.secondary = s
    if (sd)
      theme.colors['secondary-darken-1'] = sd
  }, { immediate: false })

  watch([darkPrimary, darkPrimaryDarken, darkSecondary, darkSecondaryDarken], () => {
    const theme = vuetify.theme.themes.value.dark
    if (!theme)
      return
    const p = normalizeHex(darkPrimary.value) || staticPrimaryColor
    const pd = normalizeHex(darkPrimaryDarken.value) || staticPrimaryDarkenColor

    theme.colors.primary = p
    theme.colors['primary-darken-1'] = pd

    const s = normalizeHex(darkSecondary.value)
    const sd = normalizeHex(darkSecondaryDarken.value)
    if (s)
      theme.colors.secondary = s
    if (sd)
      theme.colors['secondary-darken-1'] = sd
  }, { immediate: false })

  app.use(vuetify)
}
