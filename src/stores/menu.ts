// stores/menu.ts

import { HorizontalNavItems, VerticalNavItems } from '@/@layouts/types'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    baseNavItems: [] as VerticalNavItems, // Menú base
  }),
  getters: {
    // Adaptar el menú base para diseño vertical
    verticalNavItems(): VerticalNavItems {
      return this.baseNavItems
    },
    // Adaptar el menú base para diseño horizontal
    horizontalNavItems(): HorizontalNavItems {
      // Ejemplo: Puedes transformar la estructura si es necesario
      return this.baseNavItems.map((item) => ({
        ...item,
        children: (item as any).children || [],
      })) as HorizontalNavItems
    },
  },
  actions: {
    setNavItems(newItems: VerticalNavItems) {
      this.baseNavItems = newItems
    },
  },
})
