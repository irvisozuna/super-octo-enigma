<script setup lang="tsx">
import { useStorage } from '@vueuse/core'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useTheme } from 'vuetify'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { staticPrimaryColor, staticPrimaryDarkenColor, staticSecondaryColor, staticSecondaryDarkenColor } from '@/plugins/vuetify/theme'
import { Direction, Layout, Skins, Theme } from '@core/enums'
import { useConfigStore } from '@core/stores/config'
import { AppContentLayoutNav, ContentWidth } from '@layouts/enums'
import { cookieRef, namespaceConfig } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'
import { useCompanyConfigStore } from '@/modules/CompanyConfigModule/presentation/stores/companyConfigStore'
import { useTenantStore } from '@/stores/tenant.store'

import borderSkin from '@images/customizer-icons/border-light.svg'
import collapsed from '@images/customizer-icons/collapsed-light.svg'
import compact from '@images/customizer-icons/compact-light.svg'
import defaultSkin from '@images/customizer-icons/default-light.svg'
import horizontalLight from '@images/customizer-icons/horizontal-light.svg'
import ltrSvg from '@images/customizer-icons/ltr-light.svg'
import wideSvg from '@images/customizer-icons/wide-light.svg'

const isNavDrawerOpen = ref(false)
const isPreviewMode = ref(false)

const configStore = useConfigStore()
const companyConfigStore = useCompanyConfigStore()
const tenantStore = useTenantStore()

const { config, saving, hasUnsavedChanges } = storeToRefs(companyConfigStore)

// Logo upload refs
const loginLogoInput = ref<HTMLInputElement>()
const menuLogoInput = ref<HTMLInputElement>()
const faviconInput = ref<HTMLInputElement>()

// Preview state - valores temporales que se están editando
const previewState = ref({
  appTitle: '',
  primaryColor: staticPrimaryColor,
  primaryDarkenColor: staticPrimaryDarkenColor,
  secondaryColor: staticSecondaryColor,
  secondaryDarkenColor: staticSecondaryDarkenColor,
  theme: themeConfig.app.theme,
  skin: themeConfig.app.skin,
  semiDarkMenu: themeConfig.verticalNav.isVerticalNavSemiDark,
  layout: 'vertical' as 'vertical' | 'collapsed' | 'horizontal',
  contentWidth: themeConfig.app.contentWidth,
  loginLogo: undefined as string | undefined,
  menuLogo: undefined as string | undefined,
  favicon: undefined as string | undefined,
})

// Saved state - valores guardados originalmente
const savedState = ref({ ...previewState.value })

// 👉 Primary Color
const vuetifyTheme = useTheme()

const colors: { main: string; darken: string }[] = [
  { main: staticPrimaryColor, darken: '#675DD8' },
  { main: '#0D9394', darken: '#0C8485' },
  { main: '#FFB400', darken: '#E6A200' },
  { main: '#FF4C51', darken: '#E64449' },
  { main: '#2E46F6', darken: '#149FE6' },
]

const customPrimaryColor = ref('#663416')
const customSecondaryColor = ref('#FFB400')

// Initialize from company config if available
watch(
  () => config.value,
  newConfig => {
    if (newConfig) {
      previewState.value = {
        appTitle: newConfig.appTitle,
        primaryColor: newConfig.primaryColor,
        primaryDarkenColor: newConfig.primaryDarkenColor,
        secondaryColor: newConfig.secondaryColor,
        secondaryDarkenColor: newConfig.secondaryDarkenColor,
        theme: newConfig.theme,
        skin: newConfig.skin,
        semiDarkMenu: newConfig.semiDarkMenu,
        layout: newConfig.layout,
        contentWidth: newConfig.contentWidth,
        loginLogo: newConfig.loginLogo,
        menuLogo: newConfig.menuLogo,
        favicon: newConfig.favicon,
      }
      savedState.value = { ...previewState.value }
      customPrimaryColor.value = newConfig.primaryColor
      customSecondaryColor.value = newConfig.secondaryColor
    }
  },
  { immediate: true },
)

