import { mount } from '@vue/test-utils'
import type { ComponentMountingOptions } from '@vue/test-utils'
import { createPinia } from 'pinia'
import type { Component } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
// eslint-disable-next-line no-restricted-imports
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import es from '@/plugins/i18n/locales/es.json'
import { themes } from '@/plugins/vuetify/theme'

/*
 * Monta un componente del sistema de diseño con Vuetify, i18n (es) y Pinia, en jsdom.
 * jsdom no trae ResizeObserver ni matchMedia: se simulan para que Vuetify no falle.
 */
class ResizeObserverSimulado {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!('ResizeObserver' in globalThis))
  Object.assign(globalThis, { ResizeObserver: ResizeObserverSimulado })

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({ matches: false, media: query, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }),
  })
}

if (!('visualViewport' in window))
  Object.defineProperty(window, 'visualViewport', { value: { width: 1440, height: 900, addEventListener: () => {}, removeEventListener: () => {} } })

export function montar<T extends Component>(componente: T, opciones: ComponentMountingOptions<T> = {}) {
  const vuetify = createVuetify({ components, directives, theme: { defaultTheme: 'light', themes } })
  const i18n = createI18n({ legacy: false, locale: 'es', fallbackLocale: 'es', messages: { es } as never })
  const pinia = createPinia()

  return mount(componente, {
    ...opciones,
    global: {
      ...opciones.global,
      plugins: [vuetify, i18n, pinia, ...(opciones.global?.plugins ?? [])],
      stubs: { RouterLink: { template: '<a><slot /></a>' }, ...(opciones.global?.stubs as Record<string, unknown> ?? {}) },
    },
    attachTo: document.body,
  })
}
