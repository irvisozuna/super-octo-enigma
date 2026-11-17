import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import BuscadorGlobal from '../BuscadorGlobal.vue'
import { montar } from '@/components/as/__tests__/montar'
import { buscadorVisible, pareceCuenta, textoBuscador } from '@/utils/buscador'
import es from '@/plugins/i18n/locales/es.json'
import asistenteEs from '@/modules/asistente/locales/es.json'

// En la app los textos de cada módulo se cargan bajo su nombre; el montaje de pruebas solo trae los globales
Object.assign(es, { asistente: asistenteEs })

// XEL1-722: el buscador de la barra superior según los permisos de cada perfil.

vi.mock('@/modules/reportes/services/reportesApi', () => ({
  obtenerMenu: vi.fn(async () => ({
    categorias: [{ nombre: 'Cartera', elementos: [{ tipo: 'reporte', key: 'cartera_vencida_sector', titulo: 'Cartera vencida por sector', descripcion: null, categoria: 'Cartera' }] }],
    documentos: [],
  })),
}))
vi.mock('@/modules/asistente/services/asistenteApi', async original => ({
  ...(await original<object>()),
  listarConversaciones: vi.fn(async () => [{ id: 'c1', titulo: '¿Cuánto se cobró ayer?', mensajes: 2, actualizada: null }]),
}))

const PERFILES = {
  soloSoporte: [{ action: 'read', subject: 'supports' }],
  soloReportes: [{ action: 'read', subject: 'reportes' }],
  conAsistente: [{ action: 'read', subject: 'supports' }, { action: 'read', subject: 'reportes' }, { action: 'use', subject: 'asistente' }],
  sinNada: [{ action: 'read', subject: 'Profile' }],
} as const

function montarCon(reglas: readonly { action: string; subject: string }[]) {
  const router = createRouter({ history: createWebHistory(), routes: [{ path: '/:pathMatch(.*)*', name: 'asistente', component: { template: '<div />' } }] })
  const ability = createMongoAbility(reglas as never)

  return {
    router,
    w: montar(BuscadorGlobal, {
      global: {
        plugins: [router, [abilitiesPlugin, ability, { useGlobalProperties: true }]],
        stubs: { IconBtn: { template: '<button><slot /></button>' } },
      },
    }),
  }
}

async function buscar(w: ReturnType<typeof montarCon>['w'], texto: string) {
  await w.find('.buscador-global').trigger('click')
  await flushPromises()

  const campo = document.querySelector<HTMLInputElement>('#buscador-global')!

  campo.value = texto
  campo.dispatchEvent(new Event('input'))
  await flushPromises()

  return document.body.textContent ?? ''
}

describe('buscador de la barra superior según permisos (XEL1-722)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  afterEach(() => vi.clearAllMocks())

  it('dice qué busca según los permisos y no aparece sin ninguno', () => {
    expect(textoBuscador({ cuentas: true, reportes: false, asistente: false })).toBe('Buscar cuentas')
    expect(textoBuscador({ cuentas: false, reportes: true, asistente: false })).toBe('Buscar reportes')
    expect(textoBuscador({ cuentas: true, reportes: true, asistente: true })).toBe('Buscar cuentas, reportes, conversaciones o ayuda')
    expect(buscadorVisible({ cuentas: false, reportes: false, asistente: false })).toBe(false)
    expect(pareceCuenta('120045')).toBe(true)
    expect(pareceCuenta(' 0012-345 ')).toBe(true)
    expect(pareceCuenta('cartera')).toBe(false)
    expect(pareceCuenta('12')).toBe(false)
  })

  it('sin permisos de Soporte, Reportes ni asistente no muestra el buscador', () => {
    const { w } = montarCon(PERFILES.sinNada)

    expect(w.find('.buscador-global').exists()).toBe(false)
  })

  it('solo Soporte: busca cuentas y abre la cuenta en Soporte, sin reportes ni asistente', async () => {
    const { w, router } = montarCon(PERFILES.soloSoporte)

    expect(w.find('.buscador-global').text()).toContain('Buscar cuentas')

    const texto = await buscar(w, '120045')

    expect(texto).toContain('Abrir la cuenta 120045')
    expect(texto).not.toContain('Preguntar a NuvIA')
    expect(texto).not.toContain('Reportes y tableros')

    // Enter con un número de cuenta abre la cuenta en Soporte
    document.querySelector<HTMLInputElement>('#buscador-global')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/supports?cuenta=120045'))

    expect(await buscar(w, 'cartera')).toContain('Sin resultados. Para una cuenta, escriba su número.')
  })

  it('solo Reportes: busca reportes y no ofrece cuentas ni el asistente', async () => {
    const { w } = montarCon(PERFILES.soloReportes)

    expect(w.find('.buscador-global').text()).toContain('Buscar reportes')
    expect(await buscar(w, 'cartera')).toContain('Cartera vencida por sector')

    const texto = await buscar(w, '120045')

    expect(texto).not.toContain('Abrir la cuenta')
    expect(texto).not.toContain('Preguntar a NuvIA')
  })

  it('con asistente: cuentas, reportes, conversaciones y preguntar', async () => {
    const { w } = montarCon(PERFILES.conAsistente)

    expect(w.find('.buscador-global').text()).toContain('Buscar cuentas, reportes, conversaciones o ayuda')
    expect(await buscar(w, 'cobró')).toContain('¿Cuánto se cobró ayer?')
    expect(await buscar(w, 'cartera')).toContain('Preguntar a NuvIA: «cartera»')
    expect(await buscar(w, '120045')).toContain('Abrir la cuenta 120045')
  })
})
