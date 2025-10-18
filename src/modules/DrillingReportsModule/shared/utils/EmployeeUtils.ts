import type { Employee } from '../../domain/entities/EmployeeEntity'
import { EMPLOYEE_CERTIFICATIONS, EMPLOYEE_DEPARTMENTS, EMPLOYEE_EXPERIENCE_LEVELS, EMPLOYEE_METRICS, EMPLOYEE_POSITIONS, EMPLOYEE_SHIFT_TYPES, EMPLOYEE_SKILLS, EMPLOYEE_STATUS } from '../constants/EmployeeConstants'

export function getEmployeeStatusLabel(status: string): string {
  return EMPLOYEE_STATUS.find(s => s.value === status)?.label || status
}

export function getEmployeeStatusColor(status: string): string {
  return EMPLOYEE_STATUS.find(s => s.value === status)?.color || '#6B7280'
}

export function getEmployeeStatusBgColor(status: string): string {
  return EMPLOYEE_STATUS.find(s => s.value === status)?.bgColor || '#F3F4F6'
}

export function getEmployeeStatusIcon(status: string): string {
  return EMPLOYEE_STATUS.find(s => s.value === status)?.icon || '❓'
}

export function getEmployeePositionLabel(position: string): string {
  return EMPLOYEE_POSITIONS.find(p => p.value === position)?.label || position
}

export function getEmployeePositionIcon(position: string): string {
  return EMPLOYEE_POSITIONS.find(p => p.value === position)?.icon || '❓'
}

export function getEmployeePositionDepartment(position: string): string {
  return EMPLOYEE_POSITIONS.find(p => p.value === position)?.department || 'misc'
}

export function getEmployeeDepartmentLabel(department: string): string {
  return EMPLOYEE_DEPARTMENTS.find(d => d.value === department)?.label || department
}

export function getEmployeeDepartmentIcon(department: string): string {
  return EMPLOYEE_DEPARTMENTS.find(d => d.value === department)?.icon || '❓'
}

export function getEmployeeDepartmentColor(department: string): string {
  return EMPLOYEE_DEPARTMENTS.find(d => d.value === department)?.color || '#6B7280'
}

export function getEmployeeSkillLabel(skill: string): string {
  return EMPLOYEE_SKILLS.find(s => s.value === skill)?.label || skill
}

export function getEmployeeSkillIcon(skill: string): string {
  return EMPLOYEE_SKILLS.find(s => s.value === skill)?.icon || '❓'
}

export function getEmployeeSkillCategory(skill: string): string {
  return EMPLOYEE_SKILLS.find(s => s.value === skill)?.category || 'misc'
}

export function getEmployeeCertificationLabel(certification: string): string {
  return EMPLOYEE_CERTIFICATIONS.find(c => c.value === certification)?.label || certification
}

export function getEmployeeCertificationIcon(certification: string): string {
  return EMPLOYEE_CERTIFICATIONS.find(c => c.value === certification)?.icon || '❓'
}

export function getEmployeeCertificationCategory(certification: string): string {
  return EMPLOYEE_CERTIFICATIONS.find(c => c.value === certification)?.category || 'misc'
}

export function getEmployeeExperienceLevelLabel(level: string): string {
  return EMPLOYEE_EXPERIENCE_LEVELS.find(l => l.value === level)?.label || level
}

export function getEmployeeExperienceLevelColor(level: string): string {
  return EMPLOYEE_EXPERIENCE_LEVELS.find(l => l.value === level)?.color || '#6B7280'
}

export function getEmployeeExperienceLevelIcon(level: string): string {
  return EMPLOYEE_EXPERIENCE_LEVELS.find(l => l.value === level)?.icon || '❓'
}

export function getEmployeeShiftTypeLabel(shift: string): string {
  return EMPLOYEE_SHIFT_TYPES.find(s => s.value === shift)?.label || shift
}

export function getEmployeeShiftTypeIcon(shift: string): string {
  return EMPLOYEE_SHIFT_TYPES.find(s => s.value === shift)?.icon || '❓'
}

export function getEmployeeShiftTypeColor(shift: string): string {
  return EMPLOYEE_SHIFT_TYPES.find(s => s.value === shift)?.color || '#6B7280'
}

export function getEmployeeAgeRange(age: number): string {
  const range = EMPLOYEE_METRICS.AGE_RANGES.find(r => age >= r.min && age < r.max)

  return range?.label || 'No especificado'
}

export function getEmployeeSalaryRange(salary: number): string {
  const range = EMPLOYEE_METRICS.SALARY_RANGES.find(r => salary >= r.min && salary < r.max)

  return range?.label || 'No especificado'
}

