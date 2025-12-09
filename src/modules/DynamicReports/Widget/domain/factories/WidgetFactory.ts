import { Widget } from '../entities/Widget'
import type { WidgetProps } from '../entities/Widget'
import { WidgetTypeEnum, WidgetTypeMetadata } from '../enums/WidgetTypeEnum'
import type { DisplayConfig, QueryConfig } from '../types/WidgetTypes'
import { Result } from '../../../shared/domain/base/Result'

/**
 * Factory para crear widgets según su tipo
 * Proporciona configuraciones por defecto inteligentes
 */
export class WidgetFactory {
  /**
   * Crea un widget desde un tipo específico
   */
  public static createFromType(
    type: WidgetTypeEnum,
    props: Partial<WidgetProps>,
  ): Result<Widget> {
    const metadata = WidgetTypeMetadata[type]

    if (!metadata)
      return Result.fail<Widget>(`Unknown widget type: ${type}`)

    const widgetProps: WidgetProps = {
      ...props,
      type,
      name: props.name || `New ${metadata.name}`,
      display_config: props.display_config || this.getDefaultDisplayConfig(type),
      query_config: props.query_config || this.getDefaultQueryConfig(type),
      data_source_id: props.data_source_id || '',
      refresh_interval: props.refresh_interval || 0,
      cache_enabled: props.cache_enabled !== undefined ? props.cache_enabled : true,
      cache_ttl: props.cache_ttl || 300,
      filters: props.filters || [],
      transformations: props.transformations || [],
      is_active: props.is_active !== undefined ? props.is_active : true,
    }

    return Widget.create(widgetProps)
  }

  /**
   * Crea un widget de tipo STAT (KPI/Contador)
   */
  public static createStatWidget(props: Partial<WidgetProps>): Result<Widget> {
    return this.createFromType(WidgetTypeEnum.STAT, props)
  }

  /**
   * Crea un widget de tipo CHART_LINE
   */
  public static createLineChartWidget(props: Partial<WidgetProps>): Result<Widget> {
    return this.createFromType(WidgetTypeEnum.CHART_LINE, props)
  }

  /**
   * Crea un widget de tipo CHART_BAR
   */
  public static createBarChartWidget(props: Partial<WidgetProps>): Result<Widget> {
    return this.createFromType(WidgetTypeEnum.CHART_BAR, props)
  }

  /**
   * Crea un widget de tipo CHART_PIE
   */
  public static createPieChartWidget(props: Partial<WidgetProps>): Result<Widget> {
    return this.createFromType(WidgetTypeEnum.CHART_PIE, props)
  }

  /**
   * Crea un widget de tipo TABLE
   */
  public static createTableWidget(props: Partial<WidgetProps>): Result<Widget> {
    return this.createFromType(WidgetTypeEnum.TABLE, props)
  }

  /**
   * Crea un widget de tipo MAP
   */
  public static createMapWidget(props: Partial<WidgetProps>): Result<Widget> {
    return this.createFromType(WidgetTypeEnum.MAP, props)
  }

  /**
   * Crea un widget de tipo GAUGE
   */
  public static createGaugeWidget(props: Partial<WidgetProps>): Result<Widget> {
    return this.createFromType(WidgetTypeEnum.GAUGE, props)
  }

