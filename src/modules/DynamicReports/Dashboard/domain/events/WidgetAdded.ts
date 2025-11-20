import type { Dashboard } from '../entities/Dashboard'
import type { DomainEvent } from '../../../shared/domain/events/DomainEvent'
import type { WidgetInstanceConfig } from '../../../Widget/domain/types/WidgetTypes'

export class WidgetAdded implements DomainEvent {
  public dateTimeOccurred: Date
  public dashboard: Dashboard
  public widget: WidgetInstanceConfig

  constructor(dashboard: Dashboard, widget: WidgetInstanceConfig) {
    this.dateTimeOccurred = new Date()
    this.dashboard = dashboard
    this.widget = widget
  }

  getAggregateId(): string {
    return this.dashboard.id.toString()
  }
}
