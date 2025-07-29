import { GetListDashboardMonitorEntityQuery } from '../querys/GetListDashboardMonitorEntityQuery'
import { GetListDashboardMonitorEntityUseCase } from '../useCases/GetListDashboardMonitorEntityUseCase'

export class GetListDashboardMonitorEntityHandler {
  constructor(private useCase: GetListDashboardMonitorEntityUseCase) {}

  async handle(query: GetListDashboardMonitorEntityQuery): Promise<any[]> {
    
    return await this.useCase.execute()
    
  }
}