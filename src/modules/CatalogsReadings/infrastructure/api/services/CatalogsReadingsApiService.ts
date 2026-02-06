import { rawApi } from '@/services/api'

export class CatalogsReadingsApiService {
  private readonly baseUrl = '/catalogs-readings'

  async getCatalog(name: string, params: Record<string, any> = {}) {
    return await rawApi(`${this.baseUrl}/${name}`, {
      method: 'GET',
      params,
    })
  }
}
