import type { Dashboard } from '../entities/Dashboard'
import type { DomainEvent } from '../../../shared/domain/events/DomainEvent'

export class DashboardCreated implements DomainEvent {
  public dateTimeOccurred: Date
  public dashboard: Dashboard

  constructor(dashboard: Dashboard) {
    this.dateTimeOccurred = new Date()
    this.dashboard = dashboard
  }

  getAggregateId(): string {
    return this.dashboard.id.toString()
  }
}
