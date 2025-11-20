import { describe, it, expect } from 'vitest'
import { WidgetFactory } from '../WidgetFactory'
import { WidgetTypeEnum } from '../../../domain/types'

describe('WidgetFactory', () => {
  describe('createFromType', () => {
    it('should create a STAT widget with default config', () => {
      const result = WidgetFactory.createFromType(WidgetTypeEnum.STAT, {
        name: 'Sales Total',
        dataSourceId: 'ds-123',
      })

      expect(result.isSuccess).toBe(true)

      const widget = result.getValue()!
      expect(widget.props.type).toBe(WidgetTypeEnum.STAT)
      expect(widget.props.name).toBe('Sales Total')
      expect(widget.props.displayConfig).toHaveProperty('valueField')
      expect(widget.props.displayConfig).toHaveProperty('format')
    })

    it('should create a CHART_LINE widget with default config', () => {
      const result = WidgetFactory.createFromType(WidgetTypeEnum.CHART_LINE, {
        name: 'Sales Chart',
        dataSourceId: 'ds-123',
      })

      expect(result.isSuccess).toBe(true)

      const widget = result.getValue()!
      expect(widget.props.type).toBe(WidgetTypeEnum.CHART_LINE)
      expect(widget.props.displayConfig).toHaveProperty('xAxisField')
      expect(widget.props.displayConfig).toHaveProperty('yAxisField')
      expect(widget.props.displayConfig).toHaveProperty('showLegend')
    })

    it('should create a TABLE widget with default config', () => {
      const result = WidgetFactory.createFromType(WidgetTypeEnum.TABLE, {
        name: 'Data Table',
        dataSourceId: 'ds-123',
      })

      expect(result.isSuccess).toBe(true)

      const widget = result.getValue()!
      expect(widget.props.type).toBe(WidgetTypeEnum.TABLE)
      expect(widget.props.displayConfig).toHaveProperty('visibleColumns')
      expect(widget.props.displayConfig).toHaveProperty('sortable')
      expect(widget.props.displayConfig).toHaveProperty('enablePagination')
    })

    it('should create a MAP widget with default config', () => {
      const result = WidgetFactory.createFromType(WidgetTypeEnum.MAP, {
        name: 'Location Map',
        dataSourceId: 'ds-123',
      })

      expect(result.isSuccess).toBe(true)

      const widget = result.getValue()!
      expect(widget.props.type).toBe(WidgetTypeEnum.MAP)
      expect(widget.props.displayConfig).toHaveProperty('latitudeField')
      expect(widget.props.displayConfig).toHaveProperty('longitudeField')
      expect(widget.props.displayConfig).toHaveProperty('markerColor')
    })

    it('should override default config with provided config', () => {
      const result = WidgetFactory.createFromType(WidgetTypeEnum.STAT, {
        name: 'Custom Widget',
        dataSourceId: 'ds-123',
        displayConfig: {
          valueField: 'customField',
          format: 'currency',
          decimals: 3,
        },
      })

      expect(result.isSuccess).toBe(true)

      const widget = result.getValue()!
      expect(widget.props.displayConfig.valueField).toBe('customField')
      expect(widget.props.displayConfig.format).toBe('currency')
      expect(widget.props.displayConfig.decimals).toBe(3)
    })

    it('should set default icon based on type', () => {
      const result = WidgetFactory.createFromType(WidgetTypeEnum.CHART_PIE, {
        name: 'Pie Chart',
        dataSourceId: 'ds-123',
      })

      expect(result.isSuccess).toBe(true)

      const widget = result.getValue()!
      expect(widget.props.icon).toBe('tabler-chart-pie')
    })

    it('should allow custom icon', () => {
      const result = WidgetFactory.createFromType(WidgetTypeEnum.STAT, {
        name: 'Custom Icon Widget',
        dataSourceId: 'ds-123',
        icon: 'tabler-custom-icon',
      })

      expect(result.isSuccess).toBe(true)

      const widget = result.getValue()!
      expect(widget.props.icon).toBe('tabler-custom-icon')
    })

    it('should fail with invalid props', () => {
      const result = WidgetFactory.createFromType(WidgetTypeEnum.STAT, {
        name: '',
        dataSourceId: '',
      })

      expect(result.isFailure).toBe(true)
    })
  })

  describe('getDefaultDisplayConfig', () => {
    it('should return STAT config', () => {
      const config = WidgetFactory['getDefaultDisplayConfig'](WidgetTypeEnum.STAT)

      expect(config).toHaveProperty('valueField')
      expect(config).toHaveProperty('format')
      expect(config.format).toBe('number')
    })

    it('should return CHART config for line chart', () => {
      const config = WidgetFactory['getDefaultDisplayConfig'](WidgetTypeEnum.CHART_LINE)

      expect(config).toHaveProperty('xAxisField')
      expect(config).toHaveProperty('yAxisField')
      expect(config).toHaveProperty('curve')
      expect(config.curve).toBe('smooth')
    })

    it('should return TABLE config', () => {
      const config = WidgetFactory['getDefaultDisplayConfig'](WidgetTypeEnum.TABLE)

      expect(config).toHaveProperty('visibleColumns')
      expect(config).toHaveProperty('sortable')
      expect(config.sortable).toBe(true)
    })

    it('should return MAP config', () => {
      const config = WidgetFactory['getDefaultDisplayConfig'](WidgetTypeEnum.MAP)

      expect(config).toHaveProperty('latitudeField')
      expect(config).toHaveProperty('longitudeField')
      expect(config.latitudeField).toBe('latitude')
      expect(config.longitudeField).toBe('longitude')
    })

    it('should return empty config for unknown types', () => {
      const config = WidgetFactory['getDefaultDisplayConfig']('unknown' as WidgetTypeEnum)

      expect(config).toEqual({})
    })
  })

  describe('getDefaultIcon', () => {
    it('should return correct icon for each type', () => {
      expect(WidgetFactory['getDefaultIcon'](WidgetTypeEnum.STAT)).toBe('tabler-chart-bar')
      expect(WidgetFactory['getDefaultIcon'](WidgetTypeEnum.CHART_LINE)).toBe('tabler-chart-line')
      expect(WidgetFactory['getDefaultIcon'](WidgetTypeEnum.CHART_PIE)).toBe('tabler-chart-pie')
      expect(WidgetFactory['getDefaultIcon'](WidgetTypeEnum.TABLE)).toBe('tabler-table')
      expect(WidgetFactory['getDefaultIcon'](WidgetTypeEnum.MAP)).toBe('tabler-map')
    })

    it('should return default widget icon for unknown types', () => {
      const icon = WidgetFactory['getDefaultIcon']('unknown' as WidgetTypeEnum)

      expect(icon).toBe('tabler-widget')
    })
  })
})
