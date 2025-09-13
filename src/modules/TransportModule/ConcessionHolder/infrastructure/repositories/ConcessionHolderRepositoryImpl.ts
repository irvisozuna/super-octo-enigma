import type { ConcessionHolderRepository } from '../../domain/repositories/ConcessionHolderRepository'
import type { ConcessionHolderDetailDto, ConcessionHolderUpdateDto } from '../../application/dtos/ConcessionHolderDtos'
import type { ConcessionHolderApiService } from '../api/services/ConcessionHolderApiService'

export class ConcessionHolderRepositoryImpl implements ConcessionHolderRepository {
  constructor(private readonly apiService: ConcessionHolderApiService) {}

  async findById(id: string): Promise<ConcessionHolderDetailDto> {
    return await this.apiService.getById(id)
  }

  async update(id: string, data: ConcessionHolderUpdateDto): Promise<ConcessionHolderDetailDto> {
    return await this.apiService.update(id, data)
  }
}
