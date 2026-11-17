/*
 * Markdown del asistente convertido a bloques que se pintan con componentes de Vue, nunca con v-html: el texto del
 * modelo no puede inyectar HTML ni scripts. Cubre lo que escribe el asistente: títulos, párrafos, listas, tablas,
 * negritas, cursivas, código y enlaces. Solo se enlazan rutas internas de Atención (`/reportes/...`); cualquier otro
 * destino queda como texto. Tolera texto a medio llegar (el stream va pintando).
 */

export type Linea =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'negrita'; hijos: Linea[] }
  | { tipo: 'cursiva'; hijos: Linea[] }
  | { tipo: 'codigo'; texto: string }
  | { tipo: 'enlace'; destino: string; hijos: Linea[] }

export type Alineacion = 'start' | 'center' | 'end'

export type Bloque =
  | { tipo: 'titulo'; nivel: number; contenido: Linea[] }
  | { tipo: 'parrafo'; contenido: Linea[] }
  | { tipo: 'lista'; ordenada: boolean; inicio: number; elementos: Linea[][] }
  | { tipo: 'tabla'; encabezados: Linea[][]; alineaciones: Alineacion[]; filas: Linea[][][] }
  | { tipo: 'separador' }
  | { tipo: 'bloqueCodigo'; texto: string }
  | { tipo: 'grafica'; grafica: GraficaChat }
  | { tipo: 'graficaPendiente' }
  | { tipo: 'graficaInvalida' }
  | { tipo: 'cifras'; cifras: CifraChat[] }
  | { tipo: 'fuente'; fuente: FuenteChat }
  | { tipo: 'sugerencias'; sugerencias: string[] }

/** Cifra principal de una respuesta, en un bloque ```cifra (XEL1-721): va grande arriba de la tarjeta. */
export interface CifraChat {
  etiqueta: string
  valor: string
  detalle?: string
}

/** Fuente de una respuesta, en un bloque ```fuente: va en el pie de la tarjeta con "Abrir reporte". */
export interface FuenteChat {
  nombre: string
  filtros?: string
  datos_al?: string
  ruta?: string
}

const textoCorto = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined)

function json(crudo: string): unknown {
  try {
    return JSON.parse(crudo)
  }
  catch {
    return null
  }
}

/** Una o hasta tres cifras principales; null si no tienen etiqueta y valor. */
export function interpretarCifras(crudo: string): CifraChat[] | null {
  const datos = json(crudo)
  const lista = (Array.isArray(datos) ? datos : [datos]).slice(0, 3)

  const cifras = lista.map(c => {
    const d = (c ?? {}) as Record<string, unknown>
    const etiqueta = textoCorto(d.etiqueta, 80)
    const valor = textoCorto(d.valor, 40)

    return etiqueta && valor ? { etiqueta, valor, ...(textoCorto(d.detalle, 160) ? { detalle: textoCorto(d.detalle, 160) } : {}) } : null
  })

  return cifras.length && cifras.every(Boolean) ? cifras as CifraChat[] : null
}

/** Fuente con su ruta solo si es interna de Atención. */
export function interpretarFuente(crudo: string): FuenteChat | null {
  const d = json(crudo) as Record<string, unknown> | null
  const nombre = d && typeof d === 'object' && !Array.isArray(d) ? textoCorto(d.nombre, 150) : undefined
  if (!d || !nombre)
    return null
  const ruta = textoCorto(d.ruta, 900)

  return {
    nombre,
    ...(textoCorto(d.filtros, 300) ? { filtros: textoCorto(d.filtros, 300) } : {}),
    ...(textoCorto(d.datos_al, 60) ? { datos_al: textoCorto(d.datos_al, 60) } : {}),
    ...(ruta && esRutaInterna(ruta) ? { ruta } : {}),
  }
}

/** Preguntas de seguimiento: hasta tres textos cortos. */
export function interpretarSugerencias(crudo: string): string[] | null {
  const datos = json(crudo)
  if (!Array.isArray(datos))
    return null
  const lista = datos.map(s => textoCorto(s, 90)).filter((s): s is string => Boolean(s)).slice(0, 3)

  return lista.length ? lista : null
}

/** Gráfica que el asistente escribe en un bloque ```grafica con JSON (XEL1-718). Solo datos: nada se ejecuta. */
export interface GraficaChat {
  tipo: 'barras' | 'linea'
  titulo?: string
  unidad?: string
  etiquetas: string[]
  series: { nombre: string; valores: number[] }[]
}

const MAX_PUNTOS = 36
const MAX_SERIES = 4