// Computed para saber si hay cambios
const hasLocalChanges = computed(() => {
  return JSON.stringify(previewState.value) !== JSON.stringify(savedState.value)
})

// 👉 Mode
const themeMode = computed(() => {
  return [
    {
      bgImage: 'tabler-sun',
      value: Theme.Light,
      label: 'Light',
    },
    {
      bgImage: 'tabler-moon-stars',
      value: Theme.Dark,
      label: 'Dark',
    },
    {
      bgImage: 'tabler-device-desktop-analytics',
      value: Theme.System,
      label: 'System',
    },
  ]
})

// 👉 Skin
const themeSkin = computed(() => {
  return [
    {
      bgImage: defaultSkin,
      value: Skins.Default,
      label: 'Default',
    },
    {
      bgImage: borderSkin,
      value: Skins.Bordered,
      label: 'Bordered',
    },
  ]
})

// 👉 Layout
const currentLayout = ref<'vertical' | 'collapsed' | 'horizontal'>('vertical')

const layouts = computed(() => {
  return [
    {
      bgImage: defaultSkin,
      value: Layout.Vertical,
      label: 'Vertical',
    },
    {
      bgImage: collapsed,
      value: Layout.Collapsed,
      label: 'Collapsed',
    },
    {
      bgImage: horizontalLight,
      value: Layout.Horizontal,
      label: 'Horizontal',
    },
  ]
})

// 👉 Content Width
const contentWidth = computed(() => {
  return [
    {
      bgImage: compact,
      value: ContentWidth.Boxed,
      label: 'Compact',
    },
    {
      bgImage: wideSvg,
      value: ContentWidth.Fluid,
      label: 'Wide',
    },
  ]
})

// 👉 Direction
const currentDir = ref('ltr')

const direction = computed(() => {
  return [
    {
      bgImage: ltrSvg,
      value: Direction.Ltr,
      label: 'Left to right',
    },
  ]
})

const { locale } = useI18n({ useScope: 'global' })

const isActiveLangRTL = computed(() => {
  const lang = themeConfig.app.i18n.langConfig.find(l => l.i18nLang === locale.value)

  return lang?.isRTL ?? false
})

// Apply preview - aplicar cambios temporalmente para preview
const applyPreview = () => {
  isPreviewMode.value = true

  // Apply colors
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.primary = previewState.value.primaryColor
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['primary-darken-1'] = previewState.value.primaryDarkenColor
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.secondary = previewState.value.secondaryColor
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['secondary-darken-1'] = previewState.value.secondaryDarkenColor

  // Apply theme settings
  configStore.theme = previewState.value.theme
  configStore.skin = previewState.value.skin
  configStore.isVerticalNavSemiDark = previewState.value.semiDarkMenu

  // Apply layout
  if (previewState.value.layout === 'collapsed') {
    configStore.isVerticalNavCollapsed = true
    configStore.appContentLayoutNav = AppContentLayoutNav.Vertical
  }
  else {
    configStore.isVerticalNavCollapsed = false
    configStore.appContentLayoutNav = previewState.value.layout
  }

  configStore.appContentWidth = previewState.value.contentWidth

  // Update app title temporarily
  if (previewState.value.appTitle)
    document.title = previewState.value.appTitle
}