  /**
   * Obtiene la configuración de visualización por defecto según el tipo
   */
  private static getDefaultDisplayConfig(type: WidgetTypeEnum): DisplayConfig {
    switch (type) {
      case WidgetTypeEnum.STAT:
        return {
          stat: {
            value_field: '',
            label: 'Metric Value',
            format: 'number',
            show_trend: false,
          },
          theme: 'auto',
          showHeader: true,
        }

      case WidgetTypeEnum.CHART_LINE:
      case WidgetTypeEnum.CHART_AREA:
        return {
          chart: {
            x_axis_field: '',
            y_axis_field: '',
            curve: 'smooth',
            legend_position: 'top',
            data_labels: false,
            animations: true,
            toolbar: true,
            zoom: true,
          },
          theme: 'auto',
          responsive: true,
          showHeader: true,
        }

      case WidgetTypeEnum.CHART_BAR:
        return {
          chart: {
            x_axis_field: '',
            y_axis_field: '',
            horizontal: false,
            stacked: false,
            legend_position: 'top',
            data_labels: true,
            animations: true,
            toolbar: true,
          },
          theme: 'auto',
          responsive: true,
          showHeader: true,
        }

      case WidgetTypeEnum.CHART_PIE:
      case WidgetTypeEnum.CHART_DONUT:
        return {
          chart: {
            x_axis_field: '',
            y_axis_field: '',
            legend_position: 'bottom',
            data_labels: true,
            animations: true,
          },
          theme: 'auto',
          responsive: true,
          showHeader: true,
        }

      case WidgetTypeEnum.TABLE:
        return {
          table: {
            columns: [],
            pagination: true,
            rows_per_page: 10,
            sortable: true,
            filterable: true,
            searchable: true,
            dense: false,
            striped: true,
            bordered: false,
            hoverable: true,
            selection: 'none',
          },
          theme: 'auto',
          showHeader: true,
        }

      case WidgetTypeEnum.MAP:
        return {
          map: {
            lat_field: '',
            lng_field: '',
            zoom_level: 12,
            cluster_markers: true,
            show_popup: true,
            map_style: 'streets',
          },
          theme: 'auto',
          responsive: true,
          showHeader: true,
        }

      case WidgetTypeEnum.GAUGE:
        return {
          gauge: {
            value_field: '',
            max_value: 100,
            format: 'number',
            show_value: true,
            arc_length: 180,
          },
          theme: 'auto',
          showHeader: true,
        }

      case WidgetTypeEnum.PROGRESS:
        return {
          progress: {
            value_field: '',
            max_value: 100,
            show_value: true,
            show_percentage: true,
            size: 'medium',
            variant: 'linear',
          },
          theme: 'auto',
          showHeader: true,
        }

      case WidgetTypeEnum.LIST:
        return {
          list: {
            title_field: '',
            max_items: 10,
            show_dividers: true,
            show_avatars: false,
          },
          theme: 'auto',
          showHeader: true,
        }

      case WidgetTypeEnum.TIMELINE:
        return {
          timeline: {
            date_field: '',
            title_field: '',
            sort_direction: 'DESC',
            max_items: 20,
            compact: false,
          },
          theme: 'auto',
          showHeader: true,
        }

      case WidgetTypeEnum.CALENDAR:
        return {
          calendar: {
            date_field: '',
            title_field: '',
            view: 'month',
            editable: false,
          },
          theme: 'auto',
          responsive: true,
          showHeader: true,
        }

      case WidgetTypeEnum.CUSTOM_HTML:
        return {
          customHtml: {
            content: '<p>Custom HTML content</p>',
            use_template: false,
            allow_scripts: false,
          },
          theme: 'auto',
          showHeader: true,
        }

      default:
        return {
          theme: 'auto',
          showHeader: true,
        }
    }
  }

  /**
   * Obtiene la configuración de consulta por defecto
   */
  private static getDefaultQueryConfig(type: WidgetTypeEnum): QueryConfig {
    switch (type) {
      case WidgetTypeEnum.STAT:
        return {
          fields: [],
          aggregations: [],
          limit: 1,
        }

      case WidgetTypeEnum.TABLE:
      case WidgetTypeEnum.LIST:
        return {
          fields: [],
          limit: 100,
        }

      case WidgetTypeEnum.MAP:
        return {
          fields: [],
          limit: 1000,
        }

      default:
        return {
          fields: [],
          limit: 50,
        }
    }
  }

  /**
   * Obtiene el tamaño por defecto del widget en el grid
   */
  public static getDefaultSize(type: WidgetTypeEnum): { w: number; h: number } {
    const metadata = WidgetTypeMetadata[type]

    return metadata ? metadata.defaultSize : { w: 4, h: 4 }
  }

  /**
   * Obtiene el tamaño mínimo del widget en el grid
   */
  public static getMinSize(type: WidgetTypeEnum): { w: number; h: number } {
    const metadata = WidgetTypeMetadata[type]

    return metadata ? metadata.minSize : { w: 2, h: 2 }
  }

  /**
   * Valida si un widget puede cambiar a otro tipo
   */
  public static canConvertType(
    fromType: WidgetTypeEnum,
    toType: WidgetTypeEnum,
  ): boolean {
    // Charts can be converted between each other
    const chartTypes = [
      WidgetTypeEnum.CHART_LINE,
      WidgetTypeEnum.CHART_BAR,
      WidgetTypeEnum.CHART_PIE,
      WidgetTypeEnum.CHART_AREA,
      WidgetTypeEnum.CHART_DONUT,
      WidgetTypeEnum.CHART_RADIAL,
      WidgetTypeEnum.CHART_SCATTER,
    ]

    if (chartTypes.includes(fromType) && chartTypes.includes(toType))
      return true

    // Same type
    if (fromType === toType)
      return true

    return false
  }
}
