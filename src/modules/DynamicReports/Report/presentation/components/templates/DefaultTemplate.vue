<!-- DefaultTemplate.vue -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'

interface Props {
  showAppBar?: boolean
  showNavigation?: boolean
  showFooter?: boolean
  fluid?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  showAppBar: true,
  showNavigation: false,
  showFooter: false,
  fluid: false,
  className: '',
})

const { t } = useI18n()
const theme = useTheme()

const navigationDrawer = ref(false)
const isScrolled = ref(false)
const isFullscreen = ref(false)

// Detect scroll for app bar styling
const handleScroll = (): void => {
  isScrolled.value = window.scrollY > 10
}

// Handle fullscreen changes
const handleFullscreenChange = (): void => {
  isFullscreen.value = !!document.fullscreenElement
}

// Computed classes
const mainClass = computed(() => [
  'default-template',
  props.className,
  {
    'default-template--fluid': props.fluid,
    'default-template--fullscreen': isFullscreen.value,
    'default-template--scrolled': isScrolled.value,
  },
])

const contentClass = computed(() => [
  'default-template__content',
  {
    'default-template__content--with-appbar': props.showAppBar,
    'default-template__content--with-navigation': props.showNavigation,
    'default-template__content--with-footer': props.showFooter,
  },
])

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    // Initial scroll state
    handleScroll()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }
})

// Navigation items (if needed)
const navigationItems = computed(() => [
  {
    title: t('navigation.dashboard'),
    icon: 'tabler-dashboard',
    to: '/dashboard',
  },
  {
    title: t('navigation.reports'),
    icon: 'tabler-chart-bar',
    to: '/reports',
  },
  {
    title: t('navigation.settings'),
    icon: 'tabler-settings',
    to: '/settings',
  },
])

const toggleTheme = (): void => {
  theme.change(theme.global.current.value.dark ? 'light' : 'dark')
}
</script>

<template>
  <VApp :class="mainClass">
    <!-- App Bar -->
    <VAppBar
      v-if="showAppBar"
      :elevation="isScrolled ? 4 : 0"
      class="default-template__appbar"
      :class="[
        { 'appbar--scrolled': isScrolled },
      ]"
      density="comfortable"
      color="surface"
    >
      <VSpacer />

      <!-- App Bar Actions -->
      <div class="default-template__actions d-flex align-center">
        <slot name="appbar-actions">
          <!-- Theme Toggle -->
          <VBtn
            icon
            variant="text"
            @click="toggleTheme"
          >
            <VIcon :icon="theme.global.current.value.dark ? 'tabler-sun' : 'tabler-moon'" />
            <VTooltip activator="parent">
              {{ theme.global.current.value.dark ? t('theme.light') : t('theme.dark') }}
            </VTooltip>
          </VBtn>

          <!-- User Menu -->
          <VMenu>
            <template #activator="{ props: menuProps }">
              <VBtn
                icon
                variant="text"
                v-bind="menuProps"
              >
                <VIcon icon="tabler-user" />
              </VBtn>
            </template>

            <VList>
              <VListItem>
                <VListItemTitle>{{ t('user.profile') }}</VListItemTitle>
              </VListItem>
              <VListItem>
                <VListItemTitle>{{ t('user.settings') }}</VListItemTitle>
              </VListItem>
              <VDivider />
              <VListItem>
                <VListItemTitle>{{ t('user.logout') }}</VListItemTitle>
              </VListItem>
            </VList>
          </VMenu>
        </slot>
      </div>
    </VAppBar>

    <!-- Navigation Drawer -->
    <VNavigationDrawer
      v-if="showNavigation"
      v-model="navigationDrawer"
      temporary
      class="default-template__navigation"
    >
      <VList>
        <VListItem
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          :title="item.title"
          :prepend-icon="item.icon"
        />
      </VList>
    </VNavigationDrawer>

    <!-- Main Content -->
    <VMain :class="contentClass">
      <div class="default-template__main">
        <!-- Content Header -->
        <div
          v-if="$slots.header"
          class="default-template__header"
        >
          <slot name="header" />
        </div>

        <!-- Main Content Area -->
        <div class="default-template__body">
          <VContainer
            :fluid="fluid"
            class="default-template__container"
          >
            <slot />
          </VContainer>
        </div>

        <!-- Content Footer -->
        <div
          v-if="$slots.footer"
          class="default-template__content-footer"
        >
          <slot name="footer" />
        </div>
      </div>
    </VMain>

    <!-- App Footer -->
    <VFooter
      v-if="showFooter"
      class="default-template__footer"
      color="surface-variant"
    >
      <slot name="app-footer">
        <div class="d-flex w-100 align-center justify-space-between">
          <div class="text-caption text-medium-emphasis">
            © {{ new Date().getFullYear() }} {{ t('app.name') }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t('app.version', { version: '1.0.0' }) }}
          </div>
        </div>
      </slot>
    </VFooter>

    <!-- Global Loading Overlay -->
    <div
      v-if="$slots.loading"
      class="default-template__loading"
    >
      <slot name="loading" />
    </div>

    <!-- Global Notifications -->
    <div
      v-if="$slots.notifications"
      class="default-template__notifications"
    >
      <slot name="notifications" />
    </div>
  </VApp>
