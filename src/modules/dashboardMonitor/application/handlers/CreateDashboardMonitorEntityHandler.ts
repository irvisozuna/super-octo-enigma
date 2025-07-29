import { CreateDashboardMonitorEntityCommand } from '../commands/CreateDashboardMonitorEntityCommand'
import { CreateDashboardMonitorEntityUseCase } from '../useCases/CreateDashboardMonitorEntityUseCase'

export class CreateDashboardMonitorEntityHandler {
  constructor(private useCase: CreateDashboardMonitorEntityUseCase) {}

  async handle(command: CreateDashboardMonitorEntityCommand): Promise<any> {
    
    return await this.useCase.execute(command.data)
    
  }
}