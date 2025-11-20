import type { DataTransformation, WidgetData } from '../../domain/types/WidgetTypes'

/**
 * Servicio para aplicar transformaciones a los datos de widgets
 */
export class WidgetTransformService {
  /**
   * Aplica todas las transformaciones a los datos
   */
  applyTransformations(
    data: WidgetData,
    transformations: DataTransformation[],
  ): WidgetData {
    let transformedData = { ...data }

    for (const transformation of transformations) {
      transformedData = this.applyTransformation(transformedData, transformation)
    }

    return transformedData
  }

  /**
   * Aplica una transformación individual
   */
  private applyTransformation(
    data: WidgetData,
    transformation: DataTransformation,
  ): WidgetData {
    switch (transformation.type) {
      case 'map':
        return this.applyMapTransformation(data, transformation.config)

      case 'filter':
        return this.applyFilterTransformation(data, transformation.config)

      case 'reduce':
        return this.applyReduceTransformation(data, transformation.config)

      case 'sort':
        return this.applySortTransformation(data, transformation.config)

      case 'group':
        return this.applyGroupTransformation(data, transformation.config)

      case 'aggregate':
        return this.applyAggregateTransformation(data, transformation.config)

      default:
        console.warn(`Unknown transformation type: ${transformation.type}`)
        return data
    }
  }

  /**
   * Transformación MAP: transforma cada registro
   */
  private applyMapTransformation(data: WidgetData, config: any): WidgetData {
    const { field, transform } = config

    if (!field || !transform)
      return data

    const transformedRows = data.rows.map((row) => {
      try {
        // Evaluar transformación (simple)
        // Por seguridad, solo permitir operaciones matemáticas básicas
        const value = row[field]
        const transformedValue = this.evaluateTransform(value, transform)

        return {
          ...row,
          [field]: transformedValue,
        }
      }
      catch (error) {
        console.error('Error in map transformation:', error)
        return row
      }
    })

    return {
      ...data,
      rows: transformedRows,
    }
  }

  /**
   * Transformación FILTER: filtra registros
   */
  private applyFilterTransformation(data: WidgetData, config: any): WidgetData {
    const { condition } = config

    if (!condition)
      return data

    const filteredRows = data.rows.filter((row) => {
      try {
        return this.evaluateCondition(row, condition)
      }
      catch (error) {
        console.error('Error in filter transformation:', error)
        return true
      }
    })

    return {
      ...data,
      rows: filteredRows,
      total: filteredRows.length,
    }
  }

  /**
   * Transformación REDUCE: reduce a un solo valor
   */
  private applyReduceTransformation(data: WidgetData, config: any): WidgetData {
    const { field, operation } = config

    if (!field || !operation)
      return data

    let result: any

    switch (operation) {
      case 'sum':
        result = data.rows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0)
        break

      case 'avg':
        result = data.rows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0) / data.rows.length
        break

      case 'min':
        result = Math.min(...data.rows.map(row => Number(row[field]) || 0))
        break

      case 'max':
        result = Math.max(...data.rows.map(row => Number(row[field]) || 0))
        break

      case 'count':
        result = data.rows.length
        break

