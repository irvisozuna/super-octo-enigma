import type { ConcessionHolderDetailDto, ConcessionHolderUpdateDto } from '../../application/dtos/ConcessionHolderDtos'

export interface ConcessionHolderRepository {
  findById(id: string): Promise<ConcessionHolderDetailDto>
  update(id: string, data: ConcessionHolderUpdateDto): Promise<ConcessionHolderDetailDto>
}
