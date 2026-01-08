import type { ReadingFilter } from '../../../application/dtos/ReadingDtos'
import type { ReadingRepository } from '../../../domain/repositories/ReadingRepository'
import { ReadingApiService } from '../../api/services/ReadingApiService'

export class ReadingRepositoryImpl implements ReadingRepository {
  private readonly apiService: ReadingApiService

  constructor(apiService?: ReadingApiService) {
    this.apiService = apiService ?? new ReadingApiService()
  }

  async getList(filters: ReadingFilter = {}) {
    return await this.apiService.getList(filters)
  }
}