</template>

<style scoped>
.default-template {
  display: flex;
  flex-direction: column;
  min-block-size: 100vh;
}

.default-template--fullscreen {
  position: fixed;
  z-index: 9999;
  inset: 0;
}

/* App Bar */
.default-template__appbar {
  backdrop-filter: blur(8px);
  border-block-end: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.appbar--scrolled {
  background-color: rgba(var(--v-theme-surface), 0.8) !important;
  border-block-end-color: rgb(var(--v-theme-outline-variant));
}

.default-template__title {
  font-weight: 600;
  letter-spacing: -0.025em;
}

.default-template__actions {
  gap: 8px;
}

/* Navigation */
.default-template__navigation {
  border-inline-end: 1px solid rgb(var(--v-theme-outline-variant));
}

/* Content */
.default-template__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-block-size: 0;
}

.default-template__content--with-appbar {
  padding-block-start: 64px;
}

.default-template__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-block-size: 0;
}

.default-template__header {
  background-color: rgb(var(--v-theme-surface-variant));
  border-block-end: 1px solid rgb(var(--v-theme-outline-variant));
}

.default-template__body {
  overflow: hidden;
  flex: 1;
  min-block-size: 0;
}

.default-template__container {
  display: flex;
  flex-direction: column;
  block-size: 100%;
}

.default-template__content-footer {
  background-color: rgb(var(--v-theme-surface-variant));
  border-block-start: 1px solid rgb(var(--v-theme-outline-variant));
}

/* Footer */
.default-template__footer {
  border-block-start: 1px solid rgb(var(--v-theme-outline-variant));
  margin-block-start: auto;
}

/* Fluid layout */
.default-template--fluid .default-template__container {
  padding: 0;
  max-inline-size: none;
}

/* Loading and Notifications */
.default-template__loading {
  position: fixed;
  z-index: 9998;
  inset: 0;
  pointer-events: none;
}

.default-template__notifications {
  position: fixed;
  z-index: 9997;
  inset-block-start: 80px;
  inset-inline-end: 16px;
  pointer-events: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .default-template__content--with-appbar {
    padding-block-start: 56px;
  }

  .default-template__actions {
    gap: 4px;
  }

  .default-template__container {
    padding: 12px;
  }
}

/* Dark theme specific adjustments */
.v-theme--dark .appbar--scrolled {
  background-color: rgba(var(--v-theme-surface), 0.9) !important;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .default-template__appbar {
    border-block-end-width: 2px;
  }

  .default-template__navigation {
    border-inline-end-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .default-template__appbar {
    transition: none;
  }
}

/* Print styles */
@media print {
  .default-template__appbar,
  .default-template__navigation,
  .default-template__footer,
  .default-template__actions {
    display: none !important;
  }

  .default-template__content--with-appbar {
    padding-block-start: 0;
  }

  .default-template__container {
    padding: 0;
  }
}
</style>