// Revert preview - volver a los valores guardados
const revertPreview = () => {
  isPreviewMode.value = false

  // Revert to saved state
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.primary = savedState.value.primaryColor
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['primary-darken-1'] = savedState.value.primaryDarkenColor
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.secondary = savedState.value.secondaryColor
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['secondary-darken-1'] = savedState.value.secondaryDarkenColor

  configStore.theme = savedState.value.theme
  configStore.skin = savedState.value.skin
  configStore.isVerticalNavSemiDark = savedState.value.semiDarkMenu

  if (savedState.value.layout === 'collapsed') {
    configStore.isVerticalNavCollapsed = true
    configStore.appContentLayoutNav = AppContentLayoutNav.Vertical
  }
  else {
    configStore.isVerticalNavCollapsed = false
    configStore.appContentLayoutNav = savedState.value.layout
  }

  configStore.appContentWidth = savedState.value.contentWidth

  if (savedState.value.appTitle)
    document.title = savedState.value.appTitle

  // Reset preview state
  previewState.value = { ...savedState.value }
}

// Save configuration
const saveConfiguration = async () => {
  debugger
  try {
    // Primero aplicar los cambios visualmente (como preview)
    applyPreview()

    // Update company config store
    companyConfigStore.updateConfig({
      appTitle: previewState.value.appTitle,
      primaryColor: previewState.value.primaryColor,
      primaryDarkenColor: previewState.value.primaryDarkenColor,
      secondaryColor: previewState.value.secondaryColor,
      secondaryDarkenColor: previewState.value.secondaryDarkenColor,
      theme: previewState.value.theme,
      skin: previewState.value.skin,
      semiDarkMenu: previewState.value.semiDarkMenu,
      layout: previewState.value.layout,
      contentWidth: previewState.value.contentWidth,
      loginLogo: previewState.value.loginLogo,
      menuLogo: previewState.value.menuLogo,
      favicon: previewState.value.favicon,
    })

    // Guardar en la base de datos
    await companyConfigStore.saveConfig()

    // Update saved state
    savedState.value = { ...previewState.value }
    isPreviewMode.value = false

    // Apply permanently with cookies para persistencia en ambos temas
    cookieRef<string | null>('lightThemePrimaryColor', null).value = previewState.value.primaryColor
    cookieRef<string | null>('darkThemePrimaryColor', null).value = previewState.value.primaryColor
    cookieRef<string | null>('lightThemePrimaryDarkenColor', null).value = previewState.value.primaryDarkenColor
    cookieRef<string | null>('darkThemePrimaryDarkenColor', null).value = previewState.value.primaryDarkenColor
    cookieRef<string | null>('lightThemeSecondaryColor', null).value = previewState.value.secondaryColor
    cookieRef<string | null>('darkThemeSecondaryColor', null).value = previewState.value.secondaryColor
    cookieRef<string | null>('lightThemeSecondaryDarkenColor', null).value = previewState.value.secondaryDarkenColor
    cookieRef<string | null>('darkThemeSecondaryDarkenColor', null).value = previewState.value.secondaryDarkenColor
    useStorage<string | null>(namespaceConfig('initial-loader-color'), null).value = previewState.value.primaryColor

    // IMPORTANTE: Limpiar localStorage del tenant para forzar recarga desde API
    // Esto asegura que la próxima vez que se cargue la app, traiga la configuración actualizada
    localStorage.removeItem('tenant-data')
    localStorage.removeItem('tenant-cache-time')
    localStorage.removeItem('tenantBoot')

    console.log('✅ Configuration saved successfully')
    console.log('🗑️ Tenant cache cleared - next load will fetch fresh data')

    // Opcional: Recargar la página para aplicar todos los cambios
    // Puedes descomentar esto si quieres un refresh automático después de guardar
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }
  catch (error) {
    console.error('Failed to save configuration:', error)
  }
}

// Handle logo uploads
const handleLogoUpload = async (event: Event, type: 'login' | 'menu' | 'favicon') => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file)
    return

  try {
    const companyId = tenantStore.currentTenant?.companyId || ''

    // Subir el logo al servidor
    const url = await companyConfigStore.uploadLogo(companyId, file, type)

    console.log(`${type} logo uploaded successfully:`, url)

    // Update preview state con la URL completa
    if (type === 'login')
      previewState.value.loginLogo = url

    else if (type === 'menu')
      previewState.value.menuLogo = url

    else if (type === 'favicon')
      previewState.value.favicon = url

    // Limpiar el input para permitir subir el mismo archivo nuevamente
    target.value = ''
  }
  catch (error) {
    console.error(`Failed to upload ${type} logo:`, error)

    // TODO: Mostrar notificación de error al usuario
  }
}

