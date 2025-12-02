import { defineStore } from 'pinia'
import type { ReadingsReport } from '../types/ReadingsReport'
import {
  type ReadingsReportFilters,
  exportReadingsReport,
  fetchReadingsReportList,
} from '../Infrastructure/api/ReadingsReportApi'

export const useReadingsReportStore = defineStore('readingsReport', {
  state: () => ({
    list: [] as ReadingsReport[],
    total: 0,
    page: 1,
    itemsPerPage: 15,
    isLoading: false,
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
    selectedItems: [] as ReadingsReport[],
  }),

  actions: {
    async fetchList() {
      this.isLoading = true
      try {
        const { data, meta } = await fetchReadingsReportList({
          page: this.page,
          per_page: this.itemsPerPage,
          sort_by: this.sortBy[0] || 'id',
          sort_desc: this.sortDesc[0] ? 1 : 0,
          ...this.filters,
        })

        this.list = data
        this.total = meta.total
      }
      finally {
        this.isLoading = false
      }
    },

    async exportItems(type: 'excel' | 'pdf') {
      const blob = await exportReadingsReport(type, {
        page: this.page,
        per_page: this.itemsPerPage,
        sort_by: this.sortBy[0] || 'id',
        sort_desc: this.sortDesc[0] ? 1 : 0,
        ...this.filters,
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `reporte-lecturas.${type === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    },
  },
})
