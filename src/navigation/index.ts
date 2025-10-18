// menu/index.ts
import type { VerticalNavItems } from '@/@layouts/types'
import { useMenuStore } from '@/stores/menu'
import { menuOrderConfig, menuSections } from '@/config/menu-order.config'

export const initializeMenus = () => {
  const menuStore = useMenuStore()

  // Buscar automáticamente los menús definidos en los módulos
  const menuModules = import.meta.glob('@/modules/**/menu.ts', { eager: true })

  // Buscar menús estáticos de navegación
  const staticMenus = import.meta.glob('@/navigation/vertical/*.ts', { eager: true })

  // Mapear los módulos por nombre para fácil acceso
  const moduleMenuMap = new Map<string, any[]>()

  // Mapear módulos dinámicos
  Object.entries(menuModules).forEach(([path, mod]: [string, any]) => {
    // Extraer el nombre del módulo del path: /modules/ClientModule/config/menu.ts -> ClientModule
    const moduleNameMatch = path.match(/\/modules\/([^/]+)\//)
    if (moduleNameMatch) {
      const moduleName = moduleNameMatch[1]

      moduleMenuMap.set(moduleName, mod.default || [])
    }
  })

  // Mapear menús estáticos (dashboard, apps, etc.)
  Object.entries(staticMenus).forEach(([path, mod]: [string, any]) => {
    // Extraer el nombre del archivo: /navigation/vertical/dashboard.ts -> dashboard
    // Ignorar index.ts
    const fileNameMatch = path.match(/\/vertical\/([^/]+)\.ts$/)
    if (fileNameMatch && fileNameMatch[1] !== 'index') {
      const fileName = fileNameMatch[1]

      moduleMenuMap.set(fileName, mod.default || [])
    }
  })

  // Ordenar y filtrar menús según la configuración
  const orderedMenus: VerticalNavItems = []

  // Primero, agregar menús configurados en orden
  const configuredModules = new Set<string>()
  const menusBySection = new Map<string, any[]>()

  menuOrderConfig
    .filter(config => config.enabled !== false) // Solo menús habilitados
    .sort((a, b) => a.order - b.order) // Ordenar por número de orden
    .forEach(config => {
      const moduleMenus = moduleMenuMap.get(config.module)
      if (moduleMenus && moduleMenus.length > 0) {
        configuredModules.add(config.module)

        // Agrupar por sección si está definida
        if (config.section) {
          if (!menusBySection.has(config.section))
            menusBySection.set(config.section, [])

          menusBySection.get(config.section)!.push(...moduleMenus)
        }
        else {
          orderedMenus.push(...moduleMenus)
        }
      }
    })

  // Agregar secciones en orden
  menuSections
    .sort((a, b) => a.order - b.order)
    .forEach(section => {
      const sectionMenus = menusBySection.get(section.id)
      if (sectionMenus && sectionMenus.length > 0) {
        // Agregar separador de sección si tiene título
        if (section.title) {
          orderedMenus.push({
            title: section.title,
            heading: section.title,
          })
        }

        orderedMenus.push(...sectionMenus)
      }
    })

  // Agregar menús no configurados al final (en orden alfabético)
  const unconfiguredModules = Array.from(moduleMenuMap.entries())
    .filter(([moduleName]) => !configuredModules.has(moduleName))
    .sort((a, b) => a[0].localeCompare(b[0]))

  unconfiguredModules.forEach(([_moduleName, menus]) => {
    orderedMenus.push(...menus)
  })

  // Registrar los menús en el store
  menuStore.setNavItems(orderedMenus)
}
