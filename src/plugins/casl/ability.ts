import { createMongoAbility } from '@casl/ability'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'suspend' | 'reactivate' | 'terminate' | 'approve' | 'reject' | 'cancel' | 'renew' | 'sign' | 'assign' | 'unassign' | 'inspect' | 'verify' | 'blacklist' | 'issue' | 'pay' | 'appeal' | 'process' | 'refund' | 'activate' | 'deactivate' | 'export' | 'import' | 'configure' | 'print' | 'schedule' | 'share' | 'view' | 'start' | 'complete' | 'abandon' | 'maintain' | 'retire' | 'upload' | 'download'

export type Subjects = 'Post' | 'Comment' | 'all' | 'Users' | 'Profile' | 'Rebilling' | 'Evidence' | 'Client' | 'ClientContact' | 'ClientCredit' | 'ClientFinancial' | 'Employee' | 'EmployeeCertification' | 'EmployeeSalary' | 'EmployeeSkill' | 'clientcontact' | 'clientcredit' | 'clientfinancial' | 'concession' | 'concessionholder' | 'employeesalary' | 'fine' | 'payment' | 'transportmanagement' | 'transportmodalities' | 'transportreport' | 'transportrestrictions' | 'transportstatuses' | 'vehicle' | 'violationtype' | 'clients' | 'User' | 'UserRoles' | 'UserPermissions' | 'Role' | 'RolePermissions' | 'Permission' | 'OwnProfile' | 'Project' | 'ProjectBudget' | 'ProjectPersonnel' | 'Well' | 'Tool' | 'Equipment' | 'DrillingReport' | 'OwnDrillingReport' | 'Document' | 'userroles' | 'userpermissions' | 'Contract' | 'Reading'

export interface Rule { action: Actions; subject: Subjects }

export const ability = createMongoAbility<[Actions, Subjects]>()
