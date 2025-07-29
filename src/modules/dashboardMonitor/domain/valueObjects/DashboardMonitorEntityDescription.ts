export class DashboardMonitorEntityDescription {
  constructor(private readonly value: string) {
    this.validate(value)
  }

  private validate(value: string): void {
    if (!value) {
      throw new Error('DashboardMonitorEntityDescription cannot be empty')
    }
    // Add specific validation logic here
  }

  getValue(): string {
    return this.value
  }

  equals(other: DashboardMonitorEntityDescription): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value.toString()
  }
}