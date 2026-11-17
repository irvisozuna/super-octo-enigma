import { createMongoAbility } from '@casl/ability'
import { describe, expect, it } from 'vitest'
import { idsDocumentos, nombreArchivo } from '../utils/documentos'
import { etiquetaHerramienta, fuentesConsultadas } from '../utils/herramientas'
import { agruparPasos, duracion, reloj, resumenPasos } from '../utils/pasos'
import { separarRespuesta, textoParaCopiar } from '../utils/respuesta'
import { agruparConversaciones } from '../utils/historial'
import type { PasoChat } from '../types'
import { esRutaInterna, interpretarGrafica, interpretarLinea, interpretarMarkdown } from '../utils/markdown'
import { crearLectorSse, interpretarBloque } from '../utils/sse'

describe('lector SSE del asistente', () => {
  it('arma los eventos aunque lleguen partidos entre trozos', () => {
    const lector = crearLectorSse()

    expect(lector.leer('data: {"type":"conversation","payload":{"id":"c1"}}\n\ndata: {"type":"text-de')).toEqual([
      { type: 'conversation', payload: { id: 'c1' } },
    ])
    expect(lector.leer('lta","payload":{"text":"Hola"}}\n\ndata: {"type":"tool-call","payload":{"toolName":"consultar_reporte"}}\n\n')).toEqual([
      { type: 'text-delta', payload: { text: 'Hola' } },
      { type: 'tool-call', payload: { toolName: 'consultar_reporte' } },
    ])
    expect(lector.leer('data: [DONE]')).toEqual([])
    expect(lector.cerrar()).toEqual([{ type: 'done' }])
  })

  it('descarta lo que no tiene la forma esperada', () => {
    expect(interpretarBloque('data: no es json')).toBeNull()
    expect(interpretarBloque('data: {"type":"tool-result","payload":{"result":1}}')).toBeNull()
    expect(interpretarBloque('data: {"type":"text-delta","payload":{"text":5}}')).toBeNull()
    expect(interpretarBloque(': comentario')).toBeNull()
    expect(interpretarBloque('data: {"type":"error","payload":{}}')).toEqual({ type: 'error', payload: { error: { message: '' } } })
  })

  it('deja pasar el aviso de respuesta cortada solo con un motivo conocido (XEL1-711)', () => {
    expect(interpretarBloque('data: {"type":"truncated","payload":{"motivo":"longitud"}}')).toEqual({ type: 'truncated', payload: { motivo: 'longitud' } })
    expect(interpretarBloque('data: {"type":"truncated","payload":{"motivo":"pasos"}}')).toEqual({ type: 'truncated', payload: { motivo: 'pasos' } })
    expect(interpretarBloque('data: {"type":"truncated","payload":{"motivo":"<b>"}}')).toBeNull()
  })
})

describe('documentos del asistente (XEL1-712)', () => {
  it('encuentra los documentos enlazados en una respuesta, sin repetir', () => {
    const id = '0f8c2b1e-5d3a-4c7b-9e21-6a4f8d2c1b30'
    const texto = `Listo: [Ver presentación: Facturación](/asistente/documentos/${id}).\nOtra vez: /asistente/documentos/${id.toUpperCase()}`

    expect(idsDocumentos(texto)).toEqual([id])
    expect(idsDocumentos('[Abrir](/asistente/documentos/no-es-uuid)')).toEqual([])
  })

  it('arma el nombre del archivo igual que el servidor', () => {
    expect(nombreArchivo('Facturación en m³ · Primer semestre 2026')).toBe('facturacion-en-m3-primer-semestre-2026.html')
    expect(nombreArchivo('¿?')).toBe('documento-asistente.html')
  })

  it('nombra el avance de las herramientas nuevas', () => {
    expect(etiquetaHerramienta('generar_documento')).toBe('Armando el documento')
    expect(etiquetaHerramienta('calcular')).toBe('Calculando')
  })
})

