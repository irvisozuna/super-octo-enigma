import type { ReadingRepository } from '../../domain/repositories/ReadingRepository'
import type { ReadingFilter } from '../dtos/ReadingDtos'

export class ReadingApplicationService {
  constructor(private readonly repository: ReadingRepository) {}

  async getReadings(filters: ReadingFilter = {}) {
    return await this.repository.getList(filters)
  }
}
