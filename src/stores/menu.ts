// stores/menu.ts

import { defineStore } from 'pinia'
import type { HorizontalNavItems, VerticalNavItems } from '@/@layouts/types'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    baseNavItems: [

    ] as VerticalNavItems, // Menú base
  }),
  getters: {
    // Adaptar el menú base para diseño vertical (sin traducción aquí)
    verticalNavItems(): VerticalNavItems {
      return this.baseNavItems
    },

    // Adaptar el menú base para diseño horizontal (sin traducción aquí)
    horizontalNavItems(): HorizontalNavItems {
      // Ejemplo: Puedes transformar la estructura si es necesario
      return this.baseNavItems.map(item => {
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
  },
})
