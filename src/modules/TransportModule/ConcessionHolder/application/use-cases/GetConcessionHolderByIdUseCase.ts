import type { ConcessionHolderDetailDto } from '../dtos/ConcessionHolderDtos'
import type { ConcessionHolderRepository } from '../../domain/repositories/ConcessionHolderRepository'

export class GetConcessionHolderByIdUseCase {
  constructor(private readonly repository: ConcessionHolderRepository) {}

  async execute(id: string): Promise<ConcessionHolderDetailDto> {
    return await this.repository.findById(id)
  }
}
