#!/usr/bin/env node
/**
 * Auditoría del sistema de diseño (Aquasoft Design System 1.0).
 *
 * Mide, sobre el código fuente del frontend, las métricas del plan `AQUASOFT-DESIGN-SYSTEM-PLAN.md` §8:
 * colores fijos, estilos en línea, `!important`, tamaños de letra a mano, anchos fijos, props repetidas, formatos de
 * número y fecha, textos sin traducir, iconos por acción, tablas, botones de icono sin etiqueta, responsive y
 * componentes grandes. Sin dependencias: solo Node.
 *
 *   node scripts/ds-audit.mjs                                  # todo src/, imprime resumen
 *   node scripts/ds-audit.mjs --scope src/modules/monitoreo   # solo una carpeta (o varias separadas por coma)
 *   node scripts/ds-audit.mjs --out docs/design-system/metricas-base.json
 *   node scripts/ds-audit.mjs --baseline docs/design-system/metricas-base.json   # imprime las diferencias
 *   node scripts/ds-audit.mjs --umbrales docs/design-system/umbrales.json         # falla si se superan (CI)
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const args = leerArgs(process.argv.slice(2))
const alcances = (args.scope ?? 'src').split(',').map(s => s.trim()).filter(Boolean)
const EXTENSIONES = new Set(['.vue', '.ts', '.scss', '.css'])

/** Archivos donde los colores fijos son legítimos: ahí viven los tokens. */
const ARCHIVOS_TOKENS = [
  /^src\/plugins\/vuetify\/theme\.ts$/,
  /^src\/styles\/tokens\//,
  /^src\/@core\/scss\/(template|base)\/_variables/,
  /^src\/@core\/scss\/base\/libs\/vuetify\/_variables/,
  /^src\/@core\/scss\/template\/libs\/vuetify\/_variables/,
]

// ---------------------------------------------------------------------------------------------------------------------
// Recorrido de archivos

function listar(dir, acc = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === 'node_modules' || entrada.name.startsWith('.'))
      continue
    const ruta = path.join(dir, entrada.name)
    if (entrada.isDirectory())
      listar(ruta, acc)
    else if (EXTENSIONES.has(path.extname(entrada.name)))
      acc.push(ruta)
  }

  return acc
}

const archivos = alcances.flatMap(a => {
  const abs = path.resolve(RAIZ, a)
  if (!fs.existsSync(abs))
    return []

  return fs.statSync(abs).isDirectory() ? listar(abs) : [abs]
}).map(abs => ({ abs, rel: path.relative(RAIZ, abs).split(path.sep).join('/') }))

/** Módulo al que pertenece un archivo: `modules/<x>` o la primera carpeta bajo src. */
function moduloDe(rel) {
  const partes = rel.split('/')
  if (partes[1] === 'modules' && partes[2])
    return partes[2]

  return partes[1] ?? partes[0]
}

/** Separa un SFC en bloques: template, scripts, estilos (con bandera scoped). Para .ts/.scss devuelve un solo bloque. */
function bloques(rel, contenido) {
  const ext = path.extname(rel)
  if (ext === '.scss' || ext === '.css')
    return { template: '', script: '', estilos: [{ scoped: false, texto: contenido }] }
  if (ext === '.ts')
    return { template: '', script: contenido, estilos: [] }
  const template = (contenido.match(/<template[^>]*>([\s\S]*)<\/template>/) ?? [])[1] ?? ''
  const script = [...contenido.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')
  const estilos = [...contenido.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)].map(m => ({ scoped: /\bscoped\b/.test(m[1]), texto: m[2] }))

  return { template, script, estilos }
}

function lineaDe(texto, indice) {
  return texto.slice(0, indice).split('\n').length
}

function contar(texto, re) {
  return [...texto.matchAll(re)].length
}

// ---------------------------------------------------------------------------------------------------------------------
// Métricas

