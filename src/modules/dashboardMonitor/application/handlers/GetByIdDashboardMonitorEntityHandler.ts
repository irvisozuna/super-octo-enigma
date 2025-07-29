import { GetByIdDashboardMonitorEntityQuery } from '../querys/GetByIdDashboardMonitorEntityQuery'
import { GetByIdDashboardMonitorEntityUseCase } from '../useCases/GetByIdDashboardMonitorEntityUseCase'

export class GetByIdDashboardMonitorEntityHandler {
  constructor(private useCase: GetByIdDashboardMonitorEntityUseCase) {}

  async handle(query: GetByIdDashboardMonitorEntityQuery): Promise<any> {
    
    return await this.useCase.execute(query.id)
    
  }
}