describe('markdown seguro', () => {
  it('interpreta negritas, cursivas, código y enlaces internos', () => {
    expect(interpretarLinea('Fue **$75,861,808.73** con *IVA* en `ingresos`.')).toEqual([
      { tipo: 'texto', texto: 'Fue ' },
      { tipo: 'negrita', hijos: [{ tipo: 'texto', texto: '$75,861,808.73' }] },
      { tipo: 'texto', texto: ' con ' },
      { tipo: 'cursiva', hijos: [{ tipo: 'texto', texto: 'IVA' }] },
      { tipo: 'texto', texto: ' en ' },
      { tipo: 'codigo', texto: 'ingresos' },
      { tipo: 'texto', texto: '.' },
    ])
    expect(interpretarLinea('[Abrir Ingresos](/reportes/tableros/ingresos)')).toEqual([
      { tipo: 'enlace', destino: '/reportes/tableros/ingresos', hijos: [{ tipo: 'texto', texto: 'Abrir Ingresos' }] },
    ])
  })

  it('no enlaza destinos externos ni esquemas peligrosos', () => {
    for (const destino of ['https://otro.com', '//otro.com/x', 'javascript:alert(1)', '/ruta"onclick'])
      expect(esRutaInterna(destino)).toBe(false)
    expect(interpretarLinea('[clic](javascript:alert(1))').some(l => l.tipo === 'enlace')).toBe(false)
    expect(interpretarLinea('<img src=x onerror=alert(1)>')).toEqual([{ tipo: 'texto', texto: '<img src=x onerror=alert(1)>' }])
  })

  it('arma títulos, listas, tablas y párrafos', () => {
    const bloques = interpretarMarkdown([
      '### Ingreso por gerencia',
      '',
      '| Gerencia | Sep |',
      '|---|---:|',
      '| San José del Cabo | $47,813,437.18 |',
      '| Cabo San Lucas | $25,871,834.76 |',
      '',
      '- Base sin IVA: $68,455,142.71',
      '- IVA: $7,406,674.79',
      '',
      '1. Primero',
      '2. Segundo',
      '',
      'Fuente: tablero Ingresos.',
      'Datos al 22/10/2026.',
    ].join('\n'))

    expect(bloques.map(b => b.tipo)).toEqual(['titulo', 'tabla', 'lista', 'lista', 'parrafo'])

    const tabla = bloques[1] as Extract<typeof bloques[number], { tipo: 'tabla' }>

    expect(tabla.alineaciones).toEqual(['start', 'end'])
    expect(tabla.filas).toHaveLength(2)
    expect(bloques[3]).toMatchObject({ ordenada: true, inicio: 1 })
    expect(bloques[4]).toEqual({ tipo: 'parrafo', contenido: [{ tipo: 'texto', texto: 'Fuente: tablero Ingresos. Datos al 22/10/2026.' }] })
  })

  it('tolera texto a medio llegar', () => {
    expect(interpretarMarkdown('El ingreso fue **$75,86').at(0)).toEqual({ tipo: 'parrafo', contenido: [{ tipo: 'texto', texto: 'El ingreso fue **$75,86' }] })
    expect(interpretarMarkdown('| Gerencia | Sep |').at(0)?.tipo).toBe('parrafo')
  })
})

describe('avance de consultas', () => {
  it('resume las fuentes sin repetir ni pasos internos', () => {
    expect(fuentesConsultadas(['catalogo', 'consultar_reporte', 'consultar_reporte', 'explicar_regla'])).toEqual(['reportes', 'definiciones'])
  })
})

describe('interruptor del asistente', () => {
  it('admin no lo ve cuando el servidor manda la regla invertida', () => {
    expect(createMongoAbility([{ action: 'manage', subject: 'all' }]).can('use', 'asistente')).toBe(true)
    expect(createMongoAbility([
      { action: 'manage', subject: 'all' },
      { action: 'use', subject: 'asistente', inverted: true },
    ]).can('use', 'asistente')).toBe(false)
    expect(createMongoAbility([{ action: 'read', subject: 'Profile' }]).can('use', 'asistente')).toBe(false)
  })
})

