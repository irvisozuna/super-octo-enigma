import { computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useTenantStore } from '@/stores/tenant.store'
import { useConfigStore } from '@core/stores/config'
import { cookieRef } from '@layouts/stores/config'

export function useTenantTheme() {
  const tenantStore = useTenantStore()
  const configStore = useConfigStore()
  const { global: vuetifyTheme } = useTheme()

  // Aplicar colores del tenant al tema de Vuetify
  const applyTenantColors = () => {
    if (!tenantStore.data?.theme)
      return

    // Verificar que Vuetify esté inicializado
    if (!vuetifyTheme || !vuetifyTheme.themes || !vuetifyTheme.themes.value) {
      console.warn('⚠️ Vuetify theme not initialized yet, skipping color application')

      return
    }

    // Verificar que el tema actual exista
    const currentThemeName = vuetifyTheme.name?.value
    if (!currentThemeName || !vuetifyTheme.themes.value[currentThemeName]) {
      console.warn('⚠️ Current Vuetify theme not found:', currentThemeName)

      return
    }

    const { primary, secondary, dark } = tenantStore.data.theme

    const normalizeHex = (value?: string) => {
      if (!value)
        return value
      const trimmed = value.trim()
      if (trimmed.startsWith('#'))
        return trimmed

      return `#${trimmed}`
    }

    const normalizedPrimary = normalizeHex(primary)
    const normalizedSecondary = normalizeHex(secondary)

    const currentTheme = vuetifyTheme.themes.value[currentThemeName]

    // Actualizar colores primarios
    if (normalizedPrimary && currentTheme.colors) {
      currentTheme.colors.primary = normalizedPrimary
      currentTheme.colors['primary-darken-1'] = normalizedPrimary

      // Guardar en localStorage y cookies para persistencia
      localStorage.setItem(`${currentThemeName}ThemePrimaryColor`, normalizedPrimary)
      cookieRef<string | null>('lightThemePrimaryColor', null).value = normalizedPrimary
      cookieRef<string | null>('lightThemePrimaryDarkenColor', null).value = normalizedPrimary
      cookieRef<string | null>('darkThemePrimaryColor', null).value = normalizedPrimary
      cookieRef<string | null>('darkThemePrimaryDarkenColor', null).value = normalizedPrimary
    }

    // Actualizar colores secundarios
    if (normalizedSecondary && currentTheme.colors) {
      currentTheme.colors.secondary = normalizedSecondary
      currentTheme.colors['secondary-darken-1'] = normalizedSecondary

      cookieRef<string | null>('lightThemeSecondaryColor', null).value = normalizedSecondary
      cookieRef<string | null>('lightThemeSecondaryDarkenColor', null).value = normalizedSecondary
      cookieRef<string | null>('darkThemeSecondaryColor', null).value = normalizedSecondary
      cookieRef<string | null>('darkThemeSecondaryDarkenColor', null).value = normalizedSecondary
    }

    // Aplicar modo oscuro - respetar la preferencia del usuario si no está forzada por el tenant
    if (dark !== undefined && vuetifyTheme.name) {
      const themeName = dark ? 'dark' : 'light'

      // Solo cambiar el tema si el tenant lo especifica explícitamente
      // y no hay una preferencia del usuario guardada
      const userThemePreference = localStorage.getItem('theme')
      if (!userThemePreference || userThemePreference === 'system') {
        vuetifyTheme.name.value = themeName
        configStore.theme = themeName
      }
    }
  }

  // Aplicar variables CSS globales
  const applyCSSVariables = () => {
    if (!tenantStore.data?.theme)
      return

    const { primary, secondary, dark } = tenantStore.data.theme

    const normalizeHex = (value?: string) => {
      if (!value)
        return value
      const trimmed = value.trim()
      if (trimmed.startsWith('#'))
        return trimmed

      return `#${trimmed}`
    }

    const normalizedPrimary = normalizeHex(primary)
    const normalizedSecondary = normalizeHex(secondary)

    if (normalizedPrimary) {
      document.documentElement.style.setProperty('--color-primary', normalizedPrimary)
      document.documentElement.style.setProperty('--initial-loader-color', normalizedPrimary)

      // También actualizar las variables que usa el sistema existente
      document.documentElement.style.setProperty('--v-theme-primary', normalizedPrimary)
    }

    if (normalizedSecondary) {
      document.documentElement.style.setProperty('--color-secondary', normalizedSecondary)
      document.documentElement.style.setProperty('--v-theme-secondary', normalizedSecondary)
    }

    // Aplicar clase dark al documento - solo si el tenant lo especifica
    // y no hay una preferencia del usuario
    if (dark !== undefined) {
      const userThemePreference = localStorage.getItem('theme')
      if (!userThemePreference || userThemePreference === 'system') {
        if (dark)
          document.documentElement.classList.add('dark')
        else
          document.documentElement.classList.remove('dark')
      }
    }
  }

  // Aplicar branding completo
  const applyBranding = () => {
    if (!tenantStore.data)
      return

    // Aplicar colores
    applyTenantColors()
    applyCSSVariables()

    // Actualizar título
    if (tenantStore.data.name)
      document.title = tenantStore.data.name

    // Actualizar favicon
    if (tenantStore.data.assets?.favicon)
      updateFavicon(tenantStore.data.assets.favicon)
  }

  // Función para actualizar favicon
  const updateFavicon = (faviconUrl: string) => {
    // Remover favicons existentes
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]')

    existingFavicons.forEach(link => link.remove())

    // Crear nuevo favicon
    const link = document.createElement('link')

    link.rel = 'icon'
    link.href = faviconUrl
    document.head.appendChild(link)
  }

  // Computed para obtener colores actuales
  const currentPrimaryColor = computed(() => {
    return tenantStore.data?.theme?.primary || vuetifyTheme.current.value.colors.primary
  })

  const currentSecondaryColor = computed(() => {
    return tenantStore.data?.theme?.secondary || vuetifyTheme.current.value.colors.secondary
  })

  const isDarkMode = computed(() => {
    return tenantStore.data?.theme?.dark ?? vuetifyTheme.name.value === 'dark'
  })

  // Sincronizar con el sistema de configuración existente
  const syncWithConfigStore = () => {
    if (!tenantStore.data?.theme)
      return

    // Verificar que Vuetify esté inicializado
    if (!vuetifyTheme || !vuetifyTheme.name || !vuetifyTheme.name.value) {
      console.warn('⚠️ Vuetify theme name not initialized, skipping sync')

      return
    }

    const { primary, secondary } = tenantStore.data.theme

    const normalizeHex = (value?: string) => {
      if (!value)
        return value
      const trimmed = value.trim()
      if (trimmed.startsWith('#'))
        return trimmed

      return `#${trimmed}`
    }

    const normalizedPrimary = normalizeHex(primary)
    const normalizedSecondary = normalizeHex(secondary)

    const currentThemeName = vuetifyTheme.name.value

    // Actualizar el store de configuración para que sea consistente
    if (normalizedPrimary) {
      // Guardar en localStorage usando el mismo patrón que config.ts
      localStorage.setItem(`${currentThemeName}ThemePrimaryColor`, normalizedPrimary)
      localStorage.setItem(`${currentThemeName}ThemePrimaryDarkenColor`, normalizedPrimary)

      cookieRef<string | null>('lightThemePrimaryColor', null).value = normalizedPrimary
      cookieRef<string | null>('lightThemePrimaryDarkenColor', null).value = normalizedPrimary
      cookieRef<string | null>('darkThemePrimaryColor', null).value = normalizedPrimary
      cookieRef<string | null>('darkThemePrimaryDarkenColor', null).value = normalizedPrimary
    }

    if (normalizedSecondary) {
      localStorage.setItem(`${currentThemeName}ThemeSecondaryColor`, normalizedSecondary)

      cookieRef<string | null>('lightThemeSecondaryColor', null).value = normalizedSecondary
      cookieRef<string | null>('lightThemeSecondaryDarkenColor', null).value = normalizedSecondary
      cookieRef<string | null>('darkThemeSecondaryColor', null).value = normalizedSecondary
      cookieRef<string | null>('darkThemeSecondaryDarkenColor', null).value = normalizedSecondary
    }
  }

  // Watcher para aplicar cambios automáticamente
  watch(
    () => tenantStore.data,
    () => {
      // Verificar que tenemos datos del tenant y Vuetify está listo
      if (!tenantStore.data) {
        console.log('⏭️ Skipping theme application: no tenant data')

        return
      }

      if (!vuetifyTheme || !vuetifyTheme.themes || !vuetifyTheme.themes.value) {
        console.log('⏭️ Skipping theme application: Vuetify not ready')

        return
      }

      const currentThemeName = vuetifyTheme.name?.value
      if (!currentThemeName || !vuetifyTheme.themes.value[currentThemeName]) {
        console.log('⏭️ Skipping theme application: current theme not found')

        return
      }

      console.log('🎨 Applying tenant branding and theme')
      applyBranding()
      syncWithConfigStore()
    },
    { immediate: true, deep: true },
  )

  // Watcher para sincronizar cuando cambia el tema de Vuetify
  watch(
    () => vuetifyTheme.name.value,
    () => {
      if (!tenantStore.data?.theme) {
        console.log('⏭️ Skipping theme sync: no tenant theme data')

        return
      }

      if (!vuetifyTheme.themes || !vuetifyTheme.themes.value) {
        console.log('⏭️ Skipping theme sync: Vuetify themes not available')

        return
      }

      console.log('🔄 Syncing theme after Vuetify theme change')
      syncWithConfigStore()
    },
  )

  return {
    applyBranding,
    applyTenantColors,
    applyCSSVariables,
    syncWithConfigStore,
    currentPrimaryColor,
    currentSecondaryColor,
    isDarkMode,
  }
}
