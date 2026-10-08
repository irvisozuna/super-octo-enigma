import type { ThemeDefinition } from 'vuetify'
import tokens from '@/styles/tokens/colores.json'

/*
 * Tema del Aquasoft Design System 1.0 (Enterprise Clean UI).
 * Los colores y variables viven en src/styles/tokens/colores.json, fuente única verificada con scripts/ds-contraste.mjs
 * (AA en claro y oscuro). Aquí solo se arman las dos definiciones de Vuetify.
 */

export const staticPrimaryColor = tokens.light.colors.primary
export const staticPrimaryDarkenColor = tokens.light.colors['primary-darken-1']

// Los usa el customizer de la plantilla (solo administradores); no forman parte del sistema de diseño.
export const staticSecondaryColor = tokens.light.colors.secondary
export const staticSecondaryDarkenColor = tokens.light.colors['secondary-darken-1']

export const themes: Record<string, ThemeDefinition> = {
  light: {
    dark: false,
    colors: tokens.light.colors,
    variables: tokens.light.variables,
  },
  dark: {
    dark: true,
    colors: tokens.dark.colors,
    variables: tokens.dark.variables,
  },
}

export default themes
