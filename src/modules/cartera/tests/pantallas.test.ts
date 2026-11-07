import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import type { Component } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
// eslint-disable-next-line no-restricted-imports
import * as components from 'vuetify/components'
import { VLayout } from 'vuetify/components/VLayout'
import * as directives from 'vuetify/directives'

import carteraEs from '../locales/es.json'
import Configuracion from '../views/Configuracion.vue'
import Lote from '../views/Lote.vue'
import Lotes from '../views/Lotes.vue'
import Notificaciones from '../views/Notificaciones.vue'
import Notificar from '../views/Notificar.vue'
import Seguimiento from '../views/Seguimiento.vue'
import PestanaCobranzaContrato from '../components/PestanaCobranzaContrato.vue'
import ordenesEs from '@/modules/ordenes/locales/es.json'
import Agentes from '@/modules/ordenes/views/Agentes.vue'
import Ordenes from '@/modules/ordenes/views/Ordenes.vue'
import Puente from '@/modules/ordenes/views/Puente.vue'
import AsBarraFiltros from '@/components/as/AsBarraFiltros.vue'
import AsDialogo from '@/components/as/AsDialogo.vue'
import AsEncabezadoPagina from '@/components/as/AsEncabezadoPagina.vue'
import AsEstado from '@/components/as/AsEstado.vue'
import AsIndicador from '@/components/as/AsIndicador.vue'
import AsPanelLateral from '@/components/as/AsPanelLateral.vue'
import AsTablaDatos from '@/components/as/AsTablaDatos.vue'
import es from '@/plugins/i18n/locales/es.json'
import { themes } from '@/plugins/vuetify/theme'

/*
 * Montaje de las pantallas con respuestas reales de la API (forma de los controladores de XEL1-630 a XEL1-635): ninguna
 * debe dejar avisos de Vue ni claves de traducción sin resolver.
 */

const cartera = vi.hoisted(() => ({
  obtenerCatalogos: vi.fn(),
  contarCuentas: vi.fn(),
  vistaPrevia: vi.fn(),
  generarLote: vi.fn(),
  obtenerLotes: vi.fn(),
  obtenerLote: vi.fn(),
  descargarDocumentoLote: vi.fn(),
  rearmarDocumentoLote: vi.fn(),
  obtenerNotificaciones: vi.fn(),
  obtenerNotificacion: vi.fn(),
  obtenerNotificacionesContrato: vi.fn(),
  descargarDocumentoNotificacion: vi.fn(),
  capturarResultado: vi.fn(),
  capturarEnBloque: vi.fn(),
  cancelarNotificacion: vi.fn(),
  obtenerConfiguracion: vi.fn(),
  obtenerSeguimiento: vi.fn(),
  accionSeguimiento: vi.fn(),
  cerrarOrdenSeguimiento: vi.fn(),
  guardarConfiguracion: vi.fn(),
}))

const ordenes = vi.hoisted(() => ({ obtenerCatalogo: vi.fn(), obtenerOrdenes: vi.fn(), obtenerAgentes: vi.fn(), guardarAgente: vi.fn(), obtenerPuente: vi.fn() }))

vi.mock('../services/carteraApi', () => cartera)
vi.mock('@/modules/ordenes/services/ordenesApi', () => ordenes)
vi.mock('@layouts/plugins/casl', () => ({ can: () => true }))
vi.mock('@/modules/support/stores/contractStore', () => ({ useContractStore: () => ({ item: { id_account: 7285 } }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: { id: 'a3000000-0000-4000-8000-000000000001' }, query: {} }) }))

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

const item = (id: number, nombre: string, padre: number | null = null) => ({ id, codigo: null, nombre, padre, activo: true })

const catalogos = {
  gerencias: [item(2, 'SAN JOSÉ DEL CABO')],
  sistemas: [item(10, 'SJC', 2)],
  sectores: [item(85, 'MONTE REAL - 5', 10)],
  colonias: [item(678, 'LA RIBERA')],
  tipos_contrato: [item(3, 'DOMÉSTICO A')],
  giros: [],
  estatus: [item(5, 'ACTIVO')],
  notificadores: [{ id: 'a1', nombre: 'José Enrique Cota' }],
  resultados: [{ codigo: 'recibida', nombre: 'Recibida' }, { codigo: 'firmada', nombre: 'Firmada' }],
  configuracion: { vigencia_dias: 90, capacidad_lote: 45, seguimiento_dias: 15 },
  corte: '2026-11-06',
  puede_operar: true,
}

