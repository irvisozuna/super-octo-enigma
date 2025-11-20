import { describe, it, expect } from 'vitest'
import { Dashboard } from '../Dashboard'
import { DashboardId } from '../../value-objects/DashboardId'
import type { DashboardProps, WidgetInstanceConfig } from '../../types/DashboardTypes'

describe('Dashboard Entity', () => {
  const validProps: DashboardProps = {
    name: 'Test Dashboard',
    description: 'Test Description',
    slug: 'test-dashboard',
    ownerId: 'user-123',
    isPublic: false,
    isFavorite: false,
    layout: {
      columns: 12,
      rowHeight: 60,
      margin: 10,
    },
    theme: {
      mode: 'light',
      primaryColor: '#1976D2',
      backgroundColor: '#FFFFFF',
      fontFamily: 'Roboto',
      fontSize: 14,
    },
    widgets: [],
    globalFilters: [],
    permissions: [],
    category: null,
    tags: [],
    viewCount: 0,
    lastViewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('create', () => {
    it('should create a valid dashboard', () => {
      const result = Dashboard.create(validProps)

      expect(result.isSuccess).toBe(true)
      expect(result.getValue()?.props.name).toBe('Test Dashboard')
      expect(result.getValue()?.props.slug).toBe('test-dashboard')
    })

    it('should fail with empty name', () => {
      const result = Dashboard.create({ ...validProps, name: '' })

      expect(result.isFailure).toBe(true)
      expect(result.error).toContain('name')
    })

    it('should fail with empty slug', () => {
      const result = Dashboard.create({ ...validProps, slug: '' })

      expect(result.isFailure).toBe(true)
      expect(result.error).toContain('slug')
    })

    it('should trim name and slug', () => {
      const result = Dashboard.create({
        ...validProps,
        name: '  Test Dashboard  ',
        slug: '  test-dashboard  ',
      })

      expect(result.isSuccess).toBe(true)
      expect(result.getValue()?.props.name).toBe('Test Dashboard')
      expect(result.getValue()?.props.slug).toBe('test-dashboard')
    })
  })

  describe('update', () => {
    it('should update dashboard properties', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      const result = dashboard.update({
        name: 'Updated Dashboard',
        description: 'Updated Description',
      })

      expect(result.isSuccess).toBe(true)
      expect(dashboard.props.name).toBe('Updated Dashboard')
      expect(dashboard.props.description).toBe('Updated Description')
    })

    it('should fail with invalid name', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      const result = dashboard.update({ name: '' })

      expect(result.isFailure).toBe(true)
    })
  })

  describe('addWidget', () => {
    it('should add a widget', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      const widget: WidgetInstanceConfig = {
        id: 'widget-1',
        widget_id: 'w-123',
        dashboard_id: dashboard.id.toString(),
        title: 'Test Widget',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      }

      const result = dashboard.addWidget(widget)

      expect(result.isSuccess).toBe(true)
      expect(dashboard.props.widgets).toHaveLength(1)
      expect(dashboard.props.widgets[0].title).toBe('Test Widget')
    })

    it('should fail with invalid position', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      const widget: WidgetInstanceConfig = {
        id: 'widget-1',
        widget_id: 'w-123',
        dashboard_id: dashboard.id.toString(),
        title: 'Test Widget',
        position: { x: -1, y: 0, w: 4, h: 3 },
        config: {},
        order: 0,
      }

      const result = dashboard.addWidget(widget)

      expect(result.isFailure).toBe(true)
      expect(result.error).toContain('position')
    })

    it('should fail when position exceeds grid columns', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      const widget: WidgetInstanceConfig = {
        id: 'widget-1',
        widget_id: 'w-123',
        dashboard_id: dashboard.id.toString(),
        title: 'Test Widget',
        position: { x: 10, y: 0, w: 4, h: 3 }, // x=10 + w=4 = 14 > 12 columns
        config: {},
        order: 0,
      }

      const result = dashboard.addWidget(widget)

      expect(result.isFailure).toBe(true)
    })
  })

  describe('removeWidget', () => {
    it('should remove a widget', () => {
      const dashboard = Dashboard.create({
        ...validProps,
        widgets: [
          {
            id: 'widget-1',
            widget_id: 'w-123',
            dashboard_id: 'dash-1',
            title: 'Test Widget',
            position: { x: 0, y: 0, w: 4, h: 3 },
            config: {},
            order: 0,
          },
        ],
      }).getValue()!

      const result = dashboard.removeWidget('widget-1')

      expect(result.isSuccess).toBe(true)
      expect(dashboard.props.widgets).toHaveLength(0)
    })

    it('should fail when widget not found', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      const result = dashboard.removeWidget('non-existent')

      expect(result.isFailure).toBe(true)
    })
  })

  describe('updateWidgetPosition', () => {
    it('should update widget position', () => {
      const dashboard = Dashboard.create({
        ...validProps,
        widgets: [
          {
            id: 'widget-1',
            widget_id: 'w-123',
            dashboard_id: 'dash-1',
            title: 'Test Widget',
            position: { x: 0, y: 0, w: 4, h: 3 },
            config: {},
            order: 0,
          },
        ],
      }).getValue()!

      const result = dashboard.updateWidgetPosition('widget-1', {
        x: 4,
        y: 2,
        w: 6,
        h: 4,
      })

      expect(result.isSuccess).toBe(true)
      expect(dashboard.props.widgets[0].position.x).toBe(4)
      expect(dashboard.props.widgets[0].position.y).toBe(2)
    })

    it('should fail with invalid position', () => {
      const dashboard = Dashboard.create({
        ...validProps,
        widgets: [
          {
            id: 'widget-1',
            widget_id: 'w-123',
            dashboard_id: 'dash-1',
            title: 'Test Widget',
            position: { x: 0, y: 0, w: 4, h: 3 },
            config: {},
            order: 0,
          },
        ],
      }).getValue()!

      const result = dashboard.updateWidgetPosition('widget-1', {
        x: -1,
        y: 0,
        w: 4,
        h: 3,
      })

      expect(result.isFailure).toBe(true)
    })
  })

  describe('toggleFavorite', () => {
    it('should toggle favorite status', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      expect(dashboard.props.isFavorite).toBe(false)

      dashboard.toggleFavorite()
      expect(dashboard.props.isFavorite).toBe(true)

      dashboard.toggleFavorite()
      expect(dashboard.props.isFavorite).toBe(false)
    })
  })

  describe('incrementViewCount', () => {
    it('should increment view count', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      expect(dashboard.props.viewCount).toBe(0)

      dashboard.incrementViewCount()
      expect(dashboard.props.viewCount).toBe(1)

      dashboard.incrementViewCount()
      expect(dashboard.props.viewCount).toBe(2)
    })

    it('should update lastViewedAt', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      const before = dashboard.props.lastViewedAt

      dashboard.incrementViewCount()

      expect(dashboard.props.lastViewedAt).not.toBe(before)
      expect(dashboard.props.lastViewedAt).toBeInstanceOf(Date)
    })
  })

  describe('clone', () => {
    it('should clone dashboard with new name', () => {
      const original = Dashboard.create({
        ...validProps,
        widgets: [
          {
            id: 'widget-1',
            widget_id: 'w-123',
            dashboard_id: 'dash-1',
            title: 'Test Widget',
            position: { x: 0, y: 0, w: 4, h: 3 },
            config: {},
            order: 0,
          },
        ],
      }).getValue()!

      const result = original.clone('Cloned Dashboard')

      expect(result.isSuccess).toBe(true)

      const cloned = result.getValue()!
      expect(cloned.props.name).toBe('Cloned Dashboard')
      expect(cloned.props.widgets).toHaveLength(1)
      expect(cloned.id).not.toEqual(original.id)
    })

    it('should reset view count and favorite status', () => {
      const original = Dashboard.create({
        ...validProps,
        isFavorite: true,
        viewCount: 100,
      }).getValue()!

      const cloned = original.clone('Cloned').getValue()!

      expect(cloned.props.isFavorite).toBe(false)
      expect(cloned.props.viewCount).toBe(0)
    })
  })

  describe('validatePosition', () => {
    it('should validate correct position', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      const result = dashboard['validatePosition']({ x: 0, y: 0, w: 6, h: 3 })

      expect(result).toBe(true)
    })

    it('should reject negative coordinates', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      expect(dashboard['validatePosition']({ x: -1, y: 0, w: 4, h: 3 })).toBe(false)
      expect(dashboard['validatePosition']({ x: 0, y: -1, w: 4, h: 3 })).toBe(false)
    })

    it('should reject zero or negative dimensions', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      expect(dashboard['validatePosition']({ x: 0, y: 0, w: 0, h: 3 })).toBe(false)
      expect(dashboard['validatePosition']({ x: 0, y: 0, w: 4, h: 0 })).toBe(false)
      expect(dashboard['validatePosition']({ x: 0, y: 0, w: -1, h: 3 })).toBe(false)
    })

    it('should reject position exceeding grid columns', () => {
      const dashboard = Dashboard.create(validProps).getValue()!

      expect(dashboard['validatePosition']({ x: 10, y: 0, w: 4, h: 3 })).toBe(false)
      expect(dashboard['validatePosition']({ x: 0, y: 0, w: 13, h: 3 })).toBe(false)
    })
  })
})
