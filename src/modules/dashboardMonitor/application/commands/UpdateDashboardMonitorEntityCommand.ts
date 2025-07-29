export class UpdateDashboardMonitorEntityCommand {
  constructor(
    public readonly id: string, public readonly data: any
  ) {}
}