const notificacion = {
  id: 'n1',
  ref: 'NC2611-00038',
  folio: '20261106-0044',
  secuencia: 4939,
  cuenta: '40901818',
  adeudo: 1226.49,
  meses: 5,
  domicilio: ['FRENTE AL PARQUE', 'MORELOS Núm. 1, Col. CENTRO'],
  estado: 'En proceso',
  estado_codigo: 'en_proceso',
  emitida: '2026-11-06T18:00:00+00:00',
  vence: '2027-02-04',
  entregada: null,
  observacion: null,
  cerrada: null,
  origen: 'atencion',
  se_captura_aqui: true,
  ticket: { estado: 'pendiente', error: null, intentos: 0 },
  notificador: 'José Enrique Cota',
  lote: 'l1',
  lote_ref: 'LT2611-001',
}

const lote = { id: 'l1', ref: 'LT2611-001', notificador: 'José Enrique Cota', cuentas: 1, filtros: {}, documento: 'listo', documento_error: null, generado_en: '2026-11-06T18:00:00+00:00' }

let avisos: string[] = []

function montar(componente: Component) {
  const vuetify = createVuetify({ components, directives, aliases: { AsBtnPrimario: components.VBtn, AsBtnSecundario: components.VBtn }, theme: { defaultTheme: 'light', themes } })
  const i18n = createI18n({ legacy: false, locale: 'es', fallbackLocale: 'es', messages: { es: { ...es, cartera: carteraEs, ordenes: ordenesEs } } as never, missingWarn: false, fallbackWarn: false })

  // El panel lateral (VNavigationDrawer) necesita el layout que en la app pone el marco
  return mount({ render: () => h(VLayout, () => h(componente)) }, {
    global: {
      plugins: [vuetify, i18n, createPinia()],
      components: { AsBarraFiltros, AsDialogo, AsEncabezadoPagina, AsEstado, AsIndicador, AsPanelLateral, AsTablaDatos },
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
    attachTo: document.body,
  })
}

beforeEach(() => {
  avisos = []
  vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    avisos.push(a.map(String).join(' '))
  })
  cartera.obtenerCatalogos.mockResolvedValue(catalogos)
  cartera.contarCuentas.mockResolvedValue({ corte: '2026-11-06', en_padron: 1200, con_adeudo: 400, con_vigente: 12, con_convenio: 7, pagaron_despues: 3, a_notificar: 378 })
  cartera.obtenerLotes.mockResolvedValue({ lotes: [lote], paginacion: { pagina: 1, por_pagina: 25, total: 1 } })
  cartera.obtenerLote.mockResolvedValue({ ...lote, notificaciones: [notificacion] })
  cartera.obtenerNotificaciones.mockResolvedValue({ notificaciones: [notificacion], paginacion: { pagina: 1, por_pagina: 50, total: 1 }, puede_operar: true })
  cartera.obtenerNotificacionesContrato.mockResolvedValue({ notificaciones: [{ ...notificacion, estado: 'Recibida', estado_codigo: 'recibida', entregada: '2026-11-07T18:00:00+00:00', recuperado: 726.49, pagado_total: 900 }], vigente: true })
  cartera.obtenerConfiguracion.mockResolvedValue({ valores: { vigencia_dias: 90, capacidad_lote: 45, seguimiento_dias: 15 }, limites: { vigencia_dias: { min: 1, max: 365 }, capacidad_lote: { min: 1, max: 500 }, seguimiento_dias: { min: 1, max: 180 } }, puede_editar: true })
  cartera.obtenerSeguimiento.mockResolvedValue({ dias: 15, candidatas: [{ id: 'n1', ref: 'NC2610-00012', contrato: 7285, cuenta: '40901818', notificador: 'José Enrique Cota', estado: 'Recibida', estado_codigo: 'recibida', origen: 'legado', emitida: '2026-10-01T18:00:00+00:00', entregada: '2026-10-03T18:00:00+00:00', dias: 35, adeudo_notificado: 1226.49, adeudo_actual: 1480.1 }], ordenes: [], puede_operar: true })
  ordenes.obtenerCatalogo.mockResolvedValue({ tipos: [{ codigo: 'cobranza', nombre: 'Notificación de cobranza', refleja_ticket: true, estados: [{ codigo: 'en_proceso', nombre: 'En proceso', inicial: true, cierra: false, cancela: false }] }] })
  ordenes.obtenerOrdenes.mockResolvedValue({ ordenes: [{ id: 'o1', tipo: { codigo: 'cobranza', nombre: 'Notificación de cobranza' }, estado: { codigo: 'en_proceso', nombre: 'En proceso' }, contrato: 7285, cuenta: '40901818', agente: { id: 'a1', nombre: 'José Enrique Cota' }, observacion: null, entregada_en: null, vence: null, origen: 'collections', abierta_en: '2026-11-06T18:00:00+00:00', cerrada_en: null }], paginacion: { pagina: 1, por_pagina: 50, total: 1 } })
  ordenes.obtenerAgentes.mockResolvedValue({ agentes: [{ id: 'a1', nombre: 'José Enrique Cota', usuario_id: null, usuario_comercial: 692, tipos: ['cobranza'], gerencias: [], sectores: [], activo: true }], puede_administrar: true })
  ordenes.obtenerPuente.mockResolvedValue({ tickets_activos: false, conteos: [{ operacion: 'ticket.create', estado: 'pending', n: 2, ultima: '2026-11-06T18:00:00+00:00' }], pendientes: [{ id: 'e1', operacion: 'ticket.create', entidad: 'work_order', entidad_id: 'o1', estado: 'pending', intentos: 0, error: null, disponible_en: null, actualizada: '2026-11-06T18:00:00+00:00' }] })
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('pantallas de cartera y del núcleo', () => {
  it.each([
    ['Notificar', Notificar, ['Notificar', 'Se pueden notificar', '378', 'Adeudo al', '7 con convenio al corriente y 3 que ya pagaron']],
    ['Lotes', Lotes, ['LT2611-001', 'José Enrique Cota', 'Listo']],
    ['Lote', Lote, ['LT2611-001', 'NC2611-00038', '40901818', 'En fila', 'Descargar PDF']],
    ['Notificaciones', Notificaciones, ['NC2611-00038', 'LT2611-001', 'En proceso']],
    ['Configuracion', Configuracion, ['Configuración de cartera', 'Vigencia de la notificación', 'Días sin pago para pasar a seguimiento']],
    ['Seguimiento', Seguimiento, ['Seguimiento', 'Entregadas hace 15 días', 'NC2610-00012', '$1,480.10', 'Notificado $1,226.49', 'Sin pago']],
    ['Ordenes', Ordenes, ['Órdenes de trabajo', 'Notificación de cobranza', '40901818']],
    ['Agentes', Agentes, ['Agentes de campo', 'José Enrique Cota', 'Notificación de cobranza', 'Activo']],
    ['Pestaña de cobranza en Soporte', { render: () => h(PestanaCobranzaContrato, { activa: true }) }, ['NC2611-00038', 'Recibida', 'Entregada', '$726.49', 'vigente', 'Notificación y acta']],
    ['Puente', Puente, ['Puente con Aquasoft Comercial', 'Crear ticket', 'Pendiente', 'Tickets apagados', '6 nov 11:00']],
  ] as const)('%s se monta con datos reales, sin avisos ni claves sin traducir', async (_nombre, vista, textos) => {
    const w = montar(vista as Component)

    await flushPromises()
    await flushPromises()

    const texto = document.body.textContent ?? ''
    for (const t of textos)
      expect(texto).toContain(t)
    expect(texto).not.toMatch(/\b(cartera|ordenes)\.[a-z]+\.[a-zA-Z]+/)
    expect(avisos.filter(a => a.includes('[Vue warn]'))).toEqual([])
    w.unmount()
  })
})