const M = {
  hexEnEstilos: 0,
  hexEnScript: 0,
  rgbSinVarEnEstilos: 0,
  coloresEnLinea: 0,
  propsColorLiteral: 0,
  estilosEnLinea: 0,
  estilosEnLineaDinamicos: 0,
  importantEnScoped: 0,
  importantEnScss: 0,
  fontSizeManual: 0,
  fontSizeValores: new Set(),
  textoMenor12px: 0,
  fontWeightManual: 0,
  anchosFijosPx: 0,
  anchosDrawer: new Set(),
  anchosDialogo: new Set(),
  props: { 'size="small"': 0, 'size="x-small"': 0, 'variant="tonal"': 0, 'variant="outlined"': 0, 'variant="text"': 0, 'variant="flat"': 0, 'density="compact"': 0, 'density="comfortable"': 0, 'text-none': 0 },
  vbtn: 0,
  formatoNumeros: { toLocaleString: 0, toFixed: 0, IntlNumberFormat: 0, n_i18n: 0, formatearPropias: 0, formatCurrency: 0, formatoCompartido: 0 },
  formatoFechas: { dayjs: 0, toLocaleDateString: 0, toLocaleTimeString: 0, IntlDateTimeFormat: 0, propias: 0, formatoCompartido: 0 },
  i18n: { t: 0, cabecerasLiterales: 0, propsLiterales: 0 },
  iconos: { tabler: 0, mdi: 0, fa: 0, distintos: new Set(), porAccion: { editar: {}, exportar: {}, filtrar: {}, cerrar: {}, actualizar: {}, eliminar: {} } },
  tablas: { VDataTable: 0, VDataTableServer: 0, VDataTableVirtual: 0, VTable: 0, tableHtml: 0, AsTablaDatos: 0 },
  botonesIcono: 0,
  botonesIconoSinEtiqueta: 0,
  imagenes: 0,
  imagenesSinAlt: 0,
  responsive: { useDisplay: 0, mediaQueries: 0, rejilla: 0 },
  componentesAs: 0,
}

const porModulo = {}
const detalles = {}
const archivosInfo = []

function modulo(nombre) {
  porModulo[nombre] ??= { archivos: 0, lineas: 0, hexEnEstilos: 0, hexEnScript: 0, estilosEnLinea: 0, importantEnScoped: 0, fontSizeManual: 0, anchosFijosPx: 0, densityCompact: 0, textNone: 0, vbtn: 0, botonesIconoSinEtiqueta: 0, cabecerasLiterales: 0, t: 0 }

  return porModulo[nombre]
}

function detalle(clave, rel, linea, muestra) {
  detalles[clave] ??= []
  if (detalles[clave].length < 40)
    detalles[clave].push(`${rel}:${linea} ${muestra.trim().slice(0, 90)}`)
}

const ACCIONES = {
  editar: /tabler-(pencil|edit|edit-3|edit-circle)\b/g,
  exportar: /tabler-(file-spreadsheet|download|file-download|file-export)\b/g,
  filtrar: /tabler-(adjustments|filter|filter-cog)\b/g,
  cerrar: /tabler-(x|circle-x|square-x)\b/g,
  actualizar: /tabler-(refresh|rotate-clockwise-2|reload)\b/g,
  eliminar: /tabler-(trash|trash-x|x-circle)\b/g,
}

