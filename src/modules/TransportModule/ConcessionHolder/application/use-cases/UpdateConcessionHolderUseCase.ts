import type { ConcessionHolderDetailDto, ConcessionHolderUpdateDto } from '../dtos/ConcessionHolderDtos'
import type { ConcessionHolderRepository } from '../../domain/repositories/ConcessionHolderRepository'

export class UpdateConcessionHolderUseCase {
  constructor(private readonly repository: ConcessionHolderRepository) {}

  async execute(id: string, data: ConcessionHolderUpdateDto): Promise<ConcessionHolderDetailDto> {
    return await this.repository.update(id, data)
  }
}
