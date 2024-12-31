// menu/index.ts
import { VerticalNavItems } from '@/@layouts/types'
import { useMenuStore } from '@/stores/menu'

export const initializeMenus = () => {
  const menuStore = useMenuStore()

  // Buscar automáticamente los menús definidos en los módulos
  const menuModules = import.meta.glob('@/modules/**/menu.ts', { eager: true })

  // Combinar todos los menús en un solo arreglo
  const combinedMenus: VerticalNavItems = Object.values(menuModules).flatMap((mod: any) => mod.default)

  // Registrar los menús en el store
  menuStore.addNavItems(combinedMenus)
}
