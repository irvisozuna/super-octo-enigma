import { describe, it, expect } from 'vitest'
import { Widget } from '../Widget'
import { WidgetId } from '../../value-objects/WidgetId'
import { WidgetTypeEnum } from '../../types'
import type { WidgetProps } from '../../types/WidgetTypes'

describe('Widget Entity', () => {
  const validProps: WidgetProps = {
    name: 'Test Widget',
    description: 'Test Description',
    type: WidgetTypeEnum.STAT,
    dataSourceId: 'ds-123',
    icon: 'tabler-chart-bar',
    color: '#1976D2',
    queryConfig: {
      limit: 100,
      offset: 0,
    },
    displayConfig: {
      valueField: 'total',
      format: 'number',
      decimals: 2,
    },
    transformations: [],
    filters: [],
    cache: {
      enabled: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('create', () => {
    it('should create a valid widget', () => {
      const result = Widget.create(validProps)

      expect(result.isSuccess).toBe(true)
      expect(result.getValue()?.props.name).toBe('Test Widget')
      expect(result.getValue()?.props.type).toBe(WidgetTypeEnum.STAT)
    })

    it('should fail with empty name', () => {
      const result = Widget.create({ ...validProps, name: '' })

      expect(result.isFailure).toBe(true)
      expect(result.error).toContain('name')
    })

    it('should fail with empty dataSourceId', () => {
      const result = Widget.create({ ...validProps, dataSourceId: '' })

      expect(result.isFailure).toBe(true)
      expect(result.error).toContain('dataSourceId')
    })

    it('should trim name and description', () => {
      const result = Widget.create({
        ...validProps,
        name: '  Test Widget  ',
        description: '  Test Description  ',
      })

      expect(result.isSuccess).toBe(true)
      expect(result.getValue()?.props.name).toBe('Test Widget')
      expect(result.getValue()?.props.description).toBe('Test Description')
    })
  })

  describe('update', () => {
    it('should update widget properties', () => {
      const widget = Widget.create(validProps).getValue()!

      const result = widget.update({
        name: 'Updated Name',
        description: 'Updated Description',
      })

      expect(result.isSuccess).toBe(true)
      expect(widget.props.name).toBe('Updated Name')
      expect(widget.props.description).toBe('Updated Description')
    })

    it('should fail with invalid name', () => {
      const widget = Widget.create(validProps).getValue()!

      const result = widget.update({ name: '' })

      expect(result.isFailure).toBe(true)
    })
  })

  describe('addFilter', () => {
    it('should add a filter', () => {
      const widget = Widget.create(validProps).getValue()!

      const filter = {
        id: 'filter-1',
        field: 'status',
        operator: 'eq' as const,
        value: 'active',
      }

      const result = widget.addFilter(filter)

      expect(result.isSuccess).toBe(true)
      expect(widget.props.filters).toHaveLength(1)
      expect(widget.props.filters[0].field).toBe('status')
    })

    it('should fail with invalid filter', () => {
      const widget = Widget.create(validProps).getValue()!

      const filter = {
        id: '',
        field: '',
        operator: 'eq' as const,
        value: '',
      }

      const result = widget.addFilter(filter)

      expect(result.isFailure).toBe(true)
    })
  })

  describe('removeFilter', () => {
    it('should remove a filter', () => {
      const widget = Widget.create({
        ...validProps,
        filters: [
          { id: 'filter-1', field: 'status', operator: 'eq', value: 'active' },
        ],
      }).getValue()!

      const result = widget.removeFilter('filter-1')

      expect(result.isSuccess).toBe(true)
      expect(widget.props.filters).toHaveLength(0)
    })

    it('should fail when filter not found', () => {
      const widget = Widget.create(validProps).getValue()!

      const result = widget.removeFilter('non-existent')

      expect(result.isFailure).toBe(true)
    })
  })

  describe('enableCache', () => {
    it('should enable cache with valid TTL', () => {
      const widget = Widget.create(validProps).getValue()!

      const result = widget.enableCache(3600)

      expect(result.isSuccess).toBe(true)
      expect(widget.props.cache?.enabled).toBe(true)
      expect(widget.props.cache?.ttl).toBe(3600)
    })

    it('should fail with negative TTL', () => {
      const widget = Widget.create(validProps).getValue()!

      const result = widget.enableCache(-100)

      expect(result.isFailure).toBe(true)
    })
  })

  describe('disableCache', () => {
    it('should disable cache', () => {
      const widget = Widget.create({
        ...validProps,
        cache: { enabled: true, ttl: 3600 },
      }).getValue()!

      const result = widget.disableCache()

      expect(result.isSuccess).toBe(true)
      expect(widget.props.cache?.enabled).toBe(false)
    })
  })

  describe('updateQueryConfig', () => {
    it('should update query config', () => {
      const widget = Widget.create(validProps).getValue()!

      const result = widget.updateQueryConfig({ limit: 50 })

      expect(result.isSuccess).toBe(true)
      expect(widget.props.queryConfig.limit).toBe(50)
    })

    it('should fail with invalid limit', () => {
      const widget = Widget.create(validProps).getValue()!

      const result = widget.updateQueryConfig({ limit: -1 })

      expect(result.isFailure).toBe(true)
    })
  })

  describe('updateDisplayConfig', () => {
    it('should update display config', () => {
      const widget = Widget.create(validProps).getValue()!

      const result = widget.updateDisplayConfig({ decimals: 4 })

      expect(result.isSuccess).toBe(true)
      expect(widget.props.displayConfig.decimals).toBe(4)
    })
  })
})
