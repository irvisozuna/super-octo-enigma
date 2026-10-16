import { beforeEach, describe, expect, it, vi } from 'vitest'

// XEL1-514: cerrar sesión revoca el token y un 401 con token regresa al login

const cookies = vi.hoisted(() => new Map<string, unknown>())
const push = vi.hoisted(() => vi.fn())
const update = vi.hoisted(() => vi.fn())

vi.mock('@core/composable/useCookie', () => ({
  useCookie: (nombre: string) => ({
    get value() { return cookies.get(nombre) ?? null },
    set value(v: unknown) { v === null ? cookies.delete(nombre) : cookies.set(nombre, v) },
  }),
}))
vi.mock('@/plugins/1.router', () => ({
  router: { push, currentRoute: { value: { fullPath: '/reportes/consumo_cuenta' } } },
}))
vi.mock('@/plugins/casl/ability', () => ({ ability: { update } }))

const { cerrarSesion, sesionVencida } = await import('./sesion')

const iniciarSesion = () => {
  for (const nombre of ['accessToken', 'userData', 'userAbilityRules', 'profile', 'company', 'dolibarrToken'])
    cookies.set(nombre, `valor-${nombre}`)
}

describe('sesión', () => {
  beforeEach(() => {
    cookies.clear()
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')))
    iniciarSesion()
  })

  it('revoca el token en la API al cerrar sesión y borra la sesión local', async () => {
    await cerrarSesion()

    const [url, opciones] = vi.mocked(fetch).mock.calls[0]

    expect(String(url)).toMatch(/\/auth\/logout$/)
    expect((opciones?.headers as Record<string, string>).Authorization).toBe('Bearer valor-accessToken')
    expect(cookies.size).toBe(0)
    expect(update).toHaveBeenCalledWith([])
    expect(push).toHaveBeenCalledWith({ name: 'login', query: undefined })
  })

  it('cierra la sesión local aunque la API no responda', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await cerrarSesion()

    expect(cookies.size).toBe(0)
    expect(push).toHaveBeenCalled()
  })

  it('con un 401 borra la sesión y regresa al login a la misma página', async () => {
    await sesionVencida('http://localhost:8090/api/reporting/reports/consumo_cuenta')

    expect(cookies.size).toBe(0)
    expect(push).toHaveBeenCalledWith({ name: 'login', query: { to: '/reportes/consumo_cuenta' } })
  })

  it('ignora el 401 del login (credenciales inválidas) y el de quien no tiene sesión', async () => {
    await sesionVencida('/api/auth/login')
    expect(push).not.toHaveBeenCalled()
    expect(cookies.get('accessToken')).toBe('valor-accessToken')

    cookies.clear()
    await sesionVencida('/api/reporting/menu')
    expect(push).not.toHaveBeenCalled()
  })
})
