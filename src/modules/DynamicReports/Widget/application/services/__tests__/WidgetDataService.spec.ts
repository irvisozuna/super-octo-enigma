import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WidgetDataService } from '../WidgetDataService'
import { Widget } from '../../../domain/entities/Widget'
import { WidgetTypeEnum } from '../../../domain/types'
import type { WidgetData } from '../../../domain/types/WidgetTypes'

describe('WidgetDataService', () => {
  let service: WidgetDataService
  let mockWidget: Widget

  beforeEach(() => {
    service = new WidgetDataService()

    mockWidget = Widget.create({
      name: 'Test Widget',
      description: 'Test',
      type: WidgetTypeEnum.STAT,
      dataSourceId: 'ds-123',
      icon: 'tabler-chart-bar',
      color: '#1976D2',
      queryConfig: {
        limit: 100,
        offset: 0,
      },
      displayConfig: {},
      transformations: [],
      filters: [],
      cache: {
        enabled: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).getValue()!
  })

  describe('executeWidgetQuery', () => {
    it('should execute query and return data', async () => {
      const mockData: WidgetData = {
        columns: ['id', 'name', 'value'],
        rows: [
          { id: 1, name: 'Item 1', value: 100 },
          { id: 2, name: 'Item 2', value: 200 },
        ],
        total: 2,
      }

      // Mock API call (in real implementation)
      vi.spyOn(service as any, 'fetchData').mockResolvedValue(mockData)

      const result = await service.executeWidgetQuery(mockWidget)

      expect(result.columns).toEqual(['id', 'name', 'value'])
      expect(result.rows).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should apply filters from widget', async () => {
      const widgetWithFilters = Widget.create({
        ...mockWidget.props,
        filters: [
          { id: 'f1', field: 'status', operator: 'eq', value: 'active' },
        ],
      }).getValue()!

      const spy = vi.spyOn(service as any, 'fetchData')

      await service.executeWidgetQuery(widgetWithFilters)

      expect(spy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          filters: widgetWithFilters.props.filters,
        }),
      )
    })

    it('should apply limit and offset from query config', async () => {
      const spy = vi.spyOn(service as any, 'fetchData')

      await service.executeWidgetQuery(mockWidget)

      expect(spy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          limit: 100,
          offset: 0,
        }),
      )
    })
  })

  describe('executeWithCache', () => {
    it('should return cached data if available and not stale', async () => {
      const cachedData: WidgetData = {
        columns: ['id'],
        rows: [{ id: 1 }],
        total: 1,
      }

      const widgetWithCache = Widget.create({
        ...mockWidget.props,
        cache: {
          enabled: true,
          ttl: 3600,
        },
      }).getValue()!

      // Set cache
      service['cache'].set(widgetWithCache.id.toString(), {
        data: cachedData,
        timestamp: Date.now(),
      })

      const result = await service.executeWithCache(widgetWithCache)

      expect(result.cached).toBe(true)
      expect(result.data).toEqual(cachedData)
    })

    it('should fetch fresh data if cache is stale', async () => {
      const freshData: WidgetData = {
        columns: ['id'],
        rows: [{ id: 2 }],
        total: 1,
      }

      const widgetWithCache = Widget.create({
        ...mockWidget.props,
        cache: {
          enabled: true,
          ttl: 1, // 1 second
        },
      }).getValue()!

      // Set stale cache
      service['cache'].set(widgetWithCache.id.toString(), {
        data: { columns: [], rows: [], total: 0 },
        timestamp: Date.now() - 2000, // 2 seconds ago
      })

      vi.spyOn(service, 'executeWidgetQuery').mockResolvedValue(freshData)

      const result = await service.executeWithCache(widgetWithCache)

      expect(result.cached).toBe(false)
      expect(result.data).toEqual(freshData)
    })
  })

  describe('clearCache', () => {
    it('should clear cache for widget', () => {
      const widgetId = mockWidget.id.toString()

      service['cache'].set(widgetId, {
        data: { columns: [], rows: [], total: 0 },
        timestamp: Date.now(),
      })

      service.clearCache(widgetId)

      expect(service['cache'].has(widgetId)).toBe(false)
    })
  })

  describe('clearAllCache', () => {
    it('should clear all cache', () => {
      service['cache'].set('widget-1', {
        data: { columns: [], rows: [], total: 0 },
        timestamp: Date.now(),
      })

      service['cache'].set('widget-2', {
        data: { columns: [], rows: [], total: 0 },
        timestamp: Date.now(),
      })

      service.clearAllCache()

      expect(service['cache'].size).toBe(0)
    })
  })

  describe('validateData', () => {
    it('should return true for valid data', () => {
      const validData: WidgetData = {
        columns: ['id', 'name'],
        rows: [{ id: 1, name: 'Test' }],
        total: 1,
      }

      const result = service['validateData'](validData)

      expect(result).toBe(true)
    })

    it('should return false for invalid data', () => {
      const invalidData: any = {
        columns: null,
        rows: 'not an array',
      }

      const result = service['validateData'](invalidData)

      expect(result).toBe(false)
    })
  })
})
