/**
 * Vue Debug Helper - Ayuda a identificar problemas comunes de Vue
 */

// Interceptar errores de setAttribute para dar mejor contexto
export function installVueDebugHelpers() {
  if (!import.meta.env.DEV)
    return

  // Guardar referencia original
  const originalSetAttribute = Element.prototype.setAttribute

  // Interceptar setAttribute para detectar problemas
  Element.prototype.setAttribute = function (name: string, value: any) {
    // Detectar si se intenta usar un número como nombre de atributo
    if (typeof name === 'number' || /^\d+$/.test(name)) {
      console.group('🔴 Invalid Attribute Error Detected')
      console.error(`Trying to set attribute with invalid name: "${name}"`)
      console.error('This usually happens when spreading an array instead of an object in v-bind')
      console.error('Element:', this)
      console.error('Stack trace:')
      console.trace()

      console.info('\n💡 Common causes:')
      console.info('1. Menu icon as string instead of object: icon: "name" ❌ → icon: { icon: "name" } ✅')
      console.info('2. Spreading array in v-bind: v-bind="[...]" ❌ → v-bind="{...}" ✅')
      console.info('3. Wrong prop type passed to component')
      console.groupEnd()

      throw new Error(`Invalid attribute name: "${name}". Check console for details.`)
    }

    // Llamar al método original
    return originalSetAttribute.call(this, name, value)
  }

  console.log('🛠️ Vue Debug Helpers installed')
}

/**
 * Validar props de un componente
 */
export function validateComponentProps(componentName: string, props: Record<string, any>) {
  if (!import.meta.env.DEV)
    return

  Object.entries(props).forEach(([key, value]) => {
    // Detectar arrays donde deberían ser objetos
    if (Array.isArray(value) && key !== 'items' && key !== 'headers' && !key.includes('list')) {
      console.warn(
        `⚠️ ${componentName}: Prop "${key}" is an array. `
        + 'Make sure this is intentional and not supposed to be an object.',
        value,
      )
    }

    // Detectar undefined/null inesperados
    if (value === undefined || value === null)
      console.debug(`ℹ️ ${componentName}: Prop "${key}" is ${value}`)
  })
}

/**
 * Log de ciclo de vida de componente (útil para debugging)
 */
export function logComponentLifecycle(componentName: string) {
  if (!import.meta.env.DEV)
    return

  return {
    onBeforeMount: () => console.log(`🔄 ${componentName}: beforeMount`),
    onMounted: () => console.log(`✅ ${componentName}: mounted`),
    onBeforeUpdate: () => console.log(`🔄 ${componentName}: beforeUpdate`),
    onUpdated: () => console.log(`✅ ${componentName}: updated`),
    onBeforeUnmount: () => console.log(`🔄 ${componentName}: beforeUnmount`),
    onUnmounted: () => console.log(`❌ ${componentName}: unmounted`),
    onErrorCaptured: (err: Error) => {
      console.error(`💥 ${componentName}: error captured`, err)

      return false
    },
  }
}

/**
 * Detectar composables usados fuera de setup
 */
export function detectComposableOutsideSetup() {
  // Esta función puede ser llamada al inicio para añadir warnings
  if (!import.meta.env.DEV)
    return

  console.log('💡 Tip: If you see "inject() can only be used inside setup()", ')
  console.log('   make sure you\'re not calling useRouter(), useI18n(), etc. in class constructors.')
}
