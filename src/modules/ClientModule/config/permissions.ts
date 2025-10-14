/**
 * Client Module Permissions (ACL)
 *
 * Define all permissions needed for the Client module
 */

export interface ClientPermissions {

  // View permissions
  viewClients: string
  viewClientDetail: string

  // CRUD permissions
  createClient: string
  updateClient: string
  deleteClient: string

  // Status management permissions
  activateClient: string
  suspendClient: string
  deactivateClient: string
  blacklistClient: string

  // Special permissions
  viewCreditLimit: string
  updateCreditLimit: string
  exportClients: string
  viewStatusHistory: string

  // Contact management
  manageContacts: string
}

/**
 * Permission strings following the format: module:action:resource
 */
export const CLIENT_PERMISSIONS: ClientPermissions = {
  // View permissions
  viewClients: 'clients:view:list',
  viewClientDetail: 'clients:view:detail',

  // CRUD permissions
  createClient: 'clients:create:client',
  updateClient: 'clients:update:client',
  deleteClient: 'clients:delete:client',

  // Status management permissions
  activateClient: 'clients:activate:client',
  suspendClient: 'clients:suspend:client',
  deactivateClient: 'clients:deactivate:client',
  blacklistClient: 'clients:blacklist:client',

  // Special permissions
  viewCreditLimit: 'clients:view:credit_limit',
  updateCreditLimit: 'clients:update:credit_limit',
  exportClients: 'clients:export:data',
  viewStatusHistory: 'clients:view:history',

  // Contact management
  manageContacts: 'clients:manage:contacts',
}

/**
 * Permission groups for different roles
 */
export const CLIENT_PERMISSION_GROUPS = {
  // Admin has all permissions
  admin: Object.values(CLIENT_PERMISSIONS),

  // Manager can view, create, update (but not delete or blacklist)
  manager: [
    CLIENT_PERMISSIONS.viewClients,
    CLIENT_PERMISSIONS.viewClientDetail,
    CLIENT_PERMISSIONS.createClient,
    CLIENT_PERMISSIONS.updateClient,
    CLIENT_PERMISSIONS.activateClient,
    CLIENT_PERMISSIONS.suspendClient,
    CLIENT_PERMISSIONS.deactivateClient,
    CLIENT_PERMISSIONS.viewCreditLimit,
    CLIENT_PERMISSIONS.updateCreditLimit,
    CLIENT_PERMISSIONS.exportClients,
    CLIENT_PERMISSIONS.viewStatusHistory,
    CLIENT_PERMISSIONS.manageContacts,
  ],

  // Supervisor can view and update basic info (no credit limit changes)
  supervisor: [
    CLIENT_PERMISSIONS.viewClients,
    CLIENT_PERMISSIONS.viewClientDetail,
    CLIENT_PERMISSIONS.updateClient,
    CLIENT_PERMISSIONS.exportClients,
    CLIENT_PERMISSIONS.manageContacts,
  ],

  // Sales has full access except blacklist
  sales: [
    CLIENT_PERMISSIONS.viewClients,
    CLIENT_PERMISSIONS.viewClientDetail,
    CLIENT_PERMISSIONS.createClient,
    CLIENT_PERMISSIONS.updateClient,
    CLIENT_PERMISSIONS.activateClient,
    CLIENT_PERMISSIONS.suspendClient,
    CLIENT_PERMISSIONS.viewCreditLimit,
    CLIENT_PERMISSIONS.exportClients,
    CLIENT_PERMISSIONS.viewStatusHistory,
    CLIENT_PERMISSIONS.manageContacts,
  ],

  // Finance can manage credit limits
  finance: [
    CLIENT_PERMISSIONS.viewClients,
    CLIENT_PERMISSIONS.viewClientDetail,
    CLIENT_PERMISSIONS.updateClient,
    CLIENT_PERMISSIONS.viewCreditLimit,
    CLIENT_PERMISSIONS.updateCreditLimit,
    CLIENT_PERMISSIONS.exportClients,
    CLIENT_PERMISSIONS.viewStatusHistory,
  ],

  // Viewer can only view (read-only)
  viewer: [
    CLIENT_PERMISSIONS.viewClients,
    CLIENT_PERMISSIONS.viewClientDetail,
    CLIENT_PERMISSIONS.viewStatusHistory,
  ],
}

/**
 * Helper function to check if user has permission
 *
 * @example
 * if (can(CLIENT_PERMISSIONS.createClient)) {
 *   // Show create button
 * }
 */
export function can(permission: string): boolean {
  // This should integrate with your ACL system
  // For now, returning true as placeholder
  // TODO: Integrate with @casl/ability

  if (typeof window === 'undefined')
    return false

  // Example integration with CASL
  // const ability = useAbility()
  // return ability.can('create', 'Client')

  return true // Replace with actual ACL check
}

/**
 * Helper function to check multiple permissions (OR)
 */
export function canAny(...permissions: string[]): boolean {
  return permissions.some(permission => can(permission))
}

/**
 * Helper function to check multiple permissions (AND)
 */
export function canAll(...permissions: string[]): boolean {
  return permissions.every(permission => can(permission))
}

/**
 * Vue directive for permission checking
 *
 * Usage in template:
 * v-can="CLIENT_PERMISSIONS.createClient"
 * v-can:any="[PERMISSIONS.create, PERMISSIONS.update]"
 * v-can:all="[PERMISSIONS.view, PERMISSIONS.update]"
 */
export const vCan = {
  mounted(el: HTMLElement, binding: any) {
    const { value, arg } = binding

    let hasPermission = false

    if (arg === 'any')
      hasPermission = canAny(...(Array.isArray(value) ? value : [value]))

    else if (arg === 'all')
      hasPermission = canAll(...(Array.isArray(value) ? value : [value]))

    else
      hasPermission = can(value)

    if (!hasPermission) {
      // Remove element if no permission
      el.style.display = 'none'

      // Or completely remove from DOM
      // el.parentNode?.removeChild(el)
    }
  },
}

/**
 * Composable for permission checking in Vue components
 */
export function useClientPermissions() {
  return {
    permissions: CLIENT_PERMISSIONS,
    permissionGroups: CLIENT_PERMISSION_GROUPS,
    can,
    canAny,
    canAll,
  }
}
