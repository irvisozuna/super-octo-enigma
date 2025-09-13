/**
 * Utilidades para probar el sistema de tenant bootstrap
 */

export class TenantTestHelper {
  /**
   * Simula un tenant para pruebas locales
   */
  static createMockTenant(slug: string) {
    return {
      companyId: `test-${slug}`,
      slug,
      name: `Test Company ${slug.toUpperCase()}`,
      assets: {
        logo: `https://via.placeholder.com/120x60/7367F0/ffffff?text=${slug.toUpperCase()}`,
        favicon: `https://via.placeholder.com/32x32/7367F0/ffffff?text=${slug.charAt(0).toUpperCase()}`,
        loading: `https://via.placeholder.com/200x100/7367F0/ffffff?text=Loading+${slug.toUpperCase()}`,
      },
      theme: {
        primary: this.getRandomColor(),
        secondary: this.getRandomColor(),
        dark: Math.random() > 0.5,
      },
      i18n: {
        locale: 'es',
        timezone: 'UTC',
      },
      plan: 'premium',
      flags: {
        featureA: true,
        featureB: false,
      },
      version: '1.0.0',
    }
  }

  /**
   * Genera un color aleatorio para pruebas
   */
  private static getRandomColor(): string {
    const colors = [
      '#7367F0',
      '#8C9EFF',
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
    ]

    return colors[Math.floor(Math.random() * colors.length)]
  }

  /**
   * Configura un mock del endpoint de tenant para pruebas
   */
  static setupMockEndpoint() {
    // Solo en desarrollo
    if (import.meta.env.DEV) {
      // Interceptar fetch para el endpoint de tenant
      const originalFetch = window.fetch

      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()

        if (url.includes('/api/public/tenant')) {
          // Simular delay de red
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

          const body = init?.body ? JSON.parse(init.body as string) : {}
          const { host, tenant } = body

          // Simular diferentes tenants basados en host o tenant parameter
          const tenantSlug = tenant || this.extractSlugFromHost(host)

          if (!tenantSlug)
            throw new Error('No tenant found for this domain')

          const mockTenant = this.createMockTenant(tenantSlug)

          return new Response(JSON.stringify(mockTenant), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        }

        // Para otras URLs, usar fetch original
        return originalFetch(input, init)
      }
    }
  }

  /**
   * Extrae slug del host para pruebas
   */
  private static extractSlugFromHost(host: string): string | null {
    // Para localhost, usar un tenant por defecto
    if (host === 'localhost' || host === '127.0.0.1')
      return 'default'

    // Para dominios de prueba, extraer el subdominio
    const parts = host.split('.')
    if (parts.length > 2)
      return parts[0]

    return null
  }

  /**
   * Limpia el cache y localStorage para pruebas
   */
  static clearCache() {
    localStorage.removeItem('tenantBoot')
    localStorage.removeItem('aquasoft-initial-loader-color')
    localStorage.removeItem('aquasoft-initial-loader-bg')
  }

  /**
   * Simula diferentes escenarios de error
   */
  static simulateError(scenario: 'network' | 'not-found' | 'invalid-data' | 'timeout') {
    if (import.meta.env.DEV) {
      const originalFetch = window.fetch

      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()

        if (url.includes('/api/public/tenant')) {
          switch (scenario) {
            case 'network':
              throw new Error('Network error')
            case 'not-found':
              return new Response(JSON.stringify({ error: 'Tenant not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
            case 'invalid-data':
              return new Response(JSON.stringify({ invalid: 'data' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
            case 'timeout':
              await new Promise(resolve => setTimeout(resolve, 10000))
              return new Response(JSON.stringify({}), { status: 200 })
          }
        }

        return originalFetch(input, init)
      }
    }
  }

  /**
   * Restaura el fetch original
   */
  static restoreFetch() {
    if (import.meta.env.DEV) {
      // En un entorno real, esto sería más complejo
      // Por simplicidad, recargamos la página
      window.location.reload()
    }
  }

  /**
   * Obtiene la instancia del servicio de bootstrap
   */
  static getBootstrapService() {
    const { tenantBootstrapService } = require('@/services/tenantBootstrapService')

    return tenantBootstrapService
  }
}

// Auto-configurar en desarrollo
if (import.meta.env.DEV)
  TenantTestHelper.setupMockEndpoint()
