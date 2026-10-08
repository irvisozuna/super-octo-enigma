import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { VLayout } from 'vuetify/components/VLayout'
import AsDialogo from '../AsDialogo.vue'
import AsDialogoGlobal from '../AsDialogoGlobal.vue'
import AsEncabezadoPagina from '../AsEncabezadoPagina.vue'
import AsEstado from '../AsEstado.vue'
import AsIndicador from '../AsIndicador.vue'
import AsPanelLateral from '../AsPanelLateral.vue'
import { montar } from './montar'
import { useDialogoStore } from '@/stores/dialogoStore'

describe('AsEncabezadoPagina', () => {
  it('pinta título h1, descripción, contexto y acciones', () => {
    const w = montar(AsEncabezadoPagina, {
      props: { titulo: 'Alertas', descripcion: 'Lo que necesita atención' },
      slots: { contexto: '<span class="ctx">93 alta</span>', acciones: '<button class="accion">Exportar</button>' },
    })

    expect(w.find('h1').text()).toBe('Alertas')
    expect(w.text()).toContain('Lo que necesita atención')
    expect(w.find('.ctx').exists()).toBe(true)
    expect(w.find('.accion').exists()).toBe(true)
    w.unmount()
  })
})

describe('AsIndicador', () => {
  it('formatea la cifra, el delta y el progreso', () => {
    const w = montar(AsIndicador, { props: { etiqueta: 'Avance de campo', valor: 98.44, formato: 'porcentaje', apoyo: '93,380 de 94,946', progreso: 98.4, delta: -3.5, deltaSufijo: ' %' } })

    expect(w.text()).toContain('98.4 %')
    expect(w.text()).toContain('93,380 de 94,946')
    expect(w.find('.as-indicador__delta').text()).toContain('−3.5 %')
    expect(w.find('.as-indicador__delta').classes()).toContain('text-error')
    expect(w.find('.v-progress-linear').exists()).toBe(true)
    w.unmount()
  })

  it('acepta texto ya armado, invierte el delta y marca el estado de alerta', () => {
    const w = montar(AsIndicador, { props: { etiqueta: 'Tiempo muerto', valor: '1 h 57 min', delta: -12, deltaInvertido: true, estado: 'alerta', interactivo: true } })

    expect(w.text()).toContain('1 h 57 min')
    expect(w.find('.as-indicador__delta').classes()).toContain('text-success')
    expect(w.classes()).toContain('as-indicador--alerta')
    expect(w.attributes('role')).toBe('button')
    w.trigger('click')
    expect(w.emitted('click')).toBeTruthy()
    w.unmount()
  })

  it('muestra esqueleto al cargar y guion cuando no hay dato', () => {
    const w = montar(AsIndicador, { props: { etiqueta: 'Sectores', valor: null } })

    expect(w.find('.as-indicador__valor').text()).toBe('—')

    const c = montar(AsIndicador, { props: { etiqueta: 'Sectores', valor: 5, cargando: true } })

    expect(c.find('.v-skeleton-loader').exists()).toBe(true)
    expect(c.find('.as-indicador__valor').exists()).toBe(false)
    w.unmount()
    c.unmount()
  })
})

describe('AsEstado', () => {
  it('vacío, cargando, sin permiso y error con reintentar', async () => {
    const vacio = montar(AsEstado, { props: { tipo: 'vacio' } })

    expect(vacio.text()).toContain('Sin resultados')

    const cargando = montar(AsEstado, { props: { tipo: 'cargando', filas: 3 } })

    expect(cargando.find('.v-skeleton-loader').exists()).toBe(true)

    const permiso = montar(AsEstado, { props: { tipo: 'sin-permiso' } })

    expect(permiso.text()).toContain('Sin permiso')

    const error = montar(AsEstado, { props: { tipo: 'error', error: { codigo: 'SIN_CONEXION', mensaje: '', reintentable: true } } })

    expect(error.find('.v-alert').exists()).toBe(true)
    await error.find('button').trigger('click')
    expect(error.emitted('reintentar')).toBeTruthy()
    for (const w of [vacio, cargando, permiso, error]) w.unmount()
  })
})

describe('AsPanelLateral', () => {
  it('tiene encabezado, cuerpo desplazable y pie, y cierra con Escape', async () => {
    // El drawer de Vuetify necesita un VLayout alrededor
    const eventos: Record<string, unknown[]> = {}

    const Envoltorio = defineComponent({
      setup: () => () => h(VLayout, () => h(AsPanelLateral, {
        'abierto': true,
        'titulo': 'Detalle del sector',
        'sobrelinea': 'Sector',
        'tamano': 'lg',
        'onUpdate:abierto': (v: boolean) => { (eventos.actualizado ??= []).push(v) },
        'onCerrar': () => { (eventos.cerrado ??= []).push(true) },
      }, { default: () => h('p', { class: 'contenido' }, 'Cuerpo'), pie: () => h('button', 'Guardar') })),
    })

    const w = montar(Envoltorio)

    await w.vm.$nextTick()

    const panel = document.querySelector('.as-panel') as HTMLElement

    expect(panel).not.toBeNull()
    expect(panel.classList.contains('as-panel--lg')).toBe(true)
    expect(panel.querySelector('.as-panel__titulo')?.textContent?.trim()).toBe('Detalle del sector')
    expect(panel.querySelector('.as-sobrelinea')?.textContent?.trim()).toBe('Sector')
    expect(panel.querySelector('.as-panel__cuerpo .contenido')).not.toBeNull()
    expect(panel.querySelector('.as-panel__pie button')).not.toBeNull()
    expect(panel.querySelector('[aria-label="Cerrar panel"]')).not.toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(eventos.actualizado).toEqual([false])
    expect(eventos.cerrado).toEqual([true])
    w.unmount()
  })
})

describe('AsDialogo', () => {
  it('confirma y cancela con los botones del pie', async () => {
    const w = montar(AsDialogo, { props: { abierto: true, titulo: '¿Cerrar la alerta?', textoConfirmar: 'Cerrar alerta', colorConfirmar: 'error' }, slots: { default: 'Se registrará.' } })

    await w.vm.$nextTick()

    const botones = [...document.querySelectorAll('.as-dialogo__acciones button')] as HTMLButtonElement[]

    expect(botones.map(b => b.textContent?.trim())).toEqual(['Cancelar', 'Cerrar alerta'])
    botones[1].click()
    await w.vm.$nextTick()
    expect(w.emitted('confirmar')).toBeTruthy()
    botones[0].click()
    await w.vm.$nextTick()
    expect(w.emitted('cancelar')).toBeTruthy()
    expect(w.emitted('update:abierto')?.[0]).toEqual([false])
    w.unmount()
  })

  it('useDialogo resuelve true o false según el botón', async () => {
    const w = montar(AsDialogoGlobal)
    const store = useDialogoStore()
    const promesa = store.confirmar({ titulo: '¿Eliminar?', mensaje: 'No se puede deshacer', color: 'error', textoConfirmar: 'Eliminar' })

    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(document.body.textContent).toContain('No se puede deshacer')

    const confirmar = [...document.querySelectorAll('.as-dialogo__acciones button')].find(b => b.textContent?.trim() === 'Eliminar') as HTMLButtonElement

    confirmar.click()
    await expect(promesa).resolves.toBe(true)
    expect(store.actual).toBeNull()
    w.unmount()
  })
})
