import { DeleteDashboardMonitorEntityCommand } from '../commands/DeleteDashboardMonitorEntityCommand'
import { DeleteDashboardMonitorEntityUseCase } from '../useCases/DeleteDashboardMonitorEntityUseCase'

export class DeleteDashboardMonitorEntityHandler {
  constructor(private useCase: DeleteDashboardMonitorEntityUseCase) {}

  async handle(command: DeleteDashboardMonitorEntityCommand): Promise<void> {
    
    return await this.useCase.execute(command.id)
    
  }
}