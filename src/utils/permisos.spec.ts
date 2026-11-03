import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import { ability } from '@/plugins/casl/ability'

// XEL1-624: roles cambiados con la sesión abierta se toman sin volver a iniciar sesión

const cookies = vi.hoisted(() => new Map<string, unknown>())
const obtenerAbilities = vi.hoisted(() => vi.fn())

vi.mock('@core/composable/useCookie', () => ({
  useCookie: (nombre: string) => ({
    get value() { return cookies.get(nombre) ?? null },
    set value(v: unknown) { v === null ? cookies.delete(nombre) : cookies.set(nombre, v) },
  }),
}))
vi.mock('@/modules/reportes/services/reportesApi', () => ({ obtenerAbilities }))

const { puedeNavegar, refrescarPermisos } = await import('./permisos')

const lote = { matched: [{ meta: { action: 'generate', subject: 'documentos' } }] } as unknown as RouteLocationNormalized
const conDocumentos = [{ action: 'read', subject: 'reportes' }, { action: 'generate', subject: 'documentos' }]

describe('permisos al día', () => {
  beforeEach(() => {
    cookies.clear()
    vi.clearAllMocks()
    cookies.set('accessToken', 'token')
    ability.update([{ action: 'read', subject: 'reportes' }])
  })

  it('aplica las reglas nuevas del servidor y las guarda en la cookie', async () => {
    obtenerAbilities.mockResolvedValue({ userAbilityRules: conDocumentos })

    expect(puedeNavegar(lote)).toBe(false)
    expect(await refrescarPermisos({ forzar: true })).toBe(true)
    expect(puedeNavegar(lote)).toBe(true)
    expect(cookies.get('userAbilityRules')).toEqual(conDocumentos)
  })

  it('no hace nada si las reglas no cambiaron', async () => {
    obtenerAbilities.mockResolvedValue({ userAbilityRules: [{ action: 'read', subject: 'reportes' }] })

    expect(await refrescarPermisos({ forzar: true })).toBe(false)
    expect(cookies.has('userAbilityRules')).toBe(false)
  })

  it('sin forzar no vuelve a preguntar antes de 30 s, y sin sesión no pregunta', async () => {
    obtenerAbilities.mockResolvedValue({ userAbilityRules: conDocumentos })
    await refrescarPermisos({ forzar: true })
    await refrescarPermisos()
    expect(obtenerAbilities).toHaveBeenCalledTimes(1)

    cookies.delete('accessToken')
    expect(await refrescarPermisos({ forzar: true })).toBe(false)
    expect(obtenerAbilities).toHaveBeenCalledTimes(1)
  })

  it('si el servidor falla se quedan las reglas que había', async () => {
    obtenerAbilities.mockRejectedValue(new Error('sin red'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await refrescarPermisos({ forzar: true })).toBe(false)
    expect(ability.can('read', 'reportes')).toBe(true)
  })
})
