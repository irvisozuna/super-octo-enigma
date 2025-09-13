// composables/useMenuTranslation.ts

import { useI18n } from 'vue-i18n'
import type { VerticalNavItems } from '@/@layouts/types'

export function useMenuTranslation() {
  const { t } = useI18n()

  /**
   * Traduce los elementos del menú usando las claves de i18n
   */
  const translateMenuItems = (items: VerticalNavItems): VerticalNavItems => {
    return items.map(item => {
      const translatedItem = { ...item }
      
      // Traducir el título principal si es una clave de traducción
      if (item.title && typeof item.title === 'string' && item.title.includes('.')) {
        translatedItem.title = t(item.title)
      }
      
      // Traducir los hijos si existen
      if (item.children && item.children.length > 0) {
        translatedItem.children = translateMenuItems(item.children)
      }
      
      return translatedItem
    })
  }

  /**
   * Traduce un elemento individual del menú
   */
  const translateMenuItem = (item: any) => {
    const translatedItem = { ...item }
    
    if (item.title && typeof item.title === 'string' && item.title.includes('.')) {
      translatedItem.title = t(item.title)
    }
    
    if (item.children && item.children.length > 0) {
      translatedItem.children = translateMenuItems(item.children)
    }
    
    return translatedItem
  }

  return {
    translateMenuItems,
    translateMenuItem,
  }
}
