#!/usr/bin/env node
/**
 * Verifica el contraste WCAG AA de los tokens de color (src/styles/tokens/colores.json) en claro y oscuro.
 *
 * Pares obligatorios (≥ 4.5:1, texto normal):
 *  - on-<color> sobre <color>, para cada color con on-*.
 *  - <color>-darken-1 sobre surface y sobre background (texto del color sobre superficie, p. ej. chips tonales).
 *  - on-surface, on-background, on-surface-variant sobre su superficie; on-surface al 72 % (énfasis medio).
 *  - primary sobre surface (enlaces).
 * Pares informativos (≥ 3:1, componentes no textuales): <color> sobre surface (puntos del mapa, bordes de estado), outline.
 *
 *   node scripts/ds-contraste.mjs            # tabla y salida 1 si falla algún par obligatorio
 *   node scripts/ds-contraste.mjs --todo     # imprime también los pares que cumplen
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const tokens = JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/styles/tokens/colores.json'), 'utf8'))
const mostrarTodo = process.argv.includes('--todo')

function rgb(hex) {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h

  return [0, 2, 4].map(i => Number.parseInt(n.slice(i, i + 2), 16))
}

function luminancia([r, g, b]) {
  const lin = c => {
    const s = c / 255

    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(rgb(a)), luminancia(rgb(b))].sort((x, y) => y - x)

  return (l1 + 0.05) / (l2 + 0.05)
}

/** Color resultante de poner `frente` con opacidad `alpha` sobre `fondo`. */
function mezclar(frente, fondo, alpha) {
  const f = rgb(frente)
  const b = rgb(fondo)

  return `#${f.map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('')}`
}

let fallos = 0
for (const [nombreTema, tema] of Object.entries(tokens)) {
  if (nombreTema.startsWith('$'))
    continue
  const c = tema.colors
  const filas = []

  const probar = (etiqueta, frente, fondo, minimo, obligatorio = true) => {
    const ratio = contraste(frente, fondo)
    const cumple = ratio >= minimo
    if (!cumple && obligatorio)
      fallos++
    if (!cumple || mostrarTodo)
      filas.push(`  ${cumple ? '✓' : obligatorio ? '✗' : '△'} ${etiqueta.padEnd(52)} ${ratio.toFixed(2).padStart(6)} : 1  (mín. ${minimo})`)
  }

  for (const [nombre, valor] of Object.entries(c)) {
    if (nombre.startsWith('on-') || nombre.endsWith('-darken-1') || nombre.startsWith('grey') || nombre.startsWith('skin') || nombre === 'perfect-scrollbar-thumb' || nombre === 'expansion-panel-text-custom-bg' || nombre === 'grey-light')
      continue
    if (c[`on-${nombre}`])
      probar(`on-${nombre} sobre ${nombre}`, c[`on-${nombre}`], valor, 4.5)
    if (c[`${nombre}-darken-1`]) {
      probar(`${nombre}-darken-1 sobre surface`, c[`${nombre}-darken-1`], c.surface, 4.5)
      probar(`${nombre}-darken-1 sobre background`, c[`${nombre}-darken-1`], c.background, 4.5)
    }
    if (!['background', 'surface', 'surface-variant', 'surface-elevada', 'surface-tabla-cabecera', 'surface-resaltada', 'outline', 'outline-variant'].includes(nombre))
      probar(`${nombre} (relleno) sobre surface`, valor, c.surface, 3, false)
  }
  probar('on-surface al 72 % (énfasis medio) sobre surface', mezclar(c['on-surface'], c.surface, tema.variables['medium-emphasis-opacity']), c.surface, 4.5)
  probar('on-surface al 72 % sobre background', mezclar(c['on-surface'], c.background, tema.variables['medium-emphasis-opacity']), c.background, 4.5)
  probar('primary (enlace) sobre surface', c.primary, c.surface, 4.5)
  probar('primary (enlace) sobre background', c.primary, c.background, 4.5)
  probar('outline sobre surface (borde)', c.outline, c.surface, 1.3, false)
  probar('surface sobre background (tarjeta)', c.surface, c.background, 1.0, false)

  console.log(`\nTema ${nombreTema}: ${filas.length ? '' : 'todos los pares obligatorios cumplen AA'}`)
  filas.forEach(f => console.log(f))
}

if (fallos) {
  console.error(`\n${fallos} pares obligatorios por debajo de 4.5:1`)
  process.exit(1)
}
console.log('\nContraste AA verificado en claro y oscuro.')
