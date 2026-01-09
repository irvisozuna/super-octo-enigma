/**
 * Contract Module Permissions
 */

export const CONTRACT_PERMISSIONS = {
  READ: 'contracts.read',
  CREATE: 'contracts.create',
  UPDATE: 'contracts.update',
  DELETE: 'contracts.delete',
  EXPORT: 'contracts.export',
}

export const CONTRACT_PERMISSION_GROUPS = [
  {
    name: 'Contracts Management',
    permissions: Object.values(CONTRACT_PERMISSIONS),
  },
]
