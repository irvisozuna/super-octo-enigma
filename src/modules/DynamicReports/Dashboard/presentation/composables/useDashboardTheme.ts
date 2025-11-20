import { ref, computed, watch } from 'vue'
import type { DashboardTheme } from '../../domain/types/DashboardTypes'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
  info: string
}

const DEFAULT_LIGHT_THEME: ThemeColors = {
  primary: '#1976D2',
  secondary: '#424242',
  accent: '#82B1FF',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FB8C00',
  error: '#FF5252',
  info: '#2196F3',
}

const DEFAULT_DARK_THEME: ThemeColors = {
  primary: '#2196F3',
  secondary: '#424242',
  accent: '#FF4081',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#2C2C2C',
  success: '#4CAF50',
  warning: '#FB8C00',
  error: '#FF5252',
  info: '#2196F3',
}

/**
 * Composable para manejo del tema del dashboard
 */
export function useDashboardTheme(initialTheme?: DashboardTheme) {
  const theme = ref<DashboardTheme>(
    initialTheme || {
      mode: 'light',
      primaryColor: DEFAULT_LIGHT_THEME.primary,
      backgroundColor: DEFAULT_LIGHT_THEME.background,
      fontFamily: 'Roboto, sans-serif',
      fontSize: 14,
      customCss: '',
    },
  )

  const isDark = computed(() => theme.value.mode === 'dark')
  const isLight = computed(() => theme.value.mode === 'light')

  /**
   * Obtiene los colores del tema actual
   */
  const colors = computed<ThemeColors>(() => {
    const baseColors = isDark.value ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME

    return {
      ...baseColors,
      primary: theme.value.primaryColor || baseColors.primary,
      background: theme.value.backgroundColor || baseColors.background,
    }
  })

  /**
   * Cambia el modo del tema
   */
  function setMode(mode: 'light' | 'dark') {
    theme.value.mode = mode

    // Actualizar colores base según el modo
    if (mode === 'dark') {
      if (!theme.value.backgroundColor || theme.value.backgroundColor === DEFAULT_LIGHT_THEME.background) {
        theme.value.backgroundColor = DEFAULT_DARK_THEME.background
      }
    }
    else {
      if (!theme.value.backgroundColor || theme.value.backgroundColor === DEFAULT_DARK_THEME.background) {
        theme.value.backgroundColor = DEFAULT_LIGHT_THEME.background
      }
    }
  }

  /**
   * Toggle modo oscuro/claro
   */
  function toggleMode() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  /**
   * Establece el color primario
   */
  function setPrimaryColor(color: string) {
    theme.value.primaryColor = color
  }

  /**
   * Establece el color de fondo
   */
  function setBackgroundColor(color: string) {
    theme.value.backgroundColor = color
  }

  /**
   * Establece la familia de fuentes
   */
  function setFontFamily(fontFamily: string) {
    theme.value.fontFamily = fontFamily
  }

  /**
   * Establece el tamaño de fuente
   */
  function setFontSize(fontSize: number) {
    theme.value.fontSize = fontSize
  }

  /**
   * Agrega CSS personalizado
   */
  function setCustomCss(css: string) {
    theme.value.customCss = css
  }

  /**
   * Actualiza el tema completo
   */
  function updateTheme(newTheme: Partial<DashboardTheme>) {
    theme.value = {
      ...theme.value,
      ...newTheme,
    }
  }

  /**
   * Resetea el tema a los valores por defecto
   */
  function resetTheme() {
    theme.value = {
      mode: 'light',
      primaryColor: DEFAULT_LIGHT_THEME.primary,
      backgroundColor: DEFAULT_LIGHT_THEME.background,
      fontFamily: 'Roboto, sans-serif',
      fontSize: 14,
      customCss: '',
    }
  }

  /**
   * Obtiene el tema como CSS variables
   */
  const cssVariables = computed(() => {
    return {
      '--dashboard-primary': colors.value.primary,
      '--dashboard-secondary': colors.value.secondary,
      '--dashboard-accent': colors.value.accent,
      '--dashboard-background': colors.value.background,
      '--dashboard-surface': colors.value.surface,
      '--dashboard-text': colors.value.text,
      '--dashboard-text-secondary': colors.value.textSecondary,
      '--dashboard-border': colors.value.border,
      '--dashboard-success': colors.value.success,
      '--dashboard-warning': colors.value.warning,
      '--dashboard-error': colors.value.error,
      '--dashboard-info': colors.value.info,
      '--dashboard-font-family': theme.value.fontFamily,
      '--dashboard-font-size': `${theme.value.fontSize}px`,
    }
  })

  /**
   * Obtiene el tema como string CSS
   */
  const cssString = computed(() => {
    const vars = Object.entries(cssVariables.value)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n  ')

    let css = `:root {\n  ${vars}\n}`

    if (theme.value.customCss) {
      css += `\n\n${theme.value.customCss}`
    }

    return css
  })

  /**
   * Exporta el tema
   */
  function exportTheme(): DashboardTheme {
    return { ...theme.value }
  }

  /**
   * Importa un tema
   */
  function importTheme(importedTheme: DashboardTheme) {
    theme.value = { ...importedTheme }
  }

  /**
   * Aplica el tema al DOM
   */
  function applyTheme() {
    const root = document.documentElement
    Object.entries(cssVariables.value).forEach(([key, value]) => {
      root.style.setProperty(key, String(value))
    })
  }

  /**
   * Remueve el tema del DOM
   */
  function removeTheme() {
    const root = document.documentElement
    Object.keys(cssVariables.value).forEach((key) => {
      root.style.removeProperty(key)
    })
  }

  // Watch para aplicar cambios automáticamente
  watch(
    cssVariables,
    () => {
      applyTheme()
    },
    { deep: true },
  )

  return {
    // State
    theme,
    colors,
    isDark,
    isLight,

    // Computed
    cssVariables,
    cssString,

    // Methods
    setMode,
    toggleMode,
    setPrimaryColor,
    setBackgroundColor,
    setFontFamily,
    setFontSize,
    setCustomCss,
    updateTheme,
    resetTheme,
    exportTheme,
    importTheme,
    applyTheme,
    removeTheme,
  }
}
