import { tenantBootstrapService } from '@/services/tenantBootstrapService'

/**
 * Inicializa el sistema de tenant bootstrap
 * Se ejecuta de manera asíncrona para no bloquear el render inicial
 */
export const initTenant = (): void => {
  // Ejecutar de manera asíncrona para no bloquear el render
  tenantBootstrapService.bootstrap().catch(error => {
    console.error('Tenant initialization failed:', error)

    // El error se maneja en el store del tenant
  })
}

export default initTenant
