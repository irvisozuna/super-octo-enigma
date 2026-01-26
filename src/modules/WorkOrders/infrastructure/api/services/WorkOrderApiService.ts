import { rawApi } from '@/services/api'

export class WorkOrderApiService {
  private readonly baseUrl = '/workorders'
  private readonly historyBaseUrl = '/workorder-histories'
  private readonly photosBaseUrl = '/workorder-photos'

  async getList(params: Record<string, any> = {}) {
    return await rawApi(this.baseUrl, {
      method: 'GET',
      params,
    })
  }

  async getById(id: string) {
    return await rawApi(`${this.baseUrl}/view/${id}`,
      {
        method: 'GET',
      },
    )
  }

  async add(payload: Record<string, any>) {
    return await rawApi(`${this.baseUrl}/add`, {
      method: 'POST',
      body: payload,
    })
  }

  async update(id: string, payload: Record<string, any>) {
    return await rawApi(`${this.baseUrl}/update/${id}`, {
      method: 'PUT',
      body: payload,
    })
  }

  async remove(id: string) {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  async getHistories(params: Record<string, any> = {}) {
    return await rawApi(this.historyBaseUrl, {
      method: 'GET',
      params,
    })
  }

  async addHistory(payload: Record<string, any>) {
    return await rawApi(`${this.historyBaseUrl}/add`, {
      method: 'POST',
      body: payload,
    })
  }

  async updateHistory(id: string, payload: Record<string, any>) {
    return await rawApi(`${this.historyBaseUrl}/update/${id}`, {
      method: 'PUT',
      body: payload,
    })
  }

  async removeHistory(id: string) {
    return await rawApi(`${this.historyBaseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  async getPhotos(params: Record<string, any> = {}) {
    return await rawApi(this.photosBaseUrl, {
      method: 'GET',
      params,
    })
  }

  async getWorkers(params: Record<string, any> = {}) {
    return await rawApi('/workorder-workers', {
      method: 'GET',
      params,
    })
  }

  async updateWorker(id: string | number, payload: Record<string, any>) {
    return await rawApi(`/workorder-workers/update/${id}`, {
      method: 'PUT',
      body: payload,
    })
  }

  async addPhoto(payload: Record<string, any>) {
    return await rawApi(`${this.photosBaseUrl}/add`, {
      method: 'POST',
      body: payload,
    })
  }

  async updatePhoto(id: string, payload: Record<string, any>) {
    return await rawApi(`${this.photosBaseUrl}/update/${id}`, {
      method: 'PUT',
      body: payload,
    })
  }

  async removePhoto(id: string) {
    return await rawApi(`${this.photosBaseUrl}/${id}`, {
      method: 'DELETE',
    })
  }
}