/** Valida y limpia el JSON de una gráfica; null si no se puede dibujar. */
export function interpretarGrafica(texto: string): GraficaChat | null {
  let datos: unknown
  try {
    datos = JSON.parse(texto)
  }
  catch {
    return null
  }
  if (!datos || typeof datos !== 'object' || Array.isArray(datos))
    return null
  const d = datos as Record<string, unknown>
  const etiquetas = Array.isArray(d.etiquetas) ? d.etiquetas.map(e => String(e).slice(0, 40)).slice(0, MAX_PUNTOS) : []
  const numeros = (v: unknown) => (Array.isArray(v) && v.every(n => typeof n === 'number' && Number.isFinite(n)) ? (v as number[]) : null)

  const crudas = Array.isArray(d.series)
    ? d.series
    : (numeros(d.valores) ? [{ nombre: typeof d.titulo === 'string' ? d.titulo : '', valores: d.valores }] : [])

  const series = crudas.slice(0, MAX_SERIES).map(s => {
    const serie = (s ?? {}) as Record<string, unknown>
    const valores = numeros(serie.valores)

    return valores && valores.length === etiquetas.length ? { nombre: String(serie.nombre ?? '').slice(0, 60), valores } : null
  })

  if (etiquetas.length < 2 || series.length === 0 || series.includes(null))
    return null

  return {
    tipo: d.tipo === 'linea' ? 'linea' : 'barras',
    titulo: typeof d.titulo === 'string' ? d.titulo.slice(0, 120) : undefined,
    unidad: typeof d.unidad === 'string' ? d.unidad.slice(0, 12) : undefined,
    etiquetas,
    series: series as GraficaChat['series'],
  }
}

