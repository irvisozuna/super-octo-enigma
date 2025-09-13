import { computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useTenantStore } from '@/stores/tenant.store'
import { useConfigStore } from '@core/stores/config'

export function useTenantTheme() {
  const tenantStore = useTenantStore()
  const configStore = useConfigStore()
  const { global: vuetifyTheme } = useTheme()

  // Aplicar colores del tenant al tema de Vuetify
  const applyTenantColors = () => {
    if (!tenantStore.data?.theme)
      return

    const { primary, secondary, dark } = tenantStore.data.theme

    // Actualizar colores primarios
    if (primary) {
      vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.primary = primary
      vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['primary-darken-1'] = primary

      // Guardar en localStorage para persistencia (usando el mismo patrón que config.ts)
      localStorage.setItem(`${vuetifyTheme.name.value}ThemePrimaryColor`, primary)
    }

    // Actualizar colores secundarios
    if (secondary) {
      vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.secondary = secondary
      vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['secondary-darken-1'] = secondary
    }

    // Aplicar modo oscuro - respetar la preferencia del usuario si no está forzada por el tenant
    if (dark !== undefined) {
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

    if (primary) {
      document.documentElement.style.setProperty('--color-primary', primary)
      document.documentElement.style.setProperty('--initial-loader-color', primary)

      // También actualizar las variables que usa el sistema existente
      document.documentElement.style.setProperty('--v-theme-primary', primary)
    }

    if (secondary) {
      document.documentElement.style.setProperty('--color-secondary', secondary)
      document.documentElement.style.setProperty('--v-theme-secondary', secondary)
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

    const { primary, secondary } = tenantStore.data.theme

    // Actualizar el store de configuración para que sea consistente
    if (primary) {
      // Guardar en localStorage usando el mismo patrón que config.ts
      localStorage.setItem(`${vuetifyTheme.name.value}ThemePrimaryColor`, primary)
      localStorage.setItem(`${vuetifyTheme.name.value}ThemePrimaryDarkenColor`, primary)
    }

    if (secondary)
      localStorage.setItem(`${vuetifyTheme.name.value}ThemeSecondaryColor`, secondary)
  }

  // Watcher para aplicar cambios automáticamente
  watch(
    () => tenantStore.data,
    () => {
      if (tenantStore.data) {
        applyBranding()
        syncWithConfigStore()
      }
    },
    { immediate: true, deep: true },
  )

  // Watcher para sincronizar cuando cambia el tema de Vuetify
  watch(
    () => vuetifyTheme.name.value,
    () => {
      if (tenantStore.data?.theme)
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