// Reset configuration
const resetCustomizer = () => {
  revertPreview()
}

// Force refresh from server
const forceRefresh = async () => {
  const companyId = tenantStore.currentTenant?.companyId || ''

  await companyConfigStore.forceRefresh(companyId)
}

// Watch drawer close to revert preview
watch(isNavDrawerOpen, newValue => {
  if (!newValue && isPreviewMode.value && hasLocalChanges.value) {
    // Si se cierra sin guardar, revertir cambios
    revertPreview()
  }
})
</script>

<template>
  <div class="d-lg-block d-none">
    <VBtn
      icon
      class="app-customizer-toggler rounded-s-lg rounded-0"
      style="z-index: 1001;"
      @click="isNavDrawerOpen = true"
    >
      <VIcon
        size="22"
        icon="tabler-settings"
      />
    </VBtn>

    <VNavigationDrawer
      v-model="isNavDrawerOpen"
      temporary
      touchless
      border="none"
      location="end"
      width="400"
      elevation="10"
      :scrim="false"
      class="app-customizer"
    >
      <!-- 👉 Header -->
      <div class="customizer-heading d-flex align-center justify-space-between">
        <div>
          <h6 class="text-h6">
            Theme Customizer
          </h6>
          <p class="text-body-2 mb-0">
            Customize & Preview in Real Time
          </p>
        </div>

        <div class="d-flex align-center gap-1">
          <!-- Preview  Button -->
          <VTooltip text="Preview changes">
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                icon
                variant="text"
                size="small"
                color="medium-emphasis"
                @click="applyPreview"
              >
                <VIcon
                  size="24"
                  color="high-emphasis"
                  icon="tabler-eye"
                />
              </VBtn>
            </template>
          </VTooltip>
          <!-- Force Refresh Button -->
          <VTooltip text="Refresh from server">
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                icon
                variant="text"
                size="small"
                color="medium-emphasis"
                @click="forceRefresh"
              >
                <VIcon
                  size="24"
                  color="high-emphasis"
                  icon="tabler-cloud-download"
                />
              </VBtn>
            </template>
          </VTooltip>

          <!-- Reset Button -->
          <VBtn
            icon
            variant="text"
            size="small"
            color="medium-emphasis"
            @click="resetCustomizer"
          >
            <VBadge
              v-show="hasLocalChanges"
              dot
              color="error"
              offset-x="-29"
              offset-y="-14"
            />
            <VIcon
              size="24"
              color="high-emphasis"
              icon="tabler-refresh"
            />
          </VBtn>

          <!-- Close Button -->
          <VBtn
            icon
            variant="text"
            color="medium-emphasis"
            size="small"
            @click="isNavDrawerOpen = false"
          >
            <VIcon
              icon="tabler-x"
              color="high-emphasis"
              size="24"
            />
          </VBtn>
        </div>
      </div>

      <VDivider />

      <PerfectScrollbar
        tag="ul"
        :options="{ wheelPropagation: false }"
      >
        <!-- SECTION Branding -->
        <CustomizerSection
          title="Branding"
          :divider="false"
        >
          <!-- App Title -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-h6">
              App Title
            </h6>
            <VTextField
              v-model="previewState.appTitle"
              density="compact"
              placeholder="My Application"
            />
          </div>

          <!-- Login Logo -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-h6">
              Login Logo
            </h6>
            <div class="d-flex align-center gap-3">
              <VBtn
                variant="outlined"
                size="small"
                @click="loginLogoInput?.click()"
              >
                <VIcon
                  start
                  icon="tabler-upload"
                />
                Upload
              </VBtn>
              <input
                ref="loginLogoInput"
                type="file"
                accept="image/*"
                hidden
                @change="(e) => handleLogoUpload(e, 'login')"
              >
              <VImg
                v-if="previewState.loginLogo"
                :src="previewState.loginLogo"
                width="60"
                height="60"
                class="rounded"
              />
            </div>
          </div>

          <!-- Menu Logo -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-h6">
              Menu Logo
            </h6>
            <div class="d-flex align-center gap-3">
              <VBtn
                variant="outlined"
                size="small"
                @click="menuLogoInput?.click()"
              >
                <VIcon
                  start
                  icon="tabler-upload"
                />
                Upload
              </VBtn>
              <input
                ref="menuLogoInput"
                type="file"
                accept="image/*"
                hidden
                @change="(e) => handleLogoUpload(e, 'menu')"
              >
              <VImg
                v-if="previewState.menuLogo"
                :src="previewState.menuLogo"
                width="60"
                height="40"
                class="rounded"
              />
            </div>
          </div>

          <!-- Favicon -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-h6">
              Favicon
            </h6>
            <div class="d-flex align-center gap-3">
              <VBtn
                variant="outlined"
                size="small"
                @click="faviconInput?.click()"
              >
                <VIcon
                  start
                  icon="tabler-upload"
                />
                Upload
              </VBtn>
              <input
                ref="faviconInput"
                type="file"
                accept="image/x-icon,image/png"
                hidden
                @change="(e) => handleLogoUpload(e, 'favicon')"
              >
              <VImg
                v-if="previewState.favicon"
                :src="previewState.favicon"
                width="32"
                height="32"
                class="rounded"
              />
            </div>
          </div>
        </CustomizerSection>

        <!-- SECTION Theming -->
        <CustomizerSection title="Theming">
          <!-- 👉 Primary Color -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-h6">
              Primary Color
            </h6>

            <div
              class="d-flex app-customizer-primary-colors"
              style="column-gap: 0.75rem; margin-block-start: 2px;"
            >
              <div
                v-for="color in colors"
                :key="color.main"
                style="
              border-radius: 0.375rem;
              outline: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
              padding-block: 0.5rem;
              padding-inline: 0.625rem;"
                class="primary-color-wrapper cursor-pointer"
                :class="previewState.primaryColor === color.main ? 'active' : ''"
                :style="previewState.primaryColor === color.main ? `outline-color: ${color.main}; outline-width:2px;` : `--v-color:${color.main}`"
                @click="previewState.primaryColor = color.main; previewState.primaryDarkenColor = color.darken"
              >
                <div
                  style="border-radius: 0.375rem;block-size: 2.125rem; inline-size: 1.8938rem;"
                  :style="{ backgroundColor: color.main }"
                />
              </div>

              <div
                class="primary-color-wrapper cursor-pointer d-flex align-center"
                style="
              border-radius: 0.375rem;
              outline: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
              padding-block: 0.5rem;
              padding-inline: 0.625rem;"
                :class="previewState.primaryColor === customPrimaryColor ? 'active' : ''"
                :style="previewState.primaryColor === customPrimaryColor ? `outline-color: ${customPrimaryColor}; outline-width:2px;` : ''"
              >
                <VBtn
                  icon
                  size="30"
                  :color="previewState.primaryColor === customPrimaryColor ? customPrimaryColor : $vuetify.theme.current.dark ? '#8692d029' : '#4b465c29'"
                  variant="flat"
                  style="border-radius: 0.375rem;"
                >
                  <VIcon
                    size="20"
                    icon="tabler-color-picker"
                    :color="previewState.primaryColor === customPrimaryColor ? 'rgb(var(--v-theme-on-primary))' : ''"
                  />
                </VBtn>

                <VMenu
                  activator="parent"
                  :close-on-content-click="false"
                >
                  <VList>
                    <VListItem>
                      <VColorPicker
                        v-model="customPrimaryColor"
                        mode="hex"
                        :modes="['hex']"
                        @update:model-value="previewState.primaryColor = customPrimaryColor; previewState.primaryDarkenColor = customPrimaryColor"
                      />
                    </VListItem>
                  </VList>
                </VMenu>
              </div>
            </div>
          </div>

          <!-- 👉 Secondary Color -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-h6">
              Secondary Color
            </h6>

            <div
              class="d-flex app-customizer-secondary-colors"
              style="column-gap: 0.75rem; margin-block-start: 2px;"
            >
              <div
                v-for="color in colors"
                :key="color.main"
                style="
              border-radius: 0.375rem;
              outline: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
              padding-block: 0.5rem;
              padding-inline: 0.625rem;"
                class="secondary-color-wrapper cursor-pointer"
                :class="previewState.secondaryColor === color.main ? 'active' : ''"
                :style="previewState.secondaryColor === color.main ? `outline-color: ${color.main}; outline-width:2px;` : `--v-color:${color.main}`"
                @click="previewState.secondaryColor = color.main; previewState.secondaryDarkenColor = color.darken"
              >
                <div
                  style="border-radius: 0.375rem;block-size: 2.125rem; inline-size: 1.8938rem;"
                  :style="{ backgroundColor: color.main }"
                />
              </div>

              <div
                class="secondary-color-wrapper cursor-pointer d-flex align-center"
                style="
              border-radius: 0.375rem;
              outline: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
              padding-block: 0.5rem;
              padding-inline: 0.625rem;"
                :class="previewState.secondaryColor === customSecondaryColor ? 'active' : ''"
                :style="previewState.secondaryColor === customSecondaryColor ? `outline-color: ${customSecondaryColor}; outline-width:2px;` : ''"
              >
                <VBtn
                  icon
                  size="30"
                  :color="previewState.secondaryColor === customSecondaryColor ? customSecondaryColor : $vuetify.theme.current.dark ? '#8692d029' : '#4b465c29'"
                  variant="flat"
                  style="border-radius: 0.375rem;"
                >
                  <VIcon
                    size="20"
                    icon="tabler-color-picker"
                    :color="previewState.secondaryColor === customSecondaryColor ? 'rgb(var(--v-theme-on-secondary))' : ''"
                  />
                </VBtn>

                <VMenu
                  activator="parent"
                  :close-on-content-click="false"
                >
                  <VList>
                    <VListItem>
                      <VColorPicker
                        v-model="customSecondaryColor"
                        mode="hex"
                        :modes="['hex']"
                        @update:model-value="previewState.secondaryColor = customSecondaryColor; previewState.secondaryDarkenColor = customSecondaryColor"
                      />
                    </VListItem>
                  </VList>
                </VMenu>
              </div>
            </div>
          </div>

          <!-- 👉 Theme -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-h6">
              Theme
            </h6>

            <CustomRadiosWithImage
              v-model:selected-radio="previewState.theme"
              :radio-content="themeMode"
              :grid-column="{ cols: '4' }"
              class="customizer-skins"
            >
              <template #label="item">
                <span class="text-sm text-medium-emphasis mt-1">{{ item?.label }}</span>
              </template>

              <template #content="{ item }">
                <div
                  class="customizer-skins-icon-wrapper d-flex align-center justify-center py-3 w-100"
                  style="min-inline-size: 100%;"
                >
                  <VIcon
                    size="30"
                    :icon="item.bgImage"
                    color="high-emphasis"
                  />
                </div>
              </template>
            </CustomRadiosWithImage>
          </div>

          <!-- 👉 Skin -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-h6">
              Skins
            </h6>

            <CustomRadiosWithImage
              v-model:selected-radio="previewState.skin"
              :radio-content="themeSkin"
              :grid-column="{ cols: '4' }"
            >
              <template #label="item">
                <span class="text-sm text-medium-emphasis">{{ item?.label }}</span>
              </template>
            </CustomRadiosWithImage>
          </div>

          <!-- 👉 Semi Dark -->
          <div
            class="align-center justify-space-between"
            :class="vuetifyTheme.global.name.value === 'light' && previewState.layout === 'vertical' ? 'd-flex' : 'd-none'"
          >
            <VLabel
              for="customizer-semi-dark"
              class="text-h6 text-high-emphasis"
            >
              Semi Dark Menu
            </VLabel>

            <div>
              <VSwitch
                id="customizer-semi-dark"
                v-model="previewState.semiDarkMenu"
                class="ms-2"
              />
            </div>
          </div>
        </CustomizerSection>
        <!-- !SECTION -->

        <!-- SECTION LAYOUT -->
        <CustomizerSection title="Layout">
          <!-- 👉 Layouts -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-base font-weight-medium">
              Layout
            </h6>

            <CustomRadiosWithImage
              v-model:selected-radio="previewState.layout"
              :radio-content="layouts"
              :grid-column="{ cols: '4' }"
            >
              <template #label="item">
                <span class="text-sm text-medium-emphasis">{{ item.label }}</span>
              </template>
            </CustomRadiosWithImage>
          </div>

          <!-- 👉 Content Width -->
          <div class="d-flex flex-column gap-2">
            <h6 class="text-base font-weight-medium">
              Content
            </h6>

            <CustomRadiosWithImage
              v-model:selected-radio="previewState.contentWidth"
              :radio-content="contentWidth"
              :grid-column="{ cols: '4' }"
            >
              <template #label="item">
                <span class="text-sm text-medium-emphasis">{{ item.label }}</span>
              </template>
            </CustomRadiosWithImage>
          </div>
        </CustomizerSection>
        <!-- !SECTION -->

        <!-- Action Buttons -->
        <VDivider />
        <div class="pa-4">
          <div class="d-flex flex-column gap-2">
            <!-- Preview Button -->
            <VBtn
              block
              color="info"
              variant="outlined"
              :disabled="!hasLocalChanges"
              @click="applyPreview"
            >
              <VIcon
                start
                icon="tabler-eye"
              />
              Preview Changes
            </VBtn>

            <!-- Save Button -->
            <VBtn
              block
              color="primary"
              :loading="saving"
              :disabled="!hasLocalChanges"
              @click="saveConfiguration"
            >
              <VIcon
                start
                icon="tabler-device-floppy"
              />
              Save Configuration
            </VBtn>
          </div>
        </div>
      </PerfectScrollbar>
    </VNavigationDrawer>
  </div>
</template>

<style lang="scss">
.app-customizer {
  .customizer-section {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .customizer-heading {
    padding-block: 1rem;
    padding-inline: 1.5rem;
  }

  .custom-input-wrapper {
    .v-col {
      padding-inline: 10px;
    }

    .v-label.custom-input {
      border: none;
      color: rgb(var(--v-theme-on-surface));
      outline: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }
  }

  .v-navigation-drawer__content {
    display: flex;
    flex-direction: column;
  }

  .v-label.custom-input.active {
    border-color: transparent;
    outline: 2px solid rgb(var(--v-theme-primary));
  }

  .v-label.custom-input:not(.active):hover {
    border-color: rgba(var(--v-border-color), 0.22);
  }

  .customizer-skins {
    .custom-input.active {
      .customizer-skins-icon-wrapper {
        background-color: rgba(var(--v-global-theme-primary), var(--v-selected-opacity));
      }
    }
  }

  .app-customizer-primary-colors {
    .primary-color-wrapper:not(.active) {
      &:hover {
        outline-color: rgba(var(--v-border-color), 0.22) !important;
      }
    }
  }
}

.app-customizer-toggler {
  position: fixed !important;
  inset-block-start: 20%;
  inset-inline-end: 0;
}
</style>
