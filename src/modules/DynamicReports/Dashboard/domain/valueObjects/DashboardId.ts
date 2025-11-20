import { UniqueEntityID } from '../../../shared/domain/base/UniqueEntityID'

export class DashboardId extends UniqueEntityID {
  private constructor(id?: string) {
    super(id)
  }

  public static create(id?: string): DashboardId {
    return new DashboardId(id)
  }
}
