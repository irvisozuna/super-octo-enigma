export class DashboardMonitorEntityValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DashboardMonitorEntityValidationError'
  }

  static notFound(id: string): DashboardMonitorEntityValidationError {
    return new DashboardMonitorEntityValidationError(`DashboardMonitorEntity with id ${id} not found`)
  }

  static invalidData(reason: string): DashboardMonitorEntityValidationError {
    return new DashboardMonitorEntityValidationError(`Invalid DashboardMonitorEntity data: ${reason}`)
  }
}