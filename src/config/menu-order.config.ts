/**
 * Menu Order Configuration
 *
 * Este archivo define el orden en que los menús de los módulos aparecerán en la navegación.
 * Cada entrada puede tener:
 * - module: nombre del módulo (debe coincidir con la carpeta en src/modules)
 * - order: número de orden (menor = aparece primero)
 * - enabled: si el menú está habilitado o no
 * - section: agrupa menús en secciones (opcional)
 */

export interface MenuOrderConfig {
  module: string
  order: number
  enabled?: boolean
  section?: string
}

/**
 * Configuración del orden de menús
 *
 * IMPORTANTE:
 * - Los módulos no listados aquí se agregarán al final en orden alfabético
 * - Puedes deshabilitar un menú cambiando enabled: false
 * - Los números de orden no necesitan ser consecutivos
 */
export const menuOrderConfig: MenuOrderConfig[] = [
  // Sección Principal
  {
    module: 'dashboard',
    order: 5,
    enabled: true,
    section: 'main',
  },
  {
    module: 'Readings',
    order: 10,
    enabled: true,
    section: 'main',
  },
  {
    module: 'WorkOrders',
    order: 15,
    enabled: true,
    section: 'main',
  },
  {
    module: 'contracts',
    order: 20,
    enabled: true,
    section: 'main',
  },
  // {
  //   module: 'LimitationsModule',
  //   order: 25,
  //   enabled: true,
  //   section: 'main',
  // },
  {
    module: 'ClientModule',
    order: 30,
    enabled: true,
    section: 'main',
  },
  {
    module: 'EmployeeModule',
    order: 40,
    enabled: true,
    section: 'main',
  },

  // Sección Perforación
  {
    module: 'DrillingReportsModule',
    order: 10,
    enabled: true,
    section: 'drilling',
  },

  // Sección Operaciones
  {
    module: 'TransportModule',
    order: 10,
    enabled: true,
    section: 'operations',
  },
  {
    module: 'paymentmandate',
    order: 20,
    enabled: true,
    section: 'operations',
  },

  // Sección Administración
  {
    module: 'user',
    order: 10,
    enabled: true,
    section: 'admin',
  },
  {
    module: 'DynamicReports',
    order: 20,
    enabled: true,
    section: 'admin',
  },
  {
    module: 'template',
    order: 30,
    enabled: true,
    section: 'admin',
  },
  {
    module: 'support',
    order: 40,
    enabled: true,
    section: 'admin',
  },
]

/**
 * Configuración de secciones (opcional)
 * Define separadores visuales entre grupos de menús
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
    title: 'Perforación',
    order: 2,
  },
  {
    id: 'operations',
    title: 'Operaciones',
    order: 3,
  },
  {
    id: 'admin',
    title: 'Administración',
    order: 4,
  },
]
