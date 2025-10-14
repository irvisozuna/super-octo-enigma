/**
 * Employee Module Permissions (ACL)
 *
 * Define all permissions needed for the Employee module
 */

export interface EmployeePermissions {

  // View permissions
  viewEmployees: string
  viewEmployeeDetail: string

  // CRUD permissions
  createEmployee: string
  updateEmployee: string
  deleteEmployee: string

  // Status management permissions
  suspendEmployee: string
  reactivateEmployee: string
  terminateEmployee: string

  // Special permissions
  viewSalaries: string
  updateSalaries: string
  exportEmployees: string
  viewEmploymentHistory: string

  // Skills & Certifications
  manageSkills: string
  manageCertifications: string
}

/**
 * Permission strings following the format: module:action:resource
 */
export const EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  // View permissions
  viewEmployees: 'employees:view:list',
  viewEmployeeDetail: 'employees:view:detail',

  // CRUD permissions
  createEmployee: 'employees:create:employee',
  updateEmployee: 'employees:update:employee',
  deleteEmployee: 'employees:delete:employee',

  // Status management permissions
  suspendEmployee: 'employees:suspend:employee',
  reactivateEmployee: 'employees:reactivate:employee',
  terminateEmployee: 'employees:terminate:employee',

  // Special permissions
  viewSalaries: 'employees:view:salaries',
  updateSalaries: 'employees:update:salaries',
  exportEmployees: 'employees:export:data',
  viewEmploymentHistory: 'employees:view:history',

  // Skills & Certifications
  manageSkills: 'employees:manage:skills',
  manageCertifications: 'employees:manage:certifications',
}

/**
 * Permission groups for different roles
 */
export const EMPLOYEE_PERMISSION_GROUPS = {
  // Admin has all permissions
  admin: Object.values(EMPLOYEE_PERMISSIONS),

  // Manager can view, create, update (but not delete or terminate)
  manager: [
    EMPLOYEE_PERMISSIONS.viewEmployees,
    EMPLOYEE_PERMISSIONS.viewEmployeeDetail,
    EMPLOYEE_PERMISSIONS.createEmployee,
    EMPLOYEE_PERMISSIONS.updateEmployee,
    EMPLOYEE_PERMISSIONS.suspendEmployee,
    EMPLOYEE_PERMISSIONS.reactivateEmployee,
    EMPLOYEE_PERMISSIONS.viewSalaries,
    EMPLOYEE_PERMISSIONS.exportEmployees,
    EMPLOYEE_PERMISSIONS.viewEmploymentHistory,
    EMPLOYEE_PERMISSIONS.manageSkills,
    EMPLOYEE_PERMISSIONS.manageCertifications,
  ],

  // Supervisor can view and update basic info (no salaries)
  supervisor: [
    EMPLOYEE_PERMISSIONS.viewEmployees,
    EMPLOYEE_PERMISSIONS.viewEmployeeDetail,
    EMPLOYEE_PERMISSIONS.updateEmployee,
    EMPLOYEE_PERMISSIONS.exportEmployees,
    EMPLOYEE_PERMISSIONS.manageSkills,
  ],

  // HR has full access except terminate
  hr: [
    EMPLOYEE_PERMISSIONS.viewEmployees,
    EMPLOYEE_PERMISSIONS.viewEmployeeDetail,
    EMPLOYEE_PERMISSIONS.createEmployee,
    EMPLOYEE_PERMISSIONS.updateEmployee,
    EMPLOYEE_PERMISSIONS.suspendEmployee,
    EMPLOYEE_PERMISSIONS.reactivateEmployee,
    EMPLOYEE_PERMISSIONS.viewSalaries,
    EMPLOYEE_PERMISSIONS.updateSalaries,
    EMPLOYEE_PERMISSIONS.exportEmployees,
    EMPLOYEE_PERMISSIONS.viewEmploymentHistory,
    EMPLOYEE_PERMISSIONS.manageSkills,
    EMPLOYEE_PERMISSIONS.manageCertifications,
  ],

  // Viewer can only view (read-only)
  viewer: [
    EMPLOYEE_PERMISSIONS.viewEmployees,
    EMPLOYEE_PERMISSIONS.viewEmployeeDetail,
    EMPLOYEE_PERMISSIONS.viewEmploymentHistory,
  ],
}

/**
 * Helper function to check if user has permission
 *
 * @example
 * if (can(EMPLOYEE_PERMISSIONS.createEmployee)) {
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
  // return ability.can('create', 'Employee')

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
 * v-can="EMPLOYEE_PERMISSIONS.createEmployee"
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
export function useEmployeePermissions() {
  return {
    permissions: EMPLOYEE_PERMISSIONS,
    permissionGroups: EMPLOYEE_PERMISSION_GROUPS,
    can,
    canAny,
    canAll,
  }
}
