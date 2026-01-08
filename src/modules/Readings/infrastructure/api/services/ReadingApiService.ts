import type { ReadingFilter } from '../../../application/dtos/ReadingDtos'
import { rawApi } from '@/services/api'

export class ReadingApiService {
  private readonly baseUrl = '/readings'
  private readonly catalogBaseUrl = '/catalogs-readings/periods'

  private getCatalogUrl(path = '') {
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL
    const prefix = baseUrl ? '' : '/api'

    return `${prefix}${this.catalogBaseUrl}${path}`
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

  async getDownloadedRoutes(periodId: string, filters: ReadingFilter = {}) {
    return await rawApi(`${this.baseUrl}/downloaded-routes`, {
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
