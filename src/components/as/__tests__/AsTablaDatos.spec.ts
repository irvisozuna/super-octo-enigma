import { describe, expect, it } from 'vitest'
import AsTablaDatos from '../AsTablaDatos.vue'
import type { ColumnaTabla } from '../tipos'
import { montar } from './montar'

const columnas: ColumnaTabla[] = [
  { clave: 'sector', titulo: 'Sector' },
  { clave: 'lecturas', titulo: 'Lecturas', formato: 'entero' },
  { clave: 'importe', titulo: 'Importe', formato: 'moneda' },
  { clave: 'avance', titulo: 'Avance', formato: 'porcentaje' },
  { clave: 'fecha', titulo: 'Última', formato: 'fechaHora' },
  { clave: 'estado', titulo: 'Estado', formato: 'estado', colorEstado: v => (v === 'ok' ? 'success' : 'error'), textoEstado: v => (v === 'ok' ? 'Bien' : 'Mal') },
]

const filas = [
  { id: 1, sector: 'SECTOR 1', lecturas: 1234, importe: 1234.5, avance: 98.44, fecha: '2026-10-07 09:33:00', estado: 'ok' },
  { id: 2, sector: 'SECTOR 2', lecturas: null, importe: 0, avance: null, fecha: null, estado: 'mal' },
]

describe('AsTablaDatos', () => {
  it('formatea cada columna según su tipo y alinea las cifras a la derecha', async () => {
    const w = montar(AsTablaDatos, { props: { columnas, filas, porPagina: -1 } })

    await w.vm.$nextTick()

    const texto = w.text()

    expect(texto).toContain('1,234')
    expect(texto).toContain('$1,234.50')
    expect(texto).toContain('98.4 %')
    expect(texto).toContain('07/10/2026 09:33')
    expect(texto).toContain('Bien')
    expect(texto).toContain('Mal')

    const encabezados = w.findAll('th')
    const idx = encabezados.findIndex(th => th.text().includes('Lecturas'))

    expect(encabezados[idx].classes()).toContain('v-data-table-column--align-end')
    expect(encabezados[idx].classes()).toContain('as-tabla__th--num')
    expect(w.findAll('td.as-num').length).toBeGreaterThan(0)

    // Vacíos con guion largo
    expect(w.findAll('td').some(td => td.text() === '—')).toBe(true)

    // Pie con el conteo
    expect(texto).toContain('2 filas')
    w.unmount()
  })

  it('muestra el estado vacío y el de error con reintentar', async () => {
    const w = montar(AsTablaDatos, { props: { columnas, filas: [], vacioTitulo: 'Nada por aquí' } })

    await w.vm.$nextTick()
    expect(w.text()).toContain('Nada por aquí')
    expect(w.find('table').exists()).toBe(false)

    await w.setProps({ error: { codigo: 'SERVIDOR', mensaje: 'Falló la fuente', reintentable: true } })
    expect(w.text()).toContain('Falló la fuente')
    await w.find('button').trigger('click')
    expect(w.emitted('reintentar')).toBeTruthy()
    w.unmount()
  })

  it('emite la fila al hacer clic y resalta la seleccionada', async () => {
    const w = montar(AsTablaDatos, { props: { columnas, filas, clicFila: true, seleccionada: 2, porPagina: -1 } })

    await w.vm.$nextTick()

    const filasDom = w.findAll('tbody tr')

    expect(filasDom[1].classes()).toContain('as-tabla__fila--activa')
    await filasDom[0].trigger('click')
    expect(w.emitted('fila')?.[0]?.[0]).toMatchObject({ id: 1 })
    w.unmount()
  })

  it('pagina en el cliente y respeta la densidad', async () => {
    const muchas = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, sector: `S${i + 1}`, lecturas: i, importe: i, avance: i, fecha: null, estado: 'ok' }))
    const w = montar(AsTablaDatos, { props: { columnas, filas: muchas, porPagina: 10, densidad: 'densa' } })

    await w.vm.$nextTick()
    expect(w.findAll('tbody tr').length).toBe(10)
    expect(w.find('.v-pagination').exists()).toBe(true)
    expect(w.classes()).toContain('as-tabla--densa')
    expect(w.text()).toContain('30 filas')
    w.unmount()
  })

  it('permite sustituir una celda con el slot celda-<clave> y agrega totales', async () => {
    const w = montar(AsTablaDatos, {
      props: { columnas, filas, porPagina: -1, totales: { lecturas: 1234, importe: 1234.5 } },
      slots: { 'celda-sector': '<template #celda-sector="{ fila }"><b class="personalizada">{{ fila.sector.toLowerCase() }}</b></template>' },
    })

    await w.vm.$nextTick()
    expect(w.findAll('.personalizada').length).toBe(2)
    expect(w.find('.personalizada').text()).toBe('sector 1')

    const totales = w.find('.as-tabla__totales')

    expect(totales.exists()).toBe(true)
    expect(totales.text()).toContain('Totales')
    expect(totales.text()).toContain('$1,234.50')
    w.unmount()
  })
})
