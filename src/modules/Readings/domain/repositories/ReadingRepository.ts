import type { ReadingEntity } from '../entities/ReadingEntity'

export interface ReadingListResponse {
  data: ReadingEntity[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}

export interface ReadingRepository {
  getList(params?: Record<string, any>): Promise<ReadingListResponse | ReadingEntity[] | any>
}
