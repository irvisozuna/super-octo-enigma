import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWidget } from '../useWidget'
import { WidgetTypeEnum } from '../../../domain/types'

describe('useWidget', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should expose widget store state', () => {
    const {
      items,
      currentItem,
      loading,
      error,
      page,
      itemsPerPage,
      total,
      totalPages,
      hasItems,
      isEmpty,
    } = useWidget()

    expect(items.value).toEqual([])
    expect(currentItem.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(page.value).toBe(1)
    expect(itemsPerPage.value).toBe(10)
    expect(total.value).toBe(0)
    expect(totalPages.value).toBe(0)
    expect(hasItems.value).toBe(false)
    expect(isEmpty.value).toBe(true)
  })

  it('should expose widget store methods', () => {
    const {
      fetchWidgets,
      fetchAllWidgets,
      fetchWidget,
      createWidget,
      createWidgetFromType,
      updateWidget,
      deleteWidget,
      cloneWidget,
    } = useWidget()

    expect(typeof fetchWidgets).toBe('function')
    expect(typeof fetchAllWidgets).toBe('function')
    expect(typeof fetchWidget).toBe('function')
    expect(typeof createWidget).toBe('function')
    expect(typeof createWidgetFromType).toBe('function')
    expect(typeof updateWidget).toBe('function')
    expect(typeof deleteWidget).toBe('function')
    expect(typeof cloneWidget).toBe('function')
  })

  it('should expose pagination methods', () => {
    const { setPage, setItemsPerPage } = useWidget()

    expect(typeof setPage).toBe('function')
    expect(typeof setItemsPerPage).toBe('function')
  })

  it('should expose filter methods', () => {
    const { setFilters, clearFilters } = useWidget()

    expect(typeof setFilters).toBe('function')
    expect(typeof clearFilters).toBe('function')
  })

  it('should provide computed properties', () => {
    const { currentPage, perPage } = useWidget()

    expect(currentPage.value).toBe(1)
    expect(perPage.value).toBe(10)
  })

  it('should update page when setPage is called', () => {
    const { setPage, page } = useWidget()

    setPage(3)

    expect(page.value).toBe(3)
  })

  it('should update itemsPerPage when setItemsPerPage is called', () => {
    const { setItemsPerPage, itemsPerPage } = useWidget()

    setItemsPerPage(25)

    expect(itemsPerPage.value).toBe(25)
  })

  it('should set filters', () => {
    const { setFilters, filters } = useWidget()

    const newFilters = {
      type: WidgetTypeEnum.STAT,
      search: 'test',
    }

    setFilters(newFilters)

    expect(filters.value).toEqual(newFilters)
  })

  it('should clear filters', () => {
    const { setFilters, clearFilters, filters } = useWidget()

    setFilters({ type: WidgetTypeEnum.STAT })
    clearFilters()

    expect(filters.value).toEqual({})
  })

  it('should clear error', () => {
    const { clearError } = useWidget()

    expect(() => clearError()).not.toThrow()
  })

  it('should reset state', () => {
    const { reset } = useWidget()

    expect(() => reset()).not.toThrow()
  })
})
