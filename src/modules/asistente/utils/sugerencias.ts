/* Preguntas sugeridas al abrir una conversación vacía. */
export const SUGERENCIAS = [
  '¿Cuánto se cobró ayer?',
  '¿Cómo va la lectura hoy?',
  '¿Qué es la eficiencia comercial?',
  '¿Qué sectores van rezagados en la lectura?',
  'Compara el ingreso de agosto contra septiembre por gerencia',
]

/** Preguntas sugeridas cuando se pregunta desde un reporte (XEL1-717). */
export const SUGERENCIAS_REPORTE = [
  'Explícame este reporte',
  '¿Qué destaca en estos datos?',
  'Compáralo con el periodo anterior',
  'Muéstralo en una gráfica',
]

/** Temas del inicio en pantalla completa (XEL1-721), cada uno con dos preguntas que el asistente sabe contestar. */
export const TEMAS = [
  {
    titulo: 'Cifras y reportes',
    descripcion: 'Ingresos, cobros y comparativos',
    icono: 'tabler-chart-bar',
    preguntas: ['¿Cuánto se cobró ayer?', 'Compara el ingreso de agosto contra septiembre'],
  },
  {
    titulo: 'Lecturas',
    descripcion: 'Avance de lecturas y sectores',
    icono: 'tabler-book',
    preguntas: ['¿Cómo va la lectura hoy?', '¿Qué sectores van rezagados?'],
  },
  {
    titulo: 'Facturación',
    descripcion: 'Informes, presentaciones y montos',
    icono: 'tabler-file-invoice',
    preguntas: ['Genera un informe de la facturación del mes pasado', 'Prepara una presentación de la facturación del primer semestre'],
  },
  {
    titulo: 'Indicadores',
    descripcion: 'Cálculos, tendencias y alertas',
    icono: 'tabler-bolt',
    preguntas: ['¿Qué es la eficiencia comercial?', '¿Cómo va la eficiencia comercial este año?'],
  },
]
