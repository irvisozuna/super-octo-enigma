#!/usr/bin/env node
/**
 * Genera una página HTML con las capturas de dos etiquetas lado a lado (antes / después) para la revisión visual.
 *
 *   node tests/visual/comparar.mjs --antes base --despues piloto
 *
 * Salida: tests/visual/capturas/comparacion-<antes>-<despues>.html (abrir en el navegador).
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const args = Object.fromEntries(process.argv.slice(2).join(' ').split('--').filter(Boolean).map(s => s.trim().split(/\s+/)))
const antes = args.antes ?? 'base'
const despues = args.despues ?? 'despues'
const carpeta = path.join(RAIZ, 'tests/visual/capturas')

const leer = etiqueta => JSON.parse(fs.readFileSync(path.join(carpeta, etiqueta, 'manifest.json'), 'utf8'))
const mA = leer(antes)
const mD = leer(despues)

const filas = mA.capturas.filter(c => !c.error).map(c => {
  const d = mD.capturas.find(x => x.id === c.id && x.ancho === c.ancho)
  const rutaA = `${antes}/${c.id}@${c.ancho}.png`
  const rutaD = d && !d.error ? `${despues}/${c.id}@${c.ancho}.png` : null

  return `
    <section>
      <h2>${c.id} <small>${c.ancho} px · antes ${c.alto} px de alto${d && !d.error ? ` · después ${d.alto} px` : ''}</small></h2>
      <div class="par">
        <figure><figcaption>${antes}</figcaption><img src="${rutaA}" loading="lazy" alt="${c.id} antes"></figure>
        <figure><figcaption>${despues}</figcaption>${rutaD ? `<img src="${rutaD}" loading="lazy" alt="${c.id} después">` : '<p class="falta">Sin captura</p>'}</figure>
      </div>
    </section>`
}).join('\n')

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Comparación ${antes} / ${despues}</title>
<style>
  body { margin: 0; padding: 24px; font: 14px/1.4 Inter, system-ui, sans-serif; background: #f7f9fc; color: #1f2937; }
  h1 { font-size: 20px; margin: 0 0 4px; } .meta { color: #6b7280; margin-bottom: 24px; }
  section { margin-bottom: 40px; } h2 { font-size: 15px; margin: 0 0 8px; } h2 small { color: #6b7280; font-weight: 400; }
  .par { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  figure { margin: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
  figcaption { padding: 6px 10px; font-size: 12px; color: #6b7280; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: .04em; }
  img { display: block; width: 100%; height: auto; } .falta { padding: 24px; color: #9ca3af; }
</style></head>
<body>
  <h1>Comparación visual: ${antes} → ${despues}</h1>
  <p class="meta">${antes}: ${mA.generadoEl} · ${despues}: ${mD.generadoEl} · ${mA.capturas.length} capturas</p>
  ${filas}
</body></html>
`

const salida = path.join(carpeta, `comparacion-${antes}-${despues}.html`)

fs.writeFileSync(salida, html)
console.log(`Comparación en ${path.relative(RAIZ, salida)}`)
