/**
 * Menu Order Configuration
 *
 * Este archivo define el orden en que los menÃºs de los mÃ³dulos aparecerÃ¡n en la navegaciÃ³n.
 * Cada entrada puede tener:
 * - module: nombre del mÃ³dulo (debe coincidir con la carpeta en src/modules)
 * - order: nÃºmero de orden (menor = aparece primero)
 * - enabled: si el menÃº estÃ¡ habilitado o no
 * - section: agrupa menÃºs en secciones (opcional)
 */

export interface MenuOrderConfig {
  module: string
  order: number
  enabled?: boolean
  section?: string
}

/**
 * ConfiguraciÃ³n del orden de menÃºs
 *
 * IMPORTANTE:
 * - Los mÃ³dulos no listados aquÃ­ se agregarÃ¡n al final en orden alfabÃ©tico
 * - Puedes deshabilitar un menÃº cambiando enabled: false
 * - Los nÃºmeros de orden no necesitan ser consecutivos
 */
export const menuOrderConfig: MenuOrderConfig[] = [
  // SecciÃ³n Principal
  // NOTA: El menÃº 'dashboard' requiere que las rutas estÃ©n definidas en tu router
  // Si ves errores de "No match for dashboards-*", dÃ©jalo deshabilitado
  {
    module: 'dashboard',
    order: 5,
    enabled: true, // Deshabilitado porque las rutas no existen
    section: 'main',
  },
  {
    module: 'ClientModule',
    order: 10,
    enabled: true,
    section: 'main',
  },
  {
    module: 'DrillingReportsModule',
    order: 15,
    enabled: true,
    section: 'drilling',
  },
  {
    module: 'DynamicReports',
    order: 20,
    enabled: true,
    section: 'admin',
  },
  {
    module: 'EmployeeModule',
    order: 30,
    enabled: true,
    section: 'main',
  },

  // SecciÃ³n Operaciones
  {
    module: 'TransportModule',
    order: 40,
    enabled: true,
    section: 'operations',
  },
  {
    module: 'paymentmandate',
    order: 50,
    enabled: true,
    section: 'operations',
  },

  // SecciÃ³n AdministraciÃ³n
  {
    module: 'template',
    order: 60,
    enabled: true,
    section: 'admin',
  },
  {
    module: 'user',
    order: 70,
    enabled: true,
    section: 'admin',
  },
  {
    module: 'support',
    order: 80,
    enabled: true,
    section: 'admin',
  },
]

/**
 * ConfiguraciÃ³n de secciones (opcional)
 * Define separadores visuales entre grupos de menÃºs
 */
export interface MenuSectionConfig {
  id: string
  title?: string
  order: number
}

export const menuSections: MenuSectionConfig[] = [
  {
    id: 'main',
    order: 1,
  },
  {
    id: 'drilling',
    title: 'PerforaciÃ³n',
    order: 2,
  },
  {
    id: 'operations',
    title: 'Operaciones',
    order: 3,
  },
  {
    id: 'admin',
    title: 'AdministraciÃ³n',
    order: 4,
  },
]

