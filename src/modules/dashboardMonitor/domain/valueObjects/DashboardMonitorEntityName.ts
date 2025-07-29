export class DashboardMonitorEntityName {
  constructor(private readonly value: string) {
    this.validate(value)
  }

  private validate(value: string): void {
    if (!value) {
      throw new Error('DashboardMonitorEntityName cannot be empty')
    }
    // Add specific validation logic here
  }

  getValue(): string {
    return this.value
  }

  equals(other: DashboardMonitorEntityName): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value.toString()
  }
}