for (const { abs, rel } of archivos) {
  const contenido = fs.readFileSync(abs, 'utf8')
  const lineas = contenido.split('\n').length
  const esTokens = ARCHIVOS_TOKENS.some(re => re.test(rel))
  const mod = modulo(moduloDe(rel))

  mod.archivos++
  mod.lineas += lineas

  const { template, script, estilos } = bloques(rel, contenido)
  const lineasEstilo = estilos.reduce((s, e) => s + e.texto.split('\n').length, 0)

  archivosInfo.push({ rel, lineas, lineasEstilo })

  // 1. Colores fijos
  if (!esTokens) {
    for (const e of estilos) {
      for (const m of e.texto.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
        M.hexEnEstilos++
        mod.hexEnEstilos++
        detalle('hexEnEstilos', rel, lineaDe(e.texto, m.index), e.texto.slice(Math.max(0, m.index - 30), m.index + 20))
      }
      for (const m of e.texto.matchAll(/rgba?\((?!\s*var\(--v-)/g)) {
        M.rgbSinVarEnEstilos++
        detalle('rgbSinVarEnEstilos', rel, lineaDe(e.texto, m.index), e.texto.slice(m.index, m.index + 40))
      }
    }
    for (const m of script.matchAll(/(['"`])#[0-9a-f]{3,8}\1/gi)) {
      M.hexEnScript++
      mod.hexEnScript++
      detalle('hexEnScript', rel, lineaDe(script, m.index), script.slice(Math.max(0, m.index - 30), m.index + 12))
    }
    for (const m of template.matchAll(/:?style="[^"]*(?:#[0-9a-fA-F]{3}|rgba?\()[^"]*"/g)) {
      M.coloresEnLinea++
      detalle('coloresEnLinea', rel, lineaDe(template, m.index), m[0])
    }
    for (const m of template.matchAll(/\scolor="(#[0-9a-fA-F]{3,8}|white|black|red|green|blue|purple|orange|grey|gray)"/g)) {
      M.propsColorLiteral++
      detalle('propsColorLiteral', rel, lineaDe(template, m.index), m[0])
    }
  }

  // 2. Estilos en línea
  for (const m of template.matchAll(/\sstyle="/g)) {
    M.estilosEnLinea++
    mod.estilosEnLinea++
    detalle('estilosEnLinea', rel, lineaDe(template, m.index), template.slice(m.index, m.index + 70))
  }
  M.estilosEnLineaDinamicos += contar(template, /\s:style=/g)

  // 3. !important
  for (const e of estilos) {
    const n = contar(e.texto, /!important/g)
    if (rel.endsWith('.scss') || rel.endsWith('.css')) {
      M.importantEnScss += n
    }
    else {
      // Cualquier <style> de componente cuenta, con o sin scoped
      M.importantEnScoped += n
      mod.importantEnScoped += n
      for (const m of e.texto.matchAll(/^[^\n]*!important[^\n]*$/gm))
        detalle('importantEnScoped', rel, lineaDe(e.texto, m.index), m[0])
    }
  }

  // 4. Tipografía a mano
  if (!esTokens) {
    for (const e of estilos) {
      for (const m of e.texto.matchAll(/font-size:\s*([^;!}]+)/g)) {
        const valor = m[1].trim()
        if (/^(?:var\(|inherit|\$)/.test(valor))
          continue
        M.fontSizeManual++
        mod.fontSizeManual++
        M.fontSizeValores.add(valor)

        const px = aPixeles(valor)
        if (px !== null && px < 12) {
          M.textoMenor12px++
          detalle('textoMenor12px', rel, lineaDe(e.texto, m.index), m[0])
        }
        detalle('fontSizeManual', rel, lineaDe(e.texto, m.index), m[0])
      }
      M.fontWeightManual += contar(e.texto, /font-weight:[^;]+/g)
    }
  }

  // 5. Anchos fijos
  for (const e of estilos) {
    for (const m of e.texto.matchAll(/(?:min-|max-)?(?:inline-size|block-size|width|height):\s*\d+px/g)) {
      if (/^(?:min-|max-)?(?:block-size|height)/.test(m[0]) && !/inline|width/.test(m[0]) && !rel.includes('modules'))
        continue
      M.anchosFijosPx++
      mod.anchosFijosPx++
      detalle('anchosFijosPx', rel, lineaDe(e.texto, m.index), m[0])
    }
  }
  for (const m of template.matchAll(/<VNavigationDrawer[\s\S]*?>/g)) {
    const w = m[0].match(/:?width="(\d+)"/)
    if (w)
      M.anchosDrawer.add(w[1])
  }
  for (const m of template.matchAll(/<VDialog[\s\S]*?>/g)) {
    const w = m[0].match(/:?(?:max-)?width="([^"]+)"/)
    if (w)
      M.anchosDialogo.add(w[1])
  }

  // 6. Props repetidas
  for (const clave of Object.keys(M.props)) {
    const re = clave === 'text-none' ? /class="[^"]*\btext-none\b/g : new RegExp(clave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    const n = contar(template, re)

    M.props[clave] += n
    if (clave === 'density="compact"')
      mod.densityCompact += n
    if (clave === 'text-none')
      mod.textNone += n
  }
  const nBtn = contar(template, /<VBtn\b/g)

  M.vbtn += nBtn
  mod.vbtn += nBtn

  // 7. Formato
  const todo = script + template

  M.formatoNumeros.toLocaleString += contar(todo, /\.toLocaleString\(/g)
  M.formatoNumeros.toFixed += contar(todo, /\.toFixed\(/g)
  M.formatoNumeros.IntlNumberFormat += contar(todo, /Intl\.NumberFormat/g)
  M.formatoNumeros.n_i18n += contar(template, /\{\{[^}]*\bn\(/g) + contar(script, /[^a-zA-Z_.]n\(/g)
  M.formatoNumeros.formatearPropias += contar(todo, /\bformatear(Moneda|Numero|Entero|Porcentaje|Valor)\(/g)
  M.formatoNumeros.formatCurrency += contar(todo, /\$?formatCurrency\(/g)
  M.formatoNumeros.formatoCompartido += contar(script, /from '@\/utils\/formato'/g)
  M.formatoFechas.dayjs += contar(script, /\bdayjs\b/g)
  M.formatoFechas.toLocaleDateString += contar(todo, /toLocaleDateString\(/g)
  M.formatoFechas.toLocaleTimeString += contar(todo, /toLocaleTimeString\(/g)
  M.formatoFechas.IntlDateTimeFormat += contar(todo, /Intl\.DateTimeFormat/g)
  M.formatoFechas.propias += contar(todo, /\b(fechaCorta|horaCorta|formatearFecha(Hora)?|\$?formatDate|formatDateToMonthShort)\(/g)
  M.formatoFechas.formatoCompartido += contar(script, /from '@\/utils\/formato'/g)

  // 8. i18n
  const nT = contar(todo, /(?<![a-zA-Z_$.])\$?t\(/g)

  M.i18n.t += nT
  mod.t += nT
  for (const m of script.matchAll(/\btitle:\s*'([^']{2,})'/g)) {
    if (/[a-záéíóúñ]/i.test(m[1]) && !/^[a-z_]+$/.test(m[1])) {
      M.i18n.cabecerasLiterales++
      mod.cabecerasLiterales++
      detalle('cabecerasLiterales', rel, lineaDe(script, m.index), m[0])
    }
  }
  for (const m of template.matchAll(/\s(?:label|title|placeholder)="([^"{}$]{2,})"/g)) {
    if (/[a-záéíóúñ]/i.test(m[1])) {
      M.i18n.propsLiterales++
      detalle('propsLiterales', rel, lineaDe(template, m.index), m[0])
    }
  }

  // 9. Iconos
  for (const m of todo.matchAll(/\b(tabler|mdi|fa)-[a-z0-9-]+/g)) {
    M.iconos[m[1]]++
    M.iconos.distintos.add(m[0])
  }
  for (const [accion, re] of Object.entries(ACCIONES)) {
    for (const m of todo.matchAll(re)) {
      const cubo = M.iconos.porAccion[accion]

      cubo[m[0]] = (cubo[m[0]] ?? 0) + 1
    }
  }

  // 10. Tablas
  M.tablas.VDataTable += contar(template, /<VDataTable[\s>]/g)
  M.tablas.VDataTableServer += contar(template, /<VDataTableServer\b/g)
  M.tablas.VDataTableVirtual += contar(template, /<VDataTableVirtual\b/g)
  M.tablas.VTable += contar(template, /<VTable\b/g)
  M.tablas.tableHtml += contar(template, /<table\b/g)
  M.tablas.AsTablaDatos += contar(template, /<AsTablaDatos\b/g)

  // 11. Accesibilidad
  for (const m of template.matchAll(/<(?:VBtn|IconBtn|AsBtnIcono)\b[^>]*?(?:\sicon[=\s>]|<IconBtn|<AsBtnIcono)[\s\S]*?>/g)) {
    const etiqueta = m[0]
    if (!/<(?:VBtn|IconBtn|AsBtnIcono)/.test(etiqueta))
      continue

    // VBtn con `icon` como prop (booleana o con valor) o los alias de botón de icono
    if (/<VBtn/.test(etiqueta) && !/\sicon[=\s>]/.test(etiqueta))
      continue
    M.botonesIcono++

    const contexto = template.slice(m.index, m.index + etiqueta.length + 160)
    if (!/aria-label|\stitle=|v-tooltip|<VTooltip/.test(contexto)) {
      M.botonesIconoSinEtiqueta++
      mod.botonesIconoSinEtiqueta++
      detalle('botonesIconoSinEtiqueta', rel, lineaDe(template, m.index), etiqueta.replace(/\s+/g, ' '))
    }
  }
  for (const m of template.matchAll(/<(?:img|VImg)\b[^>]*>/g)) {
    M.imagenes++
    if (!/\salt=/.test(m[0]))
      M.imagenesSinAlt++
  }

  // 12. Responsive
  M.responsive.useDisplay += contar(script, /useDisplay\(/g)
  M.responsive.mediaQueries += estilos.reduce((s, e) => s + contar(e.texto, /@media/g), 0)
  M.responsive.rejilla += contar(template, /\s(?:cols|sm|md|lg|xl)="/g)

  // 13. Adopción del sistema
  M.componentesAs += contar(template, /<As[A-Z][A-Za-z]+\b/g)
}

function aPixeles(valor) {
  const m = valor.match(/^([\d.]+)(px|rem|em)/)
  if (!m)
    return null
  const n = Number.parseFloat(m[1])

  return m[2] === 'px' ? n : n * 16
}

// ---------------------------------------------------------------------------------------------------------------------
// Salida

const resultado = {
  generadoEl: new Date().toISOString(),
  alcance: alcances,
  archivos: archivos.length,
  totales: {
    ...M,
    fontSizeValores: [...M.fontSizeValores].sort(),
    fontSizeValoresDistintos: M.fontSizeValores.size,
    anchosDrawer: [...M.anchosDrawer].sort((a, b) => a - b),
    anchosDialogo: [...M.anchosDialogo].sort(),
    iconos: { ...M.iconos, distintos: M.iconos.distintos.size },
  },
  porModulo: Object.fromEntries(Object.entries(porModulo).sort((a, b) => b[1].lineas - a[1].lineas)),
  archivosMasGrandes: [...archivosInfo].sort((a, b) => b.lineas - a.lineas).slice(0, 10),
  archivosConMasCss: [...archivosInfo].sort((a, b) => b.lineasEstilo - a.lineasEstilo).slice(0, 10),
  detalles,
}

if (args.out) {
  const destino = path.resolve(RAIZ, args.out)

  fs.mkdirSync(path.dirname(destino), { recursive: true })
  fs.writeFileSync(destino, `${JSON.stringify(resultado, null, 2)}\n`)
  console.log(`Métricas guardadas en ${path.relative(RAIZ, destino)}`)
}

imprimirResumen(resultado)

if (args.baseline) {
  const base = JSON.parse(fs.readFileSync(path.resolve(RAIZ, args.baseline), 'utf8'))

  imprimirDiferencias(base.totales, resultado.totales)
}

if (args.umbrales) {
  const umbrales = JSON.parse(fs.readFileSync(path.resolve(RAIZ, args.umbrales), 'utf8'))
  const fallos = []
  for (const [clave, maximo] of Object.entries(umbrales)) {
    const valor = obtener(resultado.totales, clave)
    if (typeof valor === 'number' && valor > maximo)
      fallos.push(`${clave}: ${valor} > ${maximo}`)
  }
  if (fallos.length) {
    console.error(`\nUmbrales superados:\n  ${fallos.join('\n  ')}`)
    process.exit(1)
  }
  console.log('\nTodos los umbrales se cumplen.')
}

function plano(obj, prefijo = '', acc = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const clave = prefijo ? `${prefijo}.${k}` : k
    if (typeof v === 'number')
      acc[clave] = v
    else if (v && typeof v === 'object' && !Array.isArray(v))
      plano(v, clave, acc)
  }

  return acc
}

function obtener(obj, clave) {
  return clave.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

function imprimirResumen(r) {
  const t = r.totales
  const fila = (nombre, valor) => console.log(`  ${nombre.padEnd(46)} ${String(valor).padStart(7)}`)

  console.log(`\nAuditoría DS · ${r.archivos} archivos en ${r.alcance.join(', ')}\n`)
  fila('Hex fijos en <style>/scss (fuera de tokens)', t.hexEnEstilos)
  fila('Hex fijos en script/ts', t.hexEnScript)
  fila('rgb()/rgba() sin var(--v-) en estilos', t.rgbSinVarEnEstilos)
  fila('Colores en style="" / :style', t.coloresEnLinea)
  fila('Props color literales', t.propsColorLiteral)
  fila('style="" en templates', t.estilosEnLinea)
  fila(':style= en templates', t.estilosEnLineaDinamicos)
  fila('!important en <style> de componentes', t.importantEnScoped)
  fila('!important en .scss globales', t.importantEnScss)
  fila('font-size a mano / valores distintos', `${t.fontSizeManual} / ${t.fontSizeValoresDistintos}`)
  fila('Texto menor a 12 px', t.textoMenor12px)
  fila('Anchos fijos en px en <style>', t.anchosFijosPx)
  fila('Anchos de drawer distintos', t.anchosDrawer.join(', ') || '—')
  fila('Anchos de diálogo distintos', t.anchosDialogo.length)
  fila('VBtn / con text-none', `${t.vbtn} / ${t.props['text-none']}`)
  fila('density compact / comfortable', `${t.props['density="compact"']} / ${t.props['density="comfortable"']}`)
  fila('Formato números (toLocaleString/toFixed/Intl/n()/propias/$fc)', Object.values(t.formatoNumeros).slice(0, 6).join('/'))
  fila('Formato fechas (dayjs/toLocaleDate/toLocaleTime/Intl/propias)', Object.values(t.formatoFechas).slice(0, 5).join('/'))
  fila('Importaciones de @/utils/formato', t.formatoNumeros.formatoCompartido)
  fila('t() / cabeceras literales / props literales', `${t.i18n.t} / ${t.i18n.cabecerasLiterales} / ${t.i18n.propsLiterales}`)
  fila('Iconos tabler/mdi/fa/distintos', `${t.iconos.tabler}/${t.iconos.mdi}/${t.iconos.fa}/${t.iconos.distintos}`)
  for (const [accion, cubo] of Object.entries(t.iconos.porAccion))
    fila(`  icono ${accion}`, Object.entries(cubo).map(([k, v]) => `${k.replace('tabler-', '')}×${v}`).join(' ') || '—')
  fila('Tablas VDataTable/Server/Virtual/VTable/html/AsTablaDatos', Object.values(t.tablas).join('/'))
  fila('Botones de icono / sin etiqueta', `${t.botonesIcono} / ${t.botonesIconoSinEtiqueta}`)
  fila('Imágenes / sin alt', `${t.imagenes} / ${t.imagenesSinAlt}`)
  fila('useDisplay / @media / props de rejilla', Object.values(t.responsive).join('/'))
  fila('Componentes As* usados', t.componentesAs)
  console.log('\n  Por módulo (líneas · hex estilo · hex script · style= · !important · font-size · anchos px · compact · text-none/VBtn · icono sin etiqueta · cabeceras literales)')
  for (const [nombre, m] of Object.entries(r.porModulo))
    console.log(`  ${nombre.padEnd(16)} ${String(m.lineas).padStart(6)} · ${m.hexEnEstilos} · ${m.hexEnScript} · ${m.estilosEnLinea} · ${m.importantEnScoped} · ${m.fontSizeManual} · ${m.anchosFijosPx} · ${m.densityCompact} · ${m.textNone}/${m.vbtn} · ${m.botonesIconoSinEtiqueta} · ${m.cabecerasLiterales}`)
}

function imprimirDiferencias(base, actual) {
  const a = plano(base)
  const b = plano(actual)

  console.log('\n  Diferencias frente a la línea base (métrica: antes → ahora)')
  for (const clave of Object.keys(b)) {
    if (!(clave in a) || a[clave] === b[clave])
      continue
    const delta = b[clave] - a[clave]

    console.log(`  ${clave.padEnd(46)} ${String(a[clave]).padStart(6)} → ${String(b[clave]).padStart(6)}  (${delta > 0 ? '+' : ''}${delta})`)
  }
}

function leerArgs(lista) {
  const r = {}
  for (let i = 0; i < lista.length; i++) {
    if (lista[i].startsWith('--')) {
      const clave = lista[i].slice(2)
      const valor = lista[i + 1] && !lista[i + 1].startsWith('--') ? lista[++i] : true

      r[clave] = valor
    }
  }

  return r
}