describe('avance por pasos (XEL1-714)', () => {
  const informe = 'Informe mensual por entidad'

  const pasos: PasoChat[] = [
    { id: 0, herramienta: 'catalogo', estado: 'listo' },
    { id: 1, herramienta: 'describir_reporte', detalle: informe, estado: 'listo' },
    { id: 2, herramienta: 'consultar_reporte', detalle: informe, estado: 'error' },
    { id: 3, herramienta: 'consultar_reporte', detalle: informe, estado: 'listo' },
    { id: 4, herramienta: 'calcular', estado: 'listo' },
    { id: 5, herramienta: 'calcular', estado: 'listo' },
    { id: 6, herramienta: 'generar_documento', estado: 'en_curso', tipo: 'presentacion', secciones: 4 },
  ]

  it('agrupa los pasos repetidos y dice en qué va', () => {
    const grupos = agruparPasos(pasos)

    expect(grupos.map(g => g.texto)).toEqual(['Buscó el reporte indicado', 'Revisó columnas y filtros', 'Consultó el reporte', 'Hizo 2 cálculos', 'Redactando la presentación'])
    expect(grupos[2]).toMatchObject({ detalle: informe, veces: 2, fallidos: 1, nota: '2 consultas · 1 no se completó y se reintentó' })
    expect(grupos[4]).toMatchObject({ enCurso: true, nota: 'Va en la sección 4' })
  })

  it('resume en una línea lo que hizo, sin los pasos de preparación', () => {
    const listos = pasos.map(p => ({ ...p, estado: p.estado === 'en_curso' ? 'listo' as const : p.estado }))

    expect(resumenPasos(listos, 72_000)).toBe(`Consultó ${informe} (2 veces) · 2 cálculos · Armó la presentación · 1 min 12 s`)
    expect(resumenPasos([], 3_000)).toBe('3 s')
  })

  it('muestra el tiempo como reloj y como duración', () => {
    expect(reloj(47_400)).toBe('0:47')
    expect(reloj(125_000)).toBe('2:05')
    expect(duracion(45_000)).toBe('45 s')
    expect(duracion(120_000)).toBe('2 min')
  })

  it('lee los eventos de avance y descarta los que no tienen la forma esperada', () => {
    expect(interpretarBloque('data: {"type":"tool-start","payload":{"id":0,"toolName":"consultar_reporte"}}')).toEqual({ type: 'tool-start', payload: { id: 0, toolName: 'consultar_reporte' } })
    expect(interpretarBloque('data: {"type":"tool-call","payload":{"id":0,"toolName":"consultar_reporte","detalle":"Ingresos","args":{"x":1}}}')).toEqual({ type: 'tool-call', payload: { id: 0, toolName: 'consultar_reporte', detalle: 'Ingresos' } })
    expect(interpretarBloque('data: {"type":"tool-result","payload":{"id":0,"toolName":"consultar_reporte","ok":false,"result":[1]}}')).toEqual({ type: 'tool-result', payload: { id: 0, toolName: 'consultar_reporte', ok: false } })
    expect(interpretarBloque('data: {"type":"tool-progress","payload":{"id":2,"toolName":"generar_documento","secciones":3,"tipo":"informe"}}')).toEqual({ type: 'tool-progress', payload: { id: 2, toolName: 'generar_documento', secciones: 3, tipo: 'informe' } })
    expect(interpretarBloque('data: {"type":"thinking","payload":{}}')).toEqual({ type: 'thinking', payload: {} })
    expect(interpretarBloque('data: {"type":"conversation","payload":{"id":"c1","nivel":"analisis"}}')).toEqual({ type: 'conversation', payload: { id: 'c1', nivel: 'analisis' } })
    expect(interpretarBloque('data: {"type":"tool-start","payload":{"id":"x","toolName":"a"}}')).toBeNull()
    expect(interpretarBloque('data: {"type":"tool-result","payload":{"id":1,"toolName":"a"}}')).toBeNull()
  })
})

describe('gráficas en el chat (XEL1-718)', () => {
  const json = '{"tipo":"linea","titulo":"Eficiencia","unidad":"%","etiquetas":["Ene","Feb","Mar"],"series":[{"nombre":"Eficiencia","valores":[76.6,75.4,74.6]}]}'

  it('dibuja solo un bloque grafica completo y válido', () => {
    expect(interpretarMarkdown(`Así va:\n\n\`\`\`grafica\n${json}\n\`\`\``).at(-1)).toEqual({
      tipo: 'grafica',
      grafica: { tipo: 'linea', titulo: 'Eficiencia', unidad: '%', etiquetas: ['Ene', 'Feb', 'Mar'], series: [{ nombre: 'Eficiencia', valores: [76.6, 75.4, 74.6] }] },
    })
    expect(interpretarMarkdown('```grafica\n{"tipo":"bar')).toEqual([{ tipo: 'graficaPendiente' }])
    expect(interpretarMarkdown('```grafica\n{no es json}\n```')).toEqual([{ tipo: 'graficaInvalida' }])
  })

  it('rechaza datos que no cuadran o que no son números', () => {
    expect(interpretarGrafica('{"etiquetas":["a","b"],"series":[{"nombre":"x","valores":[1]}]}')).toBeNull()
    expect(interpretarGrafica('{"etiquetas":["a","b"],"series":[{"nombre":"x","valores":["1,000",2]}]}')).toBeNull()
    expect(interpretarGrafica('{"etiquetas":["a","b"],"valores":[1,2],"tipo":"<script>"}')).toMatchObject({ tipo: 'barras', series: [{ valores: [1, 2] }] })
  })

  it('lee el sello de cifras (XEL1-719)', () => {
    expect(interpretarBloque('data: {"type":"verificacion","payload":{"total":3,"verificadas":2,"sin_verificar":["$80,123,456.00",5]}}'))
      .toEqual({ type: 'verificacion', payload: { total: 3, verificadas: 2, sin_verificar: ['$80,123,456.00'] } })
    expect(interpretarBloque('data: {"type":"verificacion","payload":{"total":"3"}}')).toBeNull()
  })
})

