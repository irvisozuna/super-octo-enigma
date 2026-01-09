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
    module: 'Readings',
    order: 10,
    enabled: true,
    section: 'main',
  },
  {
    module: 'contracts',
    order: 20,
    enabled: true,
    section: 'main',
  },

  // Sección Administración
  {
    module: 'user',
    order: 10,
    enabled: true,
    section: 'admin',
  },

  // Módulos deshabilitados o secundarios
  {
    module: 'dashboard',
    order: 100,
    enabled: false,
    section: 'main',
  },
  {
    module: 'ClientModule',
    order: 110,
    enabled: false,
    section: 'main',
  },
  {
    module: 'DrillingReportsModule',
    order: 120,
    enabled: false,
    section: 'drilling',
  },
  {
    module: 'DynamicReports',
    order: 130,
    enabled: false,
    section: 'admin',
  },
  {
    module: 'EmployeeModule',
    order: 140,
    enabled: false,
    section: 'main',
  },
  {
    module: 'TransportModule',
    order: 150,
    enabled: false,
    section: 'operations',
  },
  {
    module: 'paymentmandate',
    order: 160,
    enabled: false,
    section: 'operations',
  },
  {
    module: 'template',
    order: 170,
    enabled: false,
    section: 'admin',
  },
  {
    module: 'support',
    order: 180,
    enabled: false,
    section: 'admin',
  },
  {
    module: 'DocumentsModule',
    order: 190,
    enabled: false,
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
    id: 'admin',
    title: 'Administración',
    order: 2,
  },
  {
    id: 'drilling',
    title: 'Perforación',
    order: 3,
  },
  {
    id: 'operations',
    title: 'Operaciones',
    order: 4,
  },
]

