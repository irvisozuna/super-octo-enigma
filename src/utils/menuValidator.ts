/**
 * Menu Validator - Detecta errores comunes en configuración de menús
 */

import type { NavGroup, NavLink, VerticalNavItems } from '@/@layouts/types'

interface ValidationError {
  path: string
  message: string
  fix?: string
}

/**
 * Valida que un item de menú tenga el formato correcto
 */
export function validateMenuItem(item: any, path = 'root'): ValidationError[] {
  const errors: ValidationError[] = []

  // Validar que existe
  if (!item) {
    errors.push({
      path,
      message: 'Menu item is null or undefined',
    })

    return errors
  }

  // Validar título
  if (!item.title || typeof item.title !== 'string') {
    errors.push({
      path: `${path}.title`,
      message: 'Menu item must have a title (string)',
      fix: 'Add: title: "Your Title"',
    })
  }

  // Validar icono (error común)
  if (item.icon) {
    if (typeof item.icon === 'string') {
      errors.push({
        path: `${path}.icon`,
        message: `Icon must be an object, not a string. Found: "${item.icon}"`,
        fix: `Change: icon: '${item.icon}' → icon: { icon: '${item.icon}' }`,
      })
    }
    else if (typeof item.icon === 'object' && !item.icon.icon) {
      errors.push({
        path: `${path}.icon`,
        message: 'Icon object must have an "icon" property',
        fix: 'icon: { icon: "tabler-icon-name" }',
      })
    }
  }

  // Validar action y subject para CASL (si no es un heading)
  if (item.to || item.children) {
    if (!item.action) {
      errors.push({
        path: `${path}.action`,
        message: 'Menu item should have an "action" property for CASL permissions',
        fix: 'Add: action: "read" (or "create", "update", "delete")',
      })
    }
    if (!item.subject) {
      errors.push({
        path: `${path}.subject`,
        message: 'Menu item should have a "subject" property for CASL permissions',
        fix: 'Add: subject: "resource-name"',
      })
    }
  }

  // Validar children recursivamente
  if (item.children && Array.isArray(item.children)) {
    item.children.forEach((child: any, index: number) => {
      const childErrors = validateMenuItem(child, `${path}.children[${index}]`)

      errors.push(...childErrors)
    })
  }

  // Validar que no se usen paths absolutos en "to"
  if (item.to && typeof item.to === 'string' && item.to.startsWith('/')) {
    errors.push({
      path: `${path}.to`,
      message: `Route path should use route name, not absolute path: "${item.to}"`,
      fix: 'Use route name instead: to: \'route-name\'',
    })
  }

  return errors
}

/**
 * Valida un array completo de items de menú
 */
export function validateMenu(menuItems: VerticalNavItems, moduleName = 'Unknown'): void {
  const allErrors: ValidationError[] = []

  menuItems.forEach((item, index) => {
    const errors = validateMenuItem(item, `${moduleName}[${index}]`)

    allErrors.push(...errors)
  })

  if (allErrors.length > 0) {
    console.group(`🔴 Menu Validation Errors in ${moduleName}`)
    allErrors.forEach(error => {
      console.error(`\n❌ ${error.path}`)
      console.error(`   ${error.message}`)
      if (error.fix)
        console.info(`   💡 Fix: ${error.fix}`)
    })
    console.groupEnd()

    // En desarrollo, lanzar error para que sea más visible
    if (import.meta.env.DEV) {
      throw new Error(
        `Menu validation failed for ${moduleName}. Check console for details. `
        + `Found ${allErrors.length} error(s).`,
      )
    }
  }
  else {
    console.log(`✅ Menu validation passed for ${moduleName}`)
  }
}

/**
 * Wrapper para validar menús en módulos
 */
export function createValidatedMenu(menuItems: VerticalNavItems, moduleName: string): VerticalNavItems {
  // Solo validar en desarrollo
  if (import.meta.env.DEV)
    validateMenu(menuItems, moduleName)

  return menuItems
}
