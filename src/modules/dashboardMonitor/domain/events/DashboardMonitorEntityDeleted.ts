import { DomainEvent } from '@/shared/domain/DomainEvent'

export class DashboardMonitorEntityDeleted extends DomainEvent {
  constructor(
    public readonly dashboardmonitorentityId: string,
    public readonly dashboardmonitorentityData: any,
    occurredOn?: Date
  ) {
    super(dashboardmonitorentityId, occurredOn)
  }

  static eventName(): string {
    return 'dashboardmonitorentity.deleted'
  }
}