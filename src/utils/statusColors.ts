// src/utils/statusColors.ts

export function resolveStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'secondary'
    case 'pending':
      return 'warning'
    default:
      return 'primary'
  }
}
