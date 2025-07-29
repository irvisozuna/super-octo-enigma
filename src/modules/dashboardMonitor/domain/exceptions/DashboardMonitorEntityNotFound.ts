export class DashboardMonitorEntityNotFound extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DashboardMonitorEntityNotFound'
  }

  static notFound(id: string): DashboardMonitorEntityNotFound {
    return new DashboardMonitorEntityNotFound(`DashboardMonitorEntity with id ${id} not found`)
  }

  static invalidData(reason: string): DashboardMonitorEntityNotFound {
    return new DashboardMonitorEntityNotFound(`Invalid DashboardMonitorEntity data: ${reason}`)
  }
}