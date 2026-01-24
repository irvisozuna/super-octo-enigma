import type { ReadingFilter } from '../../../application/dtos/ReadingDtos'
import { rawApi } from '@/services/api'

export class ReadingApiService {
  private readonly baseUrl = '/readings'
  private readonly catalogBaseUrl = '/catalogs-readings/periods'
  private readonly catalogRootUrl = '/catalogs-readings'

  private getCatalogUrl(path = '') {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL
    const prefix = baseUrl ? '' : '/api'

    return `${prefix}${this.catalogBaseUrl}${path}`
  }

  private getCatalogRootUrl(path = '') {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL
    const prefix = baseUrl ? '' : '/api'

    return `${prefix}${this.catalogRootUrl}${path}`
  }

  async getList(filters: ReadingFilter = {}) {
    return await rawApi(this.baseUrl, {
      method: 'GET',
      params: filters,
    })
  }

  async getPeriods() {
    return await rawApi(this.getCatalogUrl(), {
      method: 'GET',
    })
  }

  async getPeriodById(id: string) {
    return await rawApi(this.getCatalogUrl(`/${id}`), {
      method: 'GET',
    })
  }

  async getSectorsCatalog() {
    return await rawApi(this.getCatalogRootUrl('/sectors'), {
      method: 'GET',
    })
  }

  async getRoutesCatalog() {
    return await rawApi(this.getCatalogRootUrl('/routes'), {
      method: 'GET',
    })
  }

  async getReadersCatalog() {
    return await rawApi(this.getCatalogRootUrl('/readers'), {
      method: 'GET',
    })
  }

  async getAdvanceCatalogs() {
    const [sectors, routes, readers] = await Promise.all([
      this.getSectorsCatalog().catch(() => []),
      this.getRoutesCatalog().catch(() => []),
      this.getReadersCatalog().catch(() => []),
    ])

    return {
      sectors,
      routes,
      readers,
    }
  }

  async getDownloadedRoutes(periodId?: string | null, filters: ReadingFilter = {}) {
    return await rawApi(`${this.baseUrl}/downloaded-routes`, {
      method: 'GET',
      params: {
        ...(periodId ? { period_id: periodId } : {}),
        ...filters,
      },
    })
  }

  async getMetrics(periodId: string, filters: ReadingFilter = {}) {
    return await rawApi(`${this.baseUrl}/metrics`, {
      method: 'GET',
      params: {
        period_id: periodId,
        ...filters,
      },
    })
  }

  async getDetails(readingId: string, filters: ReadingFilter = {}) {
    return await rawApi(`${this.baseUrl}/${readingId}/details`, {
      method: 'GET',
      params: filters,
    })
  }

  async getPhotos(readingId: string) {
    return await rawApi(`${this.baseUrl}/${readingId}/photos`, {
      method: 'GET',
    })
  }
}
