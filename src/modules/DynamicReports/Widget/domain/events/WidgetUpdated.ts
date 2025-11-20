import type { Widget } from '../entities/Widget'
import type { DomainEvent } from '../../../shared/domain/events/DomainEvent'

export class WidgetUpdated implements DomainEvent {
  public dateTimeOccurred: Date
  public widget: Widget

  constructor(widget: Widget) {
    this.dateTimeOccurred = new Date()
    this.widget = widget
  }

  getAggregateId(): string {
    return this.widget.id.toString()
  }
}
