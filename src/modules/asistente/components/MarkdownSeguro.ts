import { computed, defineComponent, h } from 'vue'
import type { PropType, VNode } from 'vue'
import { RouterLink } from 'vue-router'
import type { Alineacion, Bloque, Linea } from '../utils/markdown'
import { interpretarMarkdown } from '../utils/markdown'
import GraficaChat from './GraficaChat.vue'

/*
 * Pinta la respuesta del asistente con nodos de Vue (sin v-html): ver utils/markdown. Los enlaces internos van con
 * RouterLink; las tablas, con el estilo de tabla del sistema de diseño y desplazamiento horizontal propio.
 */
function linea(nodos: Linea[]): (VNode | string)[] {
  return nodos.map(n => {
    if (n.tipo === 'texto')
      return n.texto
    if (n.tipo === 'negrita')
      return h('strong', linea(n.hijos))
    if (n.tipo === 'cursiva')
      return h('em', linea(n.hijos))
    if (n.tipo === 'codigo')
      return h('code', { class: 'md-codigo' }, n.texto)

    return h(RouterLink, { to: n.destino, class: 'md-enlace' }, () => linea(n.hijos))
  })
}

function celda(etiqueta: 'th' | 'td', contenido: Linea[], alineacion: Alineacion | undefined): VNode {
  return h(etiqueta, { style: { textAlign: alineacion ?? 'start' } }, linea(contenido))
}

function bloque(b: Bloque): VNode {
  if (b.tipo === 'titulo')
    return h(`h${Math.min(6, b.nivel + 2)}`, { class: 'md-titulo' }, linea(b.contenido))
  if (b.tipo === 'parrafo')
    return h('p', { class: 'md-parrafo' }, linea(b.contenido))
  if (b.tipo === 'lista') {
    const inicio = b.ordenada && b.inicio !== 1 ? b.inicio : undefined

    return h(b.ordenada ? 'ol' : 'ul', { class: 'md-lista', start: inicio }, b.elementos.map(e => h('li', linea(e))))
  }
  if (b.tipo === 'tabla') {
    const encabezado = h('tr', b.encabezados.map((c, i) => celda('th', c, b.alineaciones[i])))
    const filas = b.filas.map(fila => h('tr', fila.map((c, i) => celda('td', c, b.alineaciones[i]))))

    return h('div', { class: 'md-tabla' }, [h('table', [h('thead', [encabezado]), h('tbody', filas)])])
  }
  if (b.tipo === 'separador')
    return h('hr', { class: 'md-separador' })
  if (b.tipo === 'grafica')
    return h(GraficaChat, { grafica: b.grafica })
  if (b.tipo === 'graficaPendiente')
    return h('p', { class: 'md-nota' }, 'Preparando la gráfica…')
  if (b.tipo === 'graficaInvalida')
    return h('p', { class: 'md-nota' }, 'No se pudo dibujar la gráfica.')
  if (b.tipo === 'cifras' || b.tipo === 'fuente' || b.tipo === 'sugerencias')
    return h('span', { hidden: true }) // los pinta la tarjeta de respuesta

  return h('pre', { class: 'md-pre' }, h('code', b.texto))
}

export default defineComponent({
  name: 'MarkdownSeguro',
  props: {
    texto: { type: String as PropType<string>, default: '' },

    /** Bloques ya interpretados (la tarjeta de respuesta separa antes cifras, fuente y sugerencias). */
    bloques: { type: Array as PropType<Bloque[]>, default: undefined },
  },
  setup(props) {
    const bloques = computed(() => props.bloques ?? interpretarMarkdown(props.texto))

    return () => h('div', { class: 'md' }, bloques.value.map(bloque))
  },
})