/** Ruta interna de la aplicación: empieza con una sola diagonal y no trae esquema ni caracteres de control. */
export function esRutaInterna(destino: string): boolean {
  return /^\/(?!\/)[\w\-./?=&%#]*$/.test(destino)
}

const PATRONES: { tipo: 'codigo' | 'negrita' | 'enlace' | 'cursiva'; re: RegExp }[] = [
  { tipo: 'codigo', re: /`([^`\n]+)`/ },
  { tipo: 'negrita', re: /\*\*(?=\S)([\s\S]+?)\*\*/ },
  { tipo: 'enlace', re: /\[([^\]\n]+)\]\(([^)\s]+)\)/ },
  { tipo: 'cursiva', re: /(?<![\w*])\*(?=\S)([^*\n]+)\*(?![\w*])/ },
]

export function interpretarLinea(texto: string): Linea[] {
  const salida: Linea[] = []
  let resto = texto

  while (resto) {
    let mejor: { tipo: typeof PATRONES[number]['tipo']; m: RegExpExecArray } | null = null
    for (const { tipo, re } of PATRONES) {
      const m = re.exec(resto)
      if (m && (!mejor || m.index < mejor.m.index))
        mejor = { tipo, m }
    }
    if (!mejor) {
      salida.push({ tipo: 'texto', texto: resto })
      break
    }
    const { tipo, m } = mejor
    if (m.index > 0)
      salida.push({ tipo: 'texto', texto: resto.slice(0, m.index) })

    if (tipo === 'codigo')
      salida.push({ tipo: 'codigo', texto: m[1] })
    else if (tipo === 'negrita')
      salida.push({ tipo: 'negrita', hijos: interpretarLinea(m[1]) })
    else if (tipo === 'cursiva')
      salida.push({ tipo: 'cursiva', hijos: interpretarLinea(m[1]) })
    else if (esRutaInterna(m[2]))
      salida.push({ tipo: 'enlace', destino: m[2], hijos: interpretarLinea(m[1]) })
    else
      salida.push(...interpretarLinea(m[1]))

    resto = resto.slice(m.index + m[0].length)
  }

  return salida
}

// Sin cuantificadores encadenados sobre espacios (evita retroceso exponencial con texto armado a propósito)
const RE_TITULO = /^(#{1,6})[ \t](.*)$/
const RE_VINETA = /^[ \t]*[-*+][ \t](.*)$/
const RE_NUMERO = /^[ \t]*(\d+)[.)][ \t](.*)$/
const RE_SEPARADOR = /^(?:-{3,}|\*{3,}|_{3,})$/
const RE_DIVISION_TABLA = /^\|?:?-{2,}:?(?:\|:?-{2,}:?)*\|?$/

const esSeparador = (linea: string) => RE_SEPARADOR.test(linea.trim())
const esFila = (linea: string) => linea.trim().startsWith('|')
const esDivisionTabla = (linea: string) => RE_DIVISION_TABLA.test(linea.replace(/\s/g, ''))

function celdas(linea: string): string[] {
  return linea.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
}

function alineacion(celda: string): Alineacion {
  const izquierda = celda.startsWith(':')
  const derecha = celda.endsWith(':')

  return izquierda && derecha ? 'center' : derecha ? 'end' : 'start'
}

export function interpretarMarkdown(texto: string): Bloque[] {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n')
  const bloques: Bloque[] = []
  let parrafo: string[] = []

  const cerrarParrafo = () => {
    if (parrafo.length)
      bloques.push({ tipo: 'parrafo', contenido: interpretarLinea(parrafo.join(' ')) })
    parrafo = []
  }

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i]

    if (!linea.trim()) {
      cerrarParrafo()
      continue
    }

    if (linea.trim().startsWith('```')) {
      cerrarParrafo()

      const lenguaje = linea.trim().slice(3).trim().toLowerCase()
      const codigo: string[] = []

      i++
      while (i < lineas.length && !lineas[i].trim().startsWith('```'))
        codigo.push(lineas[i++])
      const cerrado = i < lineas.length
      if (lenguaje === 'cifra' || lenguaje === 'fuente' || lenguaje === 'sugerencias') {
        // Mientras llegan o si vienen mal formados no se pintan: la respuesta sigue legible sin ellos
        const crudo = codigo.join('\n')
        if (cerrado && lenguaje === 'cifra') {
          const cifras = interpretarCifras(crudo)
          if (cifras)
            bloques.push({ tipo: 'cifras', cifras })
        }
        else if (cerrado && lenguaje === 'fuente') {
          const fuente = interpretarFuente(crudo)
          if (fuente)
            bloques.push({ tipo: 'fuente', fuente })
        }
        else if (cerrado) {
          const sugerencias = interpretarSugerencias(crudo)
          if (sugerencias)
            bloques.push({ tipo: 'sugerencias', sugerencias })
        }
      }
      else if (lenguaje === 'grafica') {
        // Mientras llega por el stream el bloque está abierto: se avisa en lugar de pintar algo a medias
        const grafica = cerrado ? interpretarGrafica(codigo.join('\n')) : null

        bloques.push(!cerrado ? { tipo: 'graficaPendiente' } : grafica ? { tipo: 'grafica', grafica } : { tipo: 'graficaInvalida' })
      }
      else {
        bloques.push({ tipo: 'bloqueCodigo', texto: codigo.join('\n') })
      }
      continue
    }

    const titulo = RE_TITULO.exec(linea)
    if (titulo) {
      cerrarParrafo()
      bloques.push({ tipo: 'titulo', nivel: titulo[1].length, contenido: interpretarLinea(titulo[2].trim()) })
      continue
    }

    if (esSeparador(linea)) {
      cerrarParrafo()
      bloques.push({ tipo: 'separador' })
      continue
    }

    // Tabla: encabezado seguido de la fila de guiones
    if (esFila(linea) && i + 1 < lineas.length && esDivisionTabla(lineas[i + 1])) {
      cerrarParrafo()

      const encabezados = celdas(linea)
      const alineaciones = celdas(lineas[i + 1]).map(alineacion)
      const filas: Linea[][][] = []

      i += 2
      while (i < lineas.length && esFila(lineas[i]))
        filas.push(celdas(lineas[i++]).slice(0, encabezados.length).map(interpretarLinea))
      i--
      bloques.push({ tipo: 'tabla', encabezados: encabezados.map(interpretarLinea), alineaciones, filas })
      continue
    }

    const vineta = RE_VINETA.exec(linea)
    const numero = RE_NUMERO.exec(linea)
    if (vineta || numero) {
      cerrarParrafo()

      const ordenada = Boolean(numero)
      const inicio = numero ? Number(numero[1]) : 1
      const elementos: Linea[][] = []
      while (i < lineas.length) {
        const m = ordenada ? RE_NUMERO.exec(lineas[i]) : RE_VINETA.exec(lineas[i])
        if (m) {
          elementos.push(interpretarLinea((ordenada ? m[2] : m[1]).trim()))
          i++
        }
        else if (lineas[i].trim() && /^\s{2,}/.test(lineas[i]) && elementos.length) {
          // Continuación o sublista: se pega al elemento anterior
          elementos[elementos.length - 1].push({ tipo: 'texto', texto: ' ' }, ...interpretarLinea(lineas[i].trim().replace(/^[-*+]\s+/, '')))
          i++
        }
        else {
          break
        }
      }
      i--
      bloques.push({ tipo: 'lista', ordenada, inicio, elementos })
      continue
    }

    parrafo.push(linea.trim())
  }
  cerrarParrafo()

  return bloques
}
