import type { WellRepository } from '../../../domain/repositories/WellRepository'
import type { Well, WellCreateRequest, WellListResponse, WellUpdateRequest } from '../../../domain/entities/WellEntity'
import type { WellApiService } from '../../api/services/WellApiService'

export class WellRepositoryImpl implements WellRepository {
  constructor(private wellApiService: WellApiService) {}

  async getAll(params?: any): Promise<WellListResponse> {
    return await this.wellApiService.getWells(params)
  }

  async getById(id: string): Promise<Well> {
    return await this.wellApiService.getWellById(id)
  }

  async create(well: WellCreateRequest): Promise<Well> {
    return await this.wellApiService.createWell(well)
  }

  async update(id: string, well: WellUpdateRequest): Promise<Well> {
    return await this.wellApiService.updateWell(id, well)
  }

  async delete(id: string): Promise<void> {
    return await this.wellApiService.deleteWell(id)
  }

  async getByProject(projectId: string, params?: any): Promise<WellListResponse> {
    return await this.wellApiService.getWellsByProject(projectId, params)
  }
}
