import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useMonitorStore } from '../stores/monitorStore'

const api = vi.hoisted(() => ({
  obtenerCatalogos: vi.fn(),
  obtenerResumen: vi.fn(),
  obtenerSectores: vi.fn(),
  obtenerLecturistas: vi.fn(),
}))

vi.mock('../services/monitoreoApi', () => api)

function respuestas(sufijo = '') {
  api.obtenerResumen.mockResolvedValue({ periodo: { id: 186 }, dia: '2026-10-07', es_hoy: true, avance: { pct_campo: 22.7 }, sectores: { total: 448, por_estado: {} }, lecturistas: { activos: 2 }, avisos: { total: 1 }, datos: {} })
  api.obtenerSectores.mockResolvedValue({ periodo: { id: 186 }, sectores: [{ sector_id: 1, sector: `SECTOR 1${sufijo}`, estado: 'terminado' }, { sector_id: 2, sector: 'SECTOR 2', estado: 'pendiente' }], resumen: { esperadas: 10 } })
  api.obtenerLecturistas.mockResolvedValue({ periodo: { id: 186 }, dia: '2026-10-07', es_hoy: true, evaluado: '2026-10-07 10:00:00', lecturistas: [{ lecturista_id: 7, estado: 'activo', lecturas: 10 }, { lecturista_id: 8, estado: 'silencio', lecturas: 3 }] })
}

describe('monitorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    respuestas()
  })

  it('carga resumen, sectores y lecturistas con los mismos parámetros', async () => {
    const store = useMonitorStore()

    await store.cargar({ gerencia: 1, dia: '2026-10-06' })

    expect(api.obtenerResumen).toHaveBeenCalledWith({ gerencia: 1, dia: '2026-10-06' }, expect.anything())
    expect(api.obtenerSectores).toHaveBeenCalledWith({ gerencia: 1, dia: '2026-10-06' }, expect.anything())
    expect(api.obtenerLecturistas).toHaveBeenCalledWith({ gerencia: 1, dia: '2026-10-06' }, expect.anything())
    expect(store.listo).toBe(true)
    expect(store.sectorIds).toEqual([1, 2])
    expect(store.lecturistasPorEstado).toEqual({ activo: 1, silencio: 1 })
    expect(store.actualizado).toBeInstanceOf(Date)
    expect(store.error).toBeNull()
  })

  it('refresca sin vaciar lo mostrado y conserva los parámetros', async () => {
    const store = useMonitorStore()

    await store.cargar({ periodo: 185 })
    respuestas(' bis')

    const promesa = store.refrescar()

    expect(store.sectores[0].sector).toBe('SECTOR 1') // sigue lo anterior mientras llega
    expect(store.refrescando).toBe(true)
    await promesa
    expect(store.sectores[0].sector).toBe('SECTOR 1 bis')
    expect(api.obtenerResumen).toHaveBeenLastCalledWith({ periodo: 185 }, expect.anything())
  })

  it('guarda el error normalizado sin perder los datos previos', async () => {
    const store = useMonitorStore()

    await store.cargar({})
    api.obtenerResumen.mockRejectedValueOnce({ status: 503, body: { codigo: 'SIN_CONEXION', mensaje: 'Dolibarr no responde' } })
    await store.refrescar()

    expect(store.error?.mensaje).toContain('Dolibarr no responde')
    expect(store.sectores).toHaveLength(2)
  })

  it('ignora las cancelaciones', async () => {
    const store = useMonitorStore()

    api.obtenerResumen.mockRejectedValueOnce(Object.assign(new Error('cancelado'), { name: 'AbortError' }))
    await store.cargar({})

    expect(store.error).toBeNull()
  })
})
