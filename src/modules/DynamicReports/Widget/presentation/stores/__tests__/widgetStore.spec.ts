import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWidgetStore } from '../widgetStore'
import { WidgetTypeEnum } from '../../../domain/types'
import type { WidgetCreateDto } from '../../../application/dtos/WidgetDtos'

// Mock the repository
vi.mock('../../../infrastructure/repositories/WidgetRepositoryImpl', () => ({
  WidgetRepositoryImpl: vi.fn().mockImplementation(() => ({
    findAll: vi.fn().mockResolvedValue({
      isSuccess: true,
      getValue: () => ({
        items: [
          {
            id: { toString: () => 'widget-1' },
            props: {
              name: 'Test Widget 1',
              type: WidgetTypeEnum.STAT,
              dataSourceId: 'ds-1',
            },
          },
        ],
        total: 1,
      }),
    }),
    findById: vi.fn().mockResolvedValue({
      isSuccess: true,
      getValue: () => ({
        id: { toString: () => 'widget-1' },
        props: {
          name: 'Test Widget 1',
          type: WidgetTypeEnum.STAT,
          dataSourceId: 'ds-1',
        },
      }),
    }),
    create: vi.fn().mockResolvedValue({
      isSuccess: true,
      getValue: () => ({
        id: { toString: () => 'widget-new' },
        props: {
          name: 'New Widget',
          type: WidgetTypeEnum.STAT,
          dataSourceId: 'ds-1',
        },
      }),
    }),
    update: vi.fn().mockResolvedValue({
      isSuccess: true,
      getValue: () => ({
        id: { toString: () => 'widget-1' },
        props: {
          name: 'Updated Widget',
          type: WidgetTypeEnum.STAT,
          dataSourceId: 'ds-1',
        },
      }),
    }),
    delete: vi.fn().mockResolvedValue({
      isSuccess: true,
    }),
  })),
}))

describe('widgetStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('state', () => {
    it('should initialize with default state', () => {
      const store = useWidgetStore()

      expect(store.items).toEqual([])
      expect(store.currentItem).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.page).toBe(1)
      expect(store.itemsPerPage).toBe(10)
      expect(store.total).toBe(0)
    })
  })

  describe('getters', () => {
    it('should compute hasItems correctly', () => {
      const store = useWidgetStore()

      expect(store.hasItems).toBe(false)

      store.items = [
        {
          id: { toString: () => 'w-1' },
          props: {
            name: 'Widget 1',
            type: WidgetTypeEnum.STAT,
          },
        } as any,
      ]

      expect(store.hasItems).toBe(true)
    })

    it('should compute isEmpty correctly', () => {
      const store = useWidgetStore()

      expect(store.isEmpty).toBe(true)

      store.items = [{ id: { toString: () => 'w-1' } } as any]

      expect(store.isEmpty).toBe(false)
    })

    it('should compute totalPages correctly', () => {
      const store = useWidgetStore()

      store.total = 25
      store.itemsPerPage = 10

      expect(store.totalPages).toBe(3)

      store.total = 30
      expect(store.totalPages).toBe(3)

      store.total = 0
      expect(store.totalPages).toBe(0)
    })
  })

  describe('actions', () => {
    it('should fetch list of widgets', async () => {
      const store = useWidgetStore()

      await store.fetchList()

      expect(store.loading).toBe(false)
      expect(store.items).toHaveLength(1)
      expect(store.items[0].props.name).toBe('Test Widget 1')
      expect(store.total).toBe(1)
    })

    it('should fetch widget by id', async () => {
      const store = useWidgetStore()

      await store.fetchById('widget-1')

      expect(store.currentItem).not.toBeNull()
      expect(store.currentItem?.props.name).toBe('Test Widget 1')
    })

    it('should create a new widget', async () => {
      const store = useWidgetStore()

      const data: WidgetCreateDto = {
        name: 'New Widget',
        type: WidgetTypeEnum.STAT,
        dataSourceId: 'ds-1',
        displayConfig: {},
        queryConfig: { limit: 100, offset: 0 },
        transformations: [],
        filters: [],
      }

      const result = await store.createItem(data)

      expect(result).not.toBeNull()
      expect(result?.props.name).toBe('New Widget')
    })

    it('should update a widget', async () => {
      const store = useWidgetStore()

      const result = await store.updateItem('widget-1', {
        name: 'Updated Widget',
      })

      expect(result).not.toBeNull()
      expect(result?.props.name).toBe('Updated Widget')
    })

    it('should delete a widget', async () => {
      const store = useWidgetStore()

      await store.deleteItem('widget-1')

      expect(store.error).toBeNull()
    })

    it('should set loading state during async operations', async () => {
      const store = useWidgetStore()

      const promise = store.fetchList()

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
    })

    it('should handle errors', async () => {
      const store = useWidgetStore()

      // Mock error
      vi.spyOn(store['repository'], 'findAll').mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: 'Test error',
      } as any)

      await store.fetchList()

      expect(store.error).toBe('Test error')
    })
  })

  describe('pagination', () => {
    it('should set page', () => {
      const store = useWidgetStore()

      store.setPage(3)

      expect(store.page).toBe(3)
    })

    it('should set items per page', () => {
      const store = useWidgetStore()

      store.setItemsPerPage(25)

      expect(store.itemsPerPage).toBe(25)
      expect(store.page).toBe(1) // Should reset to page 1
    })
  })

  describe('filters', () => {
    it('should set filters', () => {
      const store = useWidgetStore()

      const filters = {
        type: WidgetTypeEnum.STAT,
        search: 'test',
      }

      store.setFilters(filters)

      expect(store.filters).toEqual(filters)
    })

    it('should clear filters', () => {
      const store = useWidgetStore()

      store.filters = { type: WidgetTypeEnum.STAT }

      store.clearFilters()

      expect(store.filters).toEqual({})
    })
  })

  describe('error handling', () => {
    it('should clear error', () => {
      const store = useWidgetStore()

      store.error = 'Test error'

      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const store = useWidgetStore()

      store.items = [{ id: { toString: () => 'w-1' } } as any]
      store.currentItem = { id: { toString: () => 'w-1' } } as any
      store.loading = true
      store.error = 'Error'
      store.page = 5
      store.total = 100

      store.reset()

      expect(store.items).toEqual([])
      expect(store.currentItem).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.page).toBe(1)
      expect(store.total).toBe(0)
    })
  })
})