      default:
        result = null
    }

    return {
      ...data,
      rows: [{ [field]: result }],
      total: 1,
    }
  }

  /**
   * Transformación SORT: ordena registros
   */
  private applySortTransformation(data: WidgetData, config: any): WidgetData {
    const { field, direction = 'ASC' } = config

    if (!field)
      return data

    const sortedRows = [...data.rows].sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]

      if (aVal === bVal)
        return 0

      const comparison = aVal < bVal ? -1 : 1
      return direction === 'ASC' ? comparison : -comparison
    })

    return {
      ...data,
      rows: sortedRows,
    }
  }

  /**
   * Transformación GROUP: agrupa registros
   */
  private applyGroupTransformation(data: WidgetData, config: any): WidgetData {
    const { field, aggregations = [] } = config

    if (!field)
      return data

    const groups: Record<string, any[]> = {}

    // Agrupar registros
    data.rows.forEach((row) => {
      const key = row[field]
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(row)
    })

    // Aplicar agregaciones
    const groupedRows = Object.entries(groups).map(([key, rows]) => {
      const groupRow: any = { [field]: key }

      aggregations.forEach((agg: any) => {
        const { field: aggField, operation } = agg

        switch (operation) {
          case 'sum':
            groupRow[`${aggField}_sum`] = rows.reduce((acc, row) => acc + (Number(row[aggField]) || 0), 0)
            break

          case 'avg':
            groupRow[`${aggField}_avg`] = rows.reduce((acc, row) => acc + (Number(row[aggField]) || 0), 0) / rows.length
            break

          case 'count':
            groupRow[`${aggField}_count`] = rows.length
            break

          case 'min':
            groupRow[`${aggField}_min`] = Math.min(...rows.map(row => Number(row[aggField]) || 0))
            break

          case 'max':
            groupRow[`${aggField}_max`] = Math.max(...rows.map(row => Number(row[aggField]) || 0))
            break
        }
      })

      return groupRow
    })

    return {
      ...data,
      rows: groupedRows,
      total: groupedRows.length,
    }
  }

  /**
   * Transformación AGGREGATE: agrega múltiples campos
   */
  private applyAggregateTransformation(data: WidgetData, config: any): WidgetData {
    const { aggregations = [] } = config

    const aggregatedRow: any = {}

    aggregations.forEach((agg: any) => {
      const { field, operation, alias } = agg
      const outputField = alias || `${field}_${operation}`

      switch (operation) {
        case 'sum':
          aggregatedRow[outputField] = data.rows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0)
          break

        case 'avg':
          aggregatedRow[outputField] = data.rows.reduce((acc, row) => acc + (Number(row[field]) || 0), 0) / data.rows.length
          break

        case 'count':
          aggregatedRow[outputField] = data.rows.length
          break

        case 'min':
          aggregatedRow[outputField] = Math.min(...data.rows.map(row => Number(row[field]) || 0))
          break

        case 'max':
          aggregatedRow[outputField] = Math.max(...data.rows.map(row => Number(row[field]) || 0))
          break

        case 'distinct':
          aggregatedRow[outputField] = new Set(data.rows.map(row => row[field])).size
          break
      }
    })

    return {
      ...data,
      rows: [aggregatedRow],
      total: 1,
      aggregations: aggregatedRow,
    }
  }

  // Helper methods

  /**
   * Evalúa una transformación simple (solo operaciones matemáticas)
   */
  private evaluateTransform(value: any, transform: string): any {
    try {
      // Reemplazar 'value' con el valor actual
      const expression = transform.replace(/value/g, String(value))

      // Solo permitir operaciones matemáticas básicas
      if (!/^[\d\s+\-*/().]+$/.test(expression)) {
        console.warn('Invalid transform expression:', expression)
        return value
      }

      // Evaluar expresión
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; return (${expression})`)()
    }
    catch (error) {
      console.error('Error evaluating transform:', error)
      return value
    }
  }

  /**
   * Evalúa una condición (comparaciones simples)
   */
  private evaluateCondition(row: any, condition: string): boolean {
    try {
      // Crear contexto con los campos del row
      const context: any = { ...row }

      // Reemplazar nombres de campos en la condición
      let expression = condition
      for (const field in context) {
        const regex = new RegExp(`\\b${field}\\b`, 'g')
        expression = expression.replace(regex, `context.${field}`)
      }

      // Solo permitir comparaciones básicas
      if (!/^[a-zA-Z0-9\s._<>=!&|()'"]+$/.test(expression)) {
        console.warn('Invalid condition expression:', expression)
        return true
      }

      // Evaluar condición
      // eslint-disable-next-line no-new-func
      return Function('context', `"use strict"; return (${expression})`)(context)
    }
    catch (error) {
      console.error('Error evaluating condition:', error)
      return true
    }
  }

  /**
   * Formatea datos según el tipo de widget
   */
  formatDataForWidget(
    data: WidgetData,
    widgetType: string,
    displayConfig: any,
  ): any {
    switch (widgetType) {
      case 'stat':
        return this.formatForStatWidget(data, displayConfig.stat)

      case 'chart_line':
      case 'chart_bar':
      case 'chart_area':
        return this.formatForChartWidget(data, displayConfig.chart)

      case 'chart_pie':
      case 'chart_donut':
        return this.formatForPieChartWidget(data, displayConfig.chart)

      case 'table':
        return this.formatForTableWidget(data, displayConfig.table)

      default:
        return data
    }
  }

  private formatForStatWidget(data: WidgetData, config: any): any {
    if (!data.rows || data.rows.length === 0) {
      return { value: 0, trend: 0 }
    }

    const row = data.rows[0]
    const value = row[config.value_field] || 0
    const trend = config.trend_field ? row[config.trend_field] || 0 : null

    return { value, trend }
  }

  private formatForChartWidget(data: WidgetData, config: any): any {
    const { x_axis_field, y_axis_field } = config

    if (!data.rows || data.rows.length === 0) {
      return { categories: [], series: [] }
    }

    const categories = data.rows.map(row => row[x_axis_field])
    const values = data.rows.map(row => row[y_axis_field])

    return {
      categories,
      series: [
        {
          name: y_axis_field,
          data: values,
        },
      ],
    }
  }

  private formatForPieChartWidget(data: WidgetData, config: any): any {
    const { x_axis_field, y_axis_field } = config

    if (!data.rows || data.rows.length === 0) {
      return { labels: [], series: [] }
    }

    const labels = data.rows.map(row => row[x_axis_field])
    const values = data.rows.map(row => row[y_axis_field])

    return { labels, series: values }
  }

  private formatForTableWidget(data: WidgetData, config: any): any {
    return {
      rows: data.rows,
      columns: config.columns || data.columns,
      total: data.total,
    }
  }
}
