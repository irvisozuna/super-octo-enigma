import { defineStore } from 'pinia'
import type { ReadingsReportAdvanceCard, ReadingsReportAdvanceGlobal } from '../../domain/value-objects/ReadingsReportAdvance'
import type { ReadingsReportEntity } from '../../domain/entities/ReadingsReportEntity'
import type { ReadingsReportFilters } from '../../domain/value-objects/ReadingsReportFilters'
import { readingsReportContainer } from '../../config/container.ts'

const service = readingsReportContainer.applicationService

export const useReadingsReportStore = defineStore('readingsReport', {
  state: () => ({
    list: [] as ReadingsReportEntity[],
    total: 0,
    page: 1,
    itemsPerPage: 15,
    isLoading: false,
    isAdvanceLoading: false,
    filters: {
      search: '',
      contract_id: null,
      customer_id: null,
      period_id: null,
      sector_id: null,
      route_id: null,
      status: null,
      from: null,
      to: null,
    } as ReadingsReportFilters,
    sortBy: ['id'] as string[],
    sortDesc: [true] as boolean[],
    selectedItems: [] as ReadingsReportEntity[],
    advanceCards: [] as ReadingsReportAdvanceCard[],
    advanceGlobal: {
      title: '',
      subtitle: '',
      readsSummary: '',
      volumeSummary: '',
      progress: 0,
    } as ReadingsReportAdvanceGlobal,
  }),

  actions: {
    // Se deja fetchList para otros usos, pero la vista de avance usa fetchAdvance
    async fetchList() {
      this.isLoading = true
      try {
        const { data, meta } = await service.getList({
          page: this.page,
          perPage: this.itemsPerPage,
          sortBy: this.sortBy[0] || 'id',
          sortDesc: this.sortDesc[0] ?? true,
          filters: { ...this.filters },
        })

        this.list = data
        this.total = meta.total
      }
      finally {
        this.isLoading = false
      }
    },

    async fetchRoutesProgress() {
      this.isLoading = true
      try {
        const { data, meta } = await service.getRoutesProgress({
          page: this.page,
          perPage: this.itemsPerPage,
          sortBy: this.sortBy[0] || 'id',
          sortDesc: this.sortDesc[0] ?? true,
          filters: { ...this.filters },
        })

        this.list = data as any[]
        this.total = meta.total
      }
      finally {
        this.isLoading = false
      }
    },

    async fetchAdvance() {
      this.isAdvanceLoading = true
      try {
        const { cards, global, data, meta } = await service.getAdvance({
          page: this.page,
          perPage: this.itemsPerPage,
          sortBy: this.sortBy[0] || 'id',
          sortDesc: this.sortDesc[0] ?? true,
          filters: { ...this.filters },
        })

        this.advanceCards = cards
        this.advanceGlobal = global

        if (Array.isArray(data)) {
          this.list = data as any[]
          this.total = meta?.total ?? data.length ?? this.total
        }
      }
      finally {
        this.isAdvanceLoading = false
      }
    },

    async exportItems(type: 'excel' | 'pdf') {
      const blob = await service.exportList(type, {
        page: this.page,
        perPage: this.itemsPerPage,
        sortBy: this.sortBy[0] || 'id',
        sortDesc: this.sortDesc[0] ?? true,
        filters: { ...this.filters },
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `reporte-lecturas.${type === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    },

    async ensureActivePeriod() {
      if (this.filters.period_id)
        return this.filters.period_id

      const period = await service.getActivePeriod()

      if (period?.id)
        this.filters.period_id = period.id

      return this.filters.period_id
    },
  },
})
