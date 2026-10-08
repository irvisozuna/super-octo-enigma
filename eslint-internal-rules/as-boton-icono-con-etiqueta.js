'use strict'

// ------------------------------------------------------------------------------
// Aquasoft Design System 1.0 · accesibilidad
// Un botón de solo icono (VBtn con `icon`, IconBtn o AsBtnIcono) no dice nada al lector de pantalla ni al usuario que
// pasa el ratón: debe llevar `aria-label`, `title` o un tooltip (`v-tooltip`). La auditoría encontró 59 de 75 sin
// etiqueta (docs/design-system/metricas-base.json).
// ------------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-var-requires
const utils = require('eslint-plugin-vue/lib/utils')

const BOTONES_DE_ICONO = new Set(['iconbtn', 'asbtnicono'])

function tieneAtributo(node, nombre) {
  return Boolean(utils.getAttribute(node, nombre) || utils.getDirective(node, 'bind', nombre))
}

function esBotonDeIcono(node) {
  const nombre = node.rawName.toLowerCase()
  if (BOTONES_DE_ICONO.has(nombre))
    return true
  if (nombre !== 'vbtn' && nombre !== 'v-btn')
    return false

  return tieneAtributo(node, 'icon')
}

function tieneTextoVisible(node) {
  return node.children.some(hijo => {
    if (hijo.type === 'VText')
      return hijo.value.trim() !== ''
    if (hijo.type === 'VExpressionContainer')
      return true
    if (hijo.type === 'VElement')
      return hijo.rawName.toLowerCase() !== 'vicon' && hijo.rawName.toLowerCase() !== 'v-icon' && !hijo.rawName.toLowerCase().startsWith('vtooltip')

    return false
  })
}

function tieneEtiqueta(node) {
  if (tieneAtributo(node, 'aria-label') || tieneAtributo(node, 'title') || tieneAtributo(node, 'aria-labelledby'))
    return true
  if (node.startTag.attributes.some(a => a.directive && a.key.name.name === 'tooltip'))
    return true

  // <VTooltip activator="parent"> dentro del botón también lo describe
  return node.children.some(hijo => hijo.type === 'VElement' && hijo.rawName.toLowerCase().startsWith('vtooltip'))
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Los botones de solo icono deben llevar aria-label, title o tooltip (Aquasoft Design System 1.0)',
      categories: ['base'],
    },
    fixable: null,
    schema: [],
    messages: {
      sinEtiqueta: 'Botón de solo icono sin etiqueta: agrega aria-label, title o v-tooltip para que se entienda qué hace.',
    },
  },

  /** @param {RuleContext} context */
  create(context) {
    return utils.defineTemplateBodyVisitor(context, {
      /** @param {VElement} node */
      VElement(node) {
        if (!esBotonDeIcono(node))
          return
        if (tieneTextoVisible(node) || tieneEtiqueta(node))
          return

        context.report({ node: node.startTag, messageId: 'sinEtiqueta' })
      },
    })
  },
}
