import { UniqueEntityID } from '../../../shared/domain/base/UniqueEntityID'

export class WidgetId extends UniqueEntityID {
  private constructor(id?: string) {
    super(id)
  }

  public static create(id?: string): WidgetId {
    return new WidgetId(id)
  }
}