export function calculateEmployeeAge(employee: Employee): number {
  if (!employee.hire_date)
    return 0

  const hireDate = new Date(employee.hire_date)
  const now = new Date()

  return Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
}

export function calculateEmployeeExperience(employee: Employee): number {
  if (!employee.hire_date)
    return 0

  const hireDate = new Date(employee.hire_date)
  const now = new Date()

  return Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
}

export function isEmployeeActive(employee: Employee): boolean {
  return employee.status === 'active'
}

export function isEmployeeInactive(employee: Employee): boolean {
  return employee.status === 'inactive'
}

export function isEmployeeTerminated(employee: Employee): boolean {
  return employee.status === 'terminated'
}

export function getEmployeeFullName(employee: Employee): string {
  return `${employee.first_name} ${employee.last_name}`
}

export function getEmployeeInitials(employee: Employee): string {
  return `${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}`.toUpperCase()
}

export function getEmployeeDisplayName(employee: Employee): string {
  return `${employee.first_name} ${employee.last_name} (${employee.employee_number})`
}

export function formatEmployeeSalary(salary: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(salary)
}

export function getEmployeeStatusBadgeClass(status: string): string {
  const statusConfig = EMPLOYEE_STATUS.find(s => s.value === status)
  if (!statusConfig)
    return 'bg-gray-100 text-gray-800'

  const colorMap: Record<string, string> = {
    '#10B981': 'bg-green-100 text-green-800',
    '#6B7280': 'bg-gray-100 text-gray-800',
    '#EF4444': 'bg-red-100 text-red-800',
  }

  return colorMap[statusConfig.color] || 'bg-gray-100 text-gray-800'
}

export function getEmployeeDepartmentBadgeClass(department: string): string {
  const departmentConfig = EMPLOYEE_DEPARTMENTS.find(d => d.value === department)
  if (!departmentConfig)
    return 'bg-gray-100 text-gray-800'

  const colorMap: Record<string, string> = {
    '#3B82F6': 'bg-blue-100 text-blue-800',
    '#8B5CF6': 'bg-purple-100 text-purple-800',
    '#10B981': 'bg-green-100 text-green-800',
    '#F59E0B': 'bg-yellow-100 text-yellow-800',
    '#EF4444': 'bg-red-100 text-red-800',
    '#6B7280': 'bg-gray-100 text-gray-800',
  }

  return colorMap[departmentConfig.color] || 'bg-gray-100 text-gray-800'
}

export function sortEmployeesByStatus(employees: Employee[]): Employee[] {
  const statusOrder = ['active', 'inactive', 'terminated']

  return employees.sort((a, b) => {
    const aIndex = statusOrder.indexOf(a.status)
    const bIndex = statusOrder.indexOf(b.status)

    if (aIndex === -1 && bIndex === -1)
      return 0
    if (aIndex === -1)
      return 1
    if (bIndex === -1)
      return -1

    return aIndex - bIndex
  })
}

export function sortEmployeesByDepartment(employees: Employee[]): Employee[] {
  const departmentOrder = ['management', 'operations', 'engineering', 'safety', 'geology', 'technical', 'quality', 'maintenance']

  return employees.sort((a, b) => {
    const aIndex = departmentOrder.indexOf(a.department)
    const bIndex = departmentOrder.indexOf(b.department)

    if (aIndex === -1 && bIndex === -1)
      return 0
    if (aIndex === -1)
      return 1
    if (bIndex === -1)
      return -1

    return aIndex - bIndex
  })
}

export function filterEmployeesByStatus(employees: Employee[], status: string): Employee[] {
  return employees.filter(employee => employee.status === status)
}

export function filterEmployeesByDepartment(employees: Employee[], department: string): Employee[] {
  return employees.filter(employee => employee.department === department)
}

export function filterEmployeesByPosition(employees: Employee[], position: string): Employee[] {
  return employees.filter(employee => employee.position === position)
}

export function searchEmployees(employees: Employee[], query: string): Employee[] {
  if (!query.trim())
    return employees

  const lowercaseQuery = query.toLowerCase()

  return employees.filter(employee =>
    employee.first_name.toLowerCase().includes(lowercaseQuery)
    || employee.last_name.toLowerCase().includes(lowercaseQuery)
    || employee.employee_number.toLowerCase().includes(lowercaseQuery)
    || employee.email.toLowerCase().includes(lowercaseQuery)
    || employee.position.toLowerCase().includes(lowercaseQuery)
    || employee.department.toLowerCase().includes(lowercaseQuery),
  )
}
