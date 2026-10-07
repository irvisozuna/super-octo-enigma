import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAlcancesAdmin } from '../composables/useAlcancesAdmin'
import type { RespuestaAlcances, UsuarioAlcance } from '../types/api'

vi.mock('../services/monitoreoApi', () => ({
  obtenerMe: vi.fn(),
  obtenerGerencias: vi.fn(),
  obtenerAlcances: vi.fn(),
  actualizarAlcance: vi.fn(),
}))

const { actualizarAlcance, obtenerAlcances } = await import('../services/monitoreoApi')

const csl = { id: 1, label: 'Cabo San Lucas' }
const sjc = { id: 2, label: 'San José del Cabo' }

function usuario(extra: Partial<UsuarioAlcance> = {}): UsuarioAlcance {
  return {
    id: 'u-1',
    nombre: 'Prueba Atención',
    email: 'prueba.atencion@local.test',
    roles: ['Operación y lecturas'],
    es_admin: false,
    ve_todas: false,
    tiene_monitoreo: true,
    gerencias: [csl],
    ...extra,
  }
}

const respuesta: RespuestaAlcances = {
  usuarios: [
    usuario(),
    usuario({ id: 'u-2', nombre: 'Sistemas', email: 'sistemas@local.test', roles: ['Sistemas OOMSAPAS'], ve_todas: true, gerencias: [] }),
    usuario({ id: 'u-3', nombre: 'Caja', email: 'caja@local.test', roles: ['Finanzas y caja'], tiene_monitoreo: false, gerencias: [] }),
  ],
  gerencias: [csl, sjc],
  aviso: null,
}

describe('useAlcancesAdmin', () => {
  beforeEach(() => {
    vi.mocked(obtenerAlcances).mockReset()
    vi.mocked(actualizarAlcance).mockReset()
  })

  it('carga usuarios y catálogo y arranca la selección con lo asignado', async () => {
    vi.mocked(obtenerAlcances).mockResolvedValue(respuesta)

    const admin = useAlcancesAdmin()

    await admin.cargar()
    await flushPromises()

    expect(admin.usuarios.value).toHaveLength(3)
    expect(admin.catalogoDisponible.value).toBe(true)
    expect(admin.seleccion.value['u-1']).toEqual([1])
    expect(admin.cambio(respuesta.usuarios[0])).toBe(false)
  })

  it('oculta a quien no tiene monitoreo salvo que se pida verlos, y busca por nombre, correo o rol', async () => {
    vi.mocked(obtenerAlcances).mockResolvedValue(respuesta)

    const admin = useAlcancesAdmin()

    await admin.cargar()

    expect(admin.filtrados.value.map(u => u.id)).toEqual(['u-1', 'u-2'])

    admin.soloConMonitoreo.value = false
    expect(admin.filtrados.value).toHaveLength(3)

    admin.busqueda.value = 'finanzas'
    expect(admin.filtrados.value.map(u => u.id)).toEqual(['u-3'])
  })

  it('detecta cambios por fila y guarda solo esa fila con los ids elegidos', async () => {
    vi.mocked(obtenerAlcances).mockResolvedValue(respuesta)
    vi.mocked(actualizarAlcance).mockResolvedValue({ usuario: 'u-1', gerencias: [csl, sjc] })

    const admin = useAlcancesAdmin()

    await admin.cargar()

    const fila = admin.usuarios.value[0]

    admin.seleccionar(fila, [2, 1])
    expect(admin.cambio(fila)).toBe(true)

    expect(await admin.guardar(fila)).toBe(true)
    expect(actualizarAlcance).toHaveBeenCalledWith('u-1', [2, 1])
    expect(admin.usuarios.value[0].gerencias).toEqual([csl, sjc])
    expect(admin.cambio(admin.usuarios.value[0])).toBe(false)
    expect(admin.guardando.value.has('u-1')).toBe(false)
  })

  it('restaurar vuelve a lo asignado y un error al guardar queda visible sin tocar la lista', async () => {
    vi.mocked(obtenerAlcances).mockResolvedValue(respuesta)
    vi.mocked(actualizarAlcance).mockRejectedValue(Object.assign(new Error('Sin conexión'), { status: 503, body: { codigo: 'SIN_CONEXION', mensaje: 'Aquasoft Comercial no responde', reintentable: true } }))

    const admin = useAlcancesAdmin()

    await admin.cargar()

    const fila = admin.usuarios.value[0]

    admin.seleccionar(fila, [])
    admin.restaurar(fila)
    expect(admin.cambio(fila)).toBe(false)

    admin.seleccionar(fila, [2])
    expect(await admin.guardar(fila)).toBe(false)
    expect(admin.errorGuardado.value?.codigo).toBe('SERVIDOR')
    expect(admin.errorGuardado.value?.mensaje).toBe('Aquasoft Comercial no responde')
    expect(admin.usuarios.value[0].gerencias).toEqual([csl])
  })

  it('con Aquasoft Comercial caído muestra el aviso y deshabilita las asignaciones nuevas', async () => {
    vi.mocked(obtenerAlcances).mockResolvedValue({ ...respuesta, gerencias: [], aviso: 'No se pudo leer el catálogo de gerencias de Aquasoft Comercial.' })

    const admin = useAlcancesAdmin()

    await admin.cargar()

    expect(admin.aviso.value).toContain('Aquasoft Comercial')
    expect(admin.catalogoDisponible.value).toBe(false)
  })
})
