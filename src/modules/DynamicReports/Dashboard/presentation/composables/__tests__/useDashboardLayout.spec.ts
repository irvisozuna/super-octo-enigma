import { beforeEach, describe, expect, it } from 'vitest'
import { useDashboardLayout } from '../useDashboardLayout'
import type { WidgetInstanceConfig } from '../../../domain/types/DashboardTypes'

describe('useDashboardLayout', () => {
  let layout: ReturnType<typeof useDashboardLayout>

  beforeEach(() => {
    layout = useDashboardLayout([], {
      columns: 12,
      rowHeight: 60,
      margin: 10,
    })
  })

  describe('initialization', () => {
    it('should initialize with empty grid', () => {
      expect(layout.gridItems.value).toEqual([])
      expect(layout.isEmpty.value).toBe(true)
      expect(layout.widgetCount.value).toBe(0)
    })

    it('should initialize with provided widgets', () => {
      const widgets: WidgetInstanceConfig[] = [
        {
          id: 'w-1',
          widget_id: 'widget-1',
          dashboard_id: 'dash-1',
          title: 'Widget 1',
          position: { x: 0, y: 0, w: 4, h: 3 },
          config: {},
          order: 0,
        },
      ]

      const layoutWithWidgets = useDashboardLayout(widgets)

      expect(layoutWithWidgets.gridItems.value).toHaveLength(1)
      expect(layoutWithWidgets.isEmpty.value).toBe(false)
    })

    it('should set options correctly', () => {
      expect(layout.columns.value).toBe(12)
      expect(layout.rowHeight.value).toBe(60)
      expect(layout.margin.value).toBe(10)
      expect(layout.isDraggable.value).toBe(true)
      expect(layout.isResizable.value).toBe(true)
    })
  })

  describe('addWidget', () => {
    it('should add a widget to the grid', () => {
      const widget: WidgetInstanceConfig = {
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      }

      const result = layout.addWidget(widget)

      expect(result).toBeDefined()
      expect(layout.gridItems.value).toHaveLength(1)
      expect(layout.widgetCount.value).toBe(1)
      expect(layout.hasChanges.value).toBe(true)
    })

    it('should find available position if position is occupied', () => {
      // Add first widget
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      // Add second widget with same position
      const widget2: WidgetInstanceConfig = {
        id: 'w-2',
        widget_id: 'widget-2',
        dashboard_id: 'dash-1',
        title: 'Widget 2',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 1,
      }

      const result = layout.addWidget(widget2)

      expect(result.position).not.toEqual(widget2.position)
      expect(layout.gridItems.value).toHaveLength(2)
    })
  })

  describe('removeWidget', () => {
    it('should remove a widget from the grid', () => {
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      layout.removeWidget('w-1')

      expect(layout.gridItems.value).toHaveLength(0)
      expect(layout.isEmpty.value).toBe(true)
      expect(layout.hasChanges.value).toBe(true)
    })

    it('should clear selected widget if removed', () => {
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      layout.selectWidget('w-1')
      expect(layout.selectedWidget.value).toBe('w-1')

      layout.removeWidget('w-1')
      expect(layout.selectedWidget.value).toBeNull()
    })
  })

  describe('updateWidgetPosition', () => {
    it('should update widget position', () => {
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      layout.updateWidgetPosition('w-1', { x: 4, y: 2, w: 6, h: 4 })

      const widget = layout.gridItems.value.find(w => w.id === 'w-1')

      expect(widget?.position).toEqual({ x: 4, y: 2, w: 6, h: 4 })
      expect(layout.hasChanges.value).toBe(true)
    })
  })

  describe('selectWidget', () => {
    it('should select a widget', () => {
      layout.selectWidget('w-1')

      expect(layout.selectedWidget.value).toBe('w-1')
    })

    it('should deselect widget when passing null', () => {
      layout.selectWidget('w-1')
      layout.selectWidget(null)

      expect(layout.selectedWidget.value).toBeNull()
    })
  })

  describe('validatePosition', () => {
    it('should validate correct position', () => {
      const result = layout.validatePosition({ x: 0, y: 0, w: 4, h: 3 })

      expect(result).toBe(true)
    })

    it('should reject negative coordinates', () => {
      expect(layout.validatePosition({ x: -1, y: 0, w: 4, h: 3 })).toBe(false)
      expect(layout.validatePosition({ x: 0, y: -1, w: 4, h: 3 })).toBe(false)
    })

    it('should reject position exceeding columns', () => {
      expect(layout.validatePosition({ x: 10, y: 0, w: 4, h: 3 })).toBe(false)
      expect(layout.validatePosition({ x: 0, y: 0, w: 13, h: 3 })).toBe(false)
    })

    it('should reject zero or negative dimensions', () => {
      expect(layout.validatePosition({ x: 0, y: 0, w: 0, h: 3 })).toBe(false)
      expect(layout.validatePosition({ x: 0, y: 0, w: 4, h: 0 })).toBe(false)
    })
  })

  describe('detectCollision', () => {
    it('should detect collision between widgets', () => {
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      const collision = layout.detectCollision({ x: 2, y: 1, w: 4, h: 3 })

      expect(collision).toBe(true)
    })

    it('should not detect collision for non-overlapping widgets', () => {
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      const collision = layout.detectCollision({ x: 6, y: 0, w: 4, h: 3 })

      expect(collision).toBe(false)
    })

    it('should exclude widget when provided', () => {
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      const collision = layout.detectCollision(
        { x: 0, y: 0, w: 4, h: 3 },
        'w-1',
      )

      expect(collision).toBe(false)
    })
  })

  describe('compactLayout', () => {
    it('should compact layout vertically', () => {
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 5, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      layout.compactLayout()

      const widget = layout.gridItems.value.find(w => w.id === 'w-1')

      expect(widget?.position.y).toBe(0)
    })
  })

  describe('getLayout', () => {
    it('should return layout as array', () => {
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      const layoutArray = layout.getLayout()

      expect(layoutArray).toHaveLength(1)
      expect(layoutArray[0]).toEqual({
        id: 'w-1',
        position: { x: 0, y: 0, w: 4, h: 3 },
      })
    })
  })

  describe('gridHeight', () => {
    it('should calculate grid height correctly', () => {
      layout.addWidget({
        id: 'w-1',
        widget_id: 'widget-1',
        dashboard_id: 'dash-1',
        title: 'Widget 1',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      })

      // height = (y + h) * rowHeight + (y + h - 1) * margin + 2 * containerPadding
      // = 3 * 60 + 2 * 10 + 2 * 10 = 180 + 20 + 20 = 220
      expect(layout.gridHeight.value).toBe(220)
    })

    it('should return minimum height for empty grid', () => {
      expect(layout.gridHeight.value).toBe(60)
    })
  })
})
