import { UpdateDashboardMonitorEntityCommand } from '../commands/UpdateDashboardMonitorEntityCommand'
import { UpdateDashboardMonitorEntityUseCase } from '../useCases/UpdateDashboardMonitorEntityUseCase'

export class UpdateDashboardMonitorEntityHandler {
  constructor(private useCase: UpdateDashboardMonitorEntityUseCase) {}

  async handle(command: UpdateDashboardMonitorEntityCommand): Promise<any> {
    
    return await this.useCase.execute(command.id, command.data)
    
  }
}