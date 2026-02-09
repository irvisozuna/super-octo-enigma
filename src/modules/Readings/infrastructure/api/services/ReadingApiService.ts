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

  async getWorkersCatalog() {
    return await rawApi(this.getCatalogRootUrl('/workers'), {
      method: 'GET',
    })
  }

  async getAdvanceCatalogs() {
    const [sectors, routes, workers] = await Promise.all([
      this.getSectorsCatalog().catch(() => []),
      this.getRoutesCatalog().catch(() => []),
      this.getWorkersCatalog().catch(() => []),
    ])

    return {
      sectors,
      routes,
      workers,
    }
  }

  async getDownloadedRoutes(externalPeriodId?: string | null, filters: ReadingFilter = {}) {
    return await rawApi(`${this.baseUrl}/downloaded-routes`, {
      method: 'GET',
      params: {
        ...(externalPeriodId ? { external_period_id: externalPeriodId } : {}),
        ...filters,
      },
    })
  }

  async getMetrics(externalPeriodId: string, filters: ReadingFilter = {}) {
    return await rawApi(`${this.baseUrl}/metrics`, {
      method: 'GET',
      params: {
        external_period_id: externalPeriodId,
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

  async getReadingView(readingId: string | number) {
    return await rawApi(`${this.baseUrl}/view/${readingId}`, {
      method: 'GET',
    })
  }

  async getPhotos(readingId: string) {
    return await rawApi(`${this.baseUrl}/${readingId}/photos`, {
      method: 'GET',
    })
  }
}
