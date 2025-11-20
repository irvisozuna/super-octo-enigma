/**
 * Enum de tipos de widgets disponibles
 * Define todos los tipos de visualización soportados
 */
export enum WidgetTypeEnum {
  // Widgets de métricas
  STAT = 'stat',

  // Widgets de gráficos
  CHART_LINE = 'chart_line',
  CHART_BAR = 'chart_bar',
  CHART_PIE = 'chart_pie',
  CHART_AREA = 'chart_area',
  CHART_DONUT = 'chart_donut',
  CHART_RADIAL = 'chart_radial',
  CHART_SCATTER = 'chart_scatter',

  // Widgets de datos
  TABLE = 'table',
  LIST = 'list',

  // Widgets de visualización
  GAUGE = 'gauge',
  PROGRESS = 'progress',
  TIMELINE = 'timeline',
  CALENDAR = 'calendar',
  MAP = 'map',

  // Widgets personalizados
  CUSTOM_HTML = 'custom_html',
}

/**
 * Metadata de cada tipo de widget
 */
export const WidgetTypeMetadata = {
  [WidgetTypeEnum.STAT]: {
    name: 'Estadística',
    description: 'Muestra una métrica clave con icono y tendencia',
    icon: 'tabler-chart-line',
    category: 'metrics',
    minSize: { w: 2, h: 2 },
    defaultSize: { w: 3, h: 2 },
  },
  [WidgetTypeEnum.CHART_LINE]: {
    name: 'Gráfico de Líneas',
    description: 'Visualiza tendencias a lo largo del tiempo',
    icon: 'tabler-chart-line',
    category: 'charts',
    minSize: { w: 4, h: 3 },
    defaultSize: { w: 6, h: 4 },
  },
  [WidgetTypeEnum.CHART_BAR]: {
    name: 'Gráfico de Barras',
    description: 'Compara valores entre categorías',
    icon: 'tabler-chart-bar',
    category: 'charts',
    minSize: { w: 4, h: 3 },
    defaultSize: { w: 6, h: 4 },
  },
  [WidgetTypeEnum.CHART_PIE]: {
    name: 'Gráfico de Torta',
    description: 'Muestra proporciones de un total',
    icon: 'tabler-chart-pie',
    category: 'charts',
    minSize: { w: 3, h: 3 },
    defaultSize: { w: 4, h: 4 },
  },
  [WidgetTypeEnum.CHART_AREA]: {
    name: 'Gráfico de Área',
    description: 'Visualiza volumen a lo largo del tiempo',
    icon: 'tabler-chart-area',
    category: 'charts',
    minSize: { w: 4, h: 3 },
    defaultSize: { w: 6, h: 4 },
  },
  [WidgetTypeEnum.CHART_DONUT]: {
    name: 'Gráfico de Dona',
    description: 'Similar a torta con espacio central',
    icon: 'tabler-chart-donut',
    category: 'charts',
    minSize: { w: 3, h: 3 },
    defaultSize: { w: 4, h: 4 },
  },
  [WidgetTypeEnum.CHART_RADIAL]: {
    name: 'Gráfico Radial',
    description: 'Muestra progreso en forma circular',
    icon: 'tabler-chart-radar',
    category: 'charts',
    minSize: { w: 3, h: 3 },
    defaultSize: { w: 4, h: 4 },
  },
  [WidgetTypeEnum.CHART_SCATTER]: {
    name: 'Gráfico de Dispersión',
    description: 'Muestra relación entre dos variables',
    icon: 'tabler-chart-dots',
    category: 'charts',
    minSize: { w: 4, h: 3 },
    defaultSize: { w: 6, h: 4 },
  },
  [WidgetTypeEnum.TABLE]: {
    name: 'Tabla de Datos',
    description: 'Presenta datos en formato tabular',
    icon: 'tabler-table',
    category: 'data',
    minSize: { w: 4, h: 3 },
    defaultSize: { w: 12, h: 5 },
  },
  [WidgetTypeEnum.LIST]: {
    name: 'Lista',
    description: 'Muestra items en lista vertical',
    icon: 'tabler-list',
    category: 'data',
    minSize: { w: 2, h: 3 },
    defaultSize: { w: 4, h: 5 },
  },
  [WidgetTypeEnum.GAUGE]: {
    name: 'Medidor',
    description: 'Indicador tipo velocímetro',
    icon: 'tabler-gauge',
    category: 'visualization',
    minSize: { w: 3, h: 3 },
    defaultSize: { w: 4, h: 4 },
  },
  [WidgetTypeEnum.PROGRESS]: {
    name: 'Barra de Progreso',
    description: 'Muestra porcentaje completado',
    icon: 'tabler-progress',
    category: 'visualization',
    minSize: { w: 2, h: 1 },
    defaultSize: { w: 4, h: 2 },
  },
  [WidgetTypeEnum.TIMELINE]: {
    name: 'Línea de Tiempo',
    description: 'Eventos cronológicos',
    icon: 'tabler-timeline',
    category: 'visualization',
    minSize: { w: 4, h: 4 },
    defaultSize: { w: 6, h: 6 },
  },
  [WidgetTypeEnum.CALENDAR]: {
    name: 'Calendario',
    description: 'Vista de calendario con eventos',
    icon: 'tabler-calendar',
    category: 'visualization',
    minSize: { w: 4, h: 4 },
    defaultSize: { w: 6, h: 6 },
  },
  [WidgetTypeEnum.MAP]: {
    name: 'Mapa',
    description: 'Visualización geográfica con marcadores',
    icon: 'tabler-map',
    category: 'visualization',
    minSize: { w: 4, h: 4 },
    defaultSize: { w: 8, h: 6 },
  },
  [WidgetTypeEnum.CUSTOM_HTML]: {
    name: 'HTML Personalizado',
    description: 'Contenido HTML/Markdown libre',
    icon: 'tabler-code',
    category: 'custom',
    minSize: { w: 2, h: 2 },
    defaultSize: { w: 4, h: 4 },
  },
}

/**
 * Categorías de widgets
 */
export enum WidgetCategory {
  METRICS = 'metrics',
  CHARTS = 'charts',
  DATA = 'data',
  VISUALIZATION = 'visualization',
  CUSTOM = 'custom',
}
