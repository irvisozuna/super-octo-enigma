import type { Well, WellCreateRequest, WellListResponse, WellUpdateRequest } from '../entities/WellEntity'

export interface WellRepository {
  getAll(params?: any): Promise<WellListResponse>
  getById(id: string): Promise<Well>
  create(well: WellCreateRequest): Promise<Well>
  update(id: string, well: WellUpdateRequest): Promise<Well>
  delete(id: string): Promise<void>
  getByProject(projectId: string, params?: any): Promise<WellListResponse>
}
