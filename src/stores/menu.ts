// stores/menu.ts

import { defineStore } from 'pinia'
import type { HorizontalNavItems, NavGroup, NavLink, VerticalNavItems } from '@/@layouts/types'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    baseNavItems: [

    ] as VerticalNavItems, // Menú base (menu.ts de cada módulo)
    dynamicNavItems: [] as VerticalNavItems, // Entradas que llegan del servidor (p. ej. reportes permitidos por rol)
  }),
  getters: {
    // Adaptar el menú base para diseño vertical
    verticalNavItems(): VerticalNavItems {
      return [...this.baseNavItems, ...this.dynamicNavItems]
    },

    // Adaptar el menú base para diseño horizontal
    horizontalNavItems(): HorizontalNavItems {
      // Ejemplo: Puedes transformar la estructura si es necesario
      return [...this.baseNavItems, ...this.dynamicNavItems].map(item => {
        const newItem = { ...item } as any
        if (!('children' in newItem) || (newItem.children && newItem.children.length === 0))
          delete newItem.children

        return newItem
      }) as HorizontalNavItems
    },
  },
  actions: {
    setNavItems(newItems: VerticalNavItems) {
      this.baseNavItems = newItems
    },
    setDynamicNavItems(newItems: VerticalNavItems) {
      this.dynamicNavItems = newItems
    },

    // Reemplaza los hijos de un grupo del menú base (p. ej. "Reportes" con las categorías que trae el servidor)
    setGroupChildren(title: string, children: (NavLink | NavGroup)[]) {
      const group = this.baseNavItems.find(item => 'children' in item && item.title === title) as NavGroup | undefined
      if (group)
        group.children = children
    },
  },
})
