// stores/menu.ts
import navItemsIndex from '@/navigation/vertical'
import type { VerticalNavItems } from '@layouts/types'
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    navItems: navItemsIndex as VerticalNavItems,
  }),
  actions: {
    addNavItems(newItems: VerticalNavItems) {
      // Agrega los elementos nuevos al menú existente
      this.navItems = [...this.navItems, ...newItems]
    },
    setNavItems(newItems: VerticalNavItems) {
      console.log('Adding new items:', newItems)
      console.log('Existing items:', this.navItems)
      // Reemplaza el menú completo
      this.navItems = newItems
    },
  },
})
