/**
 * Contract Module Permissions (ACL)
 */

export interface ContractPermissions {
  viewContracts: string
  viewContractDetail: string
  createContract: string
  updateContract: string
  deleteContract: string
  exportContracts: string
}

/**
 * Permission strings following the format: module:action:resource
 */
export const CONTRACT_PERMISSIONS: ContractPermissions = {
  viewContracts: 'contracts:view:list',
  viewContractDetail: 'contracts:view:detail',
  createContract: 'contracts:create:contract',
  updateContract: 'contracts:update:contract',
  deleteContract: 'contracts:delete:contract',
  exportContracts: 'contracts:export:data',
}

/**
 * Permission groups for different roles
 */
export const CONTRACT_PERMISSION_GROUPS = {
  admin: Object.values(CONTRACT_PERMISSIONS),
  supervisor: [
    CONTRACT_PERMISSIONS.viewContracts,
    CONTRACT_PERMISSIONS.viewContractDetail,
    CONTRACT_PERMISSIONS.exportContracts,
  ],
  viewer: [
    CONTRACT_PERMISSIONS.viewContracts,
    CONTRACT_PERMISSIONS.viewContractDetail,
  ],
}