describe('tarjeta de respuesta (XEL1-721)', () => {
  const respuesta = [
    '```cifra',
    '{"etiqueta":"Cobrado ayer · 16/11/2026","valor":"$1,234,567.89","detalle":"4.2 % más que el lunes anterior"}',
    '```',
    '',
    'Fue un **buen día** de cobro.',
    '',
    '```fuente',
    '{"nombre":"Ingresos recibidos en caja","filtros":"16/11/2026","datos_al":"17/11/2026 12:33","ruta":"/reportes/ingresos_caja"}',
    '```',
    '',
    '```sugerencias',
    '["Comparar con el mes pasado","Desglosar por gerencia"]',
    '```',
  ].join('\n')

  it('separa la cifra principal, el cuerpo, la fuente y las sugerencias', () => {
    const partes = separarRespuesta(respuesta)

    expect(partes.cifras).toEqual([{ etiqueta: 'Cobrado ayer · 16/11/2026', valor: '$1,234,567.89', detalle: '4.2 % más que el lunes anterior' }])
    expect(partes.cuerpo.map(b => b.tipo)).toEqual(['parrafo'])
    expect(partes.fuentes).toEqual([{ nombre: 'Ingresos recibidos en caja', filtros: '16/11/2026', datos_al: '17/11/2026 12:33', ruta: '/reportes/ingresos_caja' }])
    expect(partes.sugerencias).toEqual(['Comparar con el mes pasado', 'Desglosar por gerencia'])
  })

  it('descarta rutas externas y bloques mal formados o a medio llegar', () => {
    expect(separarRespuesta('```fuente\n{"nombre":"X","ruta":"https://malo.com"}\n```').fuentes).toEqual([{ nombre: 'X' }])
    expect(separarRespuesta('```cifra\n{"valor":"$1"}\n```').cifras).toEqual([])
    expect(separarRespuesta('```cifra\n{"etiqueta":"a","val').cifras).toEqual([])
    expect(separarRespuesta('```sugerencias\n"no es lista"\n```').sugerencias).toEqual([])
  })

  it('copia la respuesta en texto plano', () => {
    expect(textoParaCopiar(respuesta)).toBe('Cobrado ayer · 16/11/2026: $1,234,567.89 (4.2 % más que el lunes anterior)\n\nFue un buen día de cobro.\n\nFuente: Ingresos recibidos en caja · 16/11/2026 · datos al 17/11/2026 12:33')
  })

  it('agrupa el historial por fecha', () => {
    const ahora = new Date(2026, 10, 17, 13, 0)
    const c = (id: string, fecha: Date) => ({ id, titulo: id, mensajes: 2, actualizada: fecha.toISOString() })

    const grupos = agruparConversaciones([
      c('hoy', new Date(2026, 10, 17, 10, 24)),
      c('ayer', new Date(2026, 10, 16, 18, 0)),
      c('semana', new Date(2026, 10, 13, 9, 0)),
      c('vieja', new Date(2026, 9, 2, 9, 0)),
    ], ahora)

    expect(grupos.map(g => [g.titulo, g.conversaciones[0].id, g.conversaciones[0].cuando])).toEqual([
      ['Hoy', 'hoy', '10:24'], ['Ayer', 'ayer', '16 nov'], ['Esta semana', 'semana', '13 nov'], ['Anteriores', 'vieja', '2 oct'],
    ])
  })
})
