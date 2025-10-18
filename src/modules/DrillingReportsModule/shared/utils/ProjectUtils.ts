import type { Project } from '../../domain/entities/ProjectEntity'
import { PROJECT_METRICS, PROJECT_PHASES, PROJECT_PRIORITY, PROJECT_STATUS, PROJECT_TYPES } from '../constants/ProjectConstants'

export function getProjectStatusLabel(status: string): string {
  return PROJECT_STATUS.find(s => s.value === status)?.label || status
}

export function getProjectStatusColor(status: string): string {
  return PROJECT_STATUS.find(s => s.value === status)?.color || '#6B7280'
}

export function getProjectStatusBgColor(status: string): string {
  return PROJECT_STATUS.find(s => s.value === status)?.bgColor || '#F3F4F6'
}

export function getProjectStatusIcon(status: string): string {
  return PROJECT_STATUS.find(s => s.value === status)?.icon || '❓'
}

export function getProjectPriorityLabel(priority: string): string {
  return PROJECT_PRIORITY.find(p => p.value === priority)?.label || priority
}

export function getProjectPriorityColor(priority: string): string {
  return PROJECT_PRIORITY.find(p => p.value === priority)?.color || '#6B7280'
}

export function getProjectTypeLabel(type: string): string {
  return PROJECT_TYPES.find(t => t.value === type)?.label || type
}

export function getProjectPhaseLabel(phase: string): string {
  return PROJECT_PHASES.find(p => p.value === phase)?.label || phase
}

export function getProjectPhaseIcon(phase: string): string {
  return PROJECT_PHASES.find(p => p.value === phase)?.icon || '❓'
}

export function calculateProjectProgress(project: Project): number {
  if (!project.start_date || !project.end_date)
    return 0

  const start = new Date(project.start_date)
  const end = new Date(project.end_date)
  const now = new Date()

  if (now < start)
    return 0
  if (now > end)
    return 100

  const totalDuration = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()

  return Math.round((elapsed / totalDuration) * 100)
}

export function getProjectDuration(project: Project): number {
  if (!project.start_date || !project.end_date)
    return 0

  const start = new Date(project.start_date)
  const end = new Date(project.end_date)

  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function isProjectOverdue(project: Project): boolean {
  if (!project.end_date)
    return false

  const endDate = new Date(project.end_date)
  const now = new Date()

  return now > endDate && project.status !== 'completed'
}

export function getProjectBudgetRange(budget: number): string {
  const range = PROJECT_METRICS.BUDGET_RANGES.find(r => budget >= r.min && budget < r.max)

  return range?.label || 'No especificado'
}

export function getProjectDurationRange(duration: number): string {
  const range = PROJECT_METRICS.DURATION_RANGES.find(r => duration >= r.min && duration < r.max)

  return range?.label || 'No especificado'
}

export function formatProjectBudget(budget: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(budget)
}

export function getProjectStatusBadgeClass(status: string): string {
  const statusConfig = PROJECT_STATUS.find(s => s.value === status)
  if (!statusConfig)
    return 'bg-gray-100 text-gray-800'

  const colorMap: Record<string, string> = {
    '#10B981': 'bg-green-100 text-green-800',
    '#3B82F6': 'bg-blue-100 text-blue-800',
    '#EF4444': 'bg-red-100 text-red-800',
    '#F59E0B': 'bg-yellow-100 text-yellow-800',
  }

  return colorMap[statusConfig.color] || 'bg-gray-100 text-gray-800'
}

export function getProjectPriorityBadgeClass(priority: string): string {
  const priorityConfig = PROJECT_PRIORITY.find(p => p.value === priority)
  if (!priorityConfig)
    return 'bg-gray-100 text-gray-800'

  const colorMap: Record<string, string> = {
    '#6B7280': 'bg-gray-100 text-gray-800',
    '#F59E0B': 'bg-yellow-100 text-yellow-800',
    '#EF4444': 'bg-red-100 text-red-800',
    '#7C2D12': 'bg-red-200 text-red-900',
  }

  return colorMap[priorityConfig.color] || 'bg-gray-100 text-gray-800'
}

export function sortProjectsByStatus(projects: Project[]): Project[] {
  const statusOrder = ['active', 'on_hold', 'completed', 'cancelled']

  return projects.sort((a, b) => {
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

export function sortProjectsByPriority(projects: Project[]): Project[] {
  const priorityOrder = ['critical', 'high', 'medium', 'low']

  return projects.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.status)
    const bIndex = priorityOrder.indexOf(b.status)

    if (aIndex === -1 && bIndex === -1)
      return 0
    if (aIndex === -1)
      return 1
    if (bIndex === -1)
      return -1

    return aIndex - bIndex
  })
}

export function filterProjectsByStatus(projects: Project[], status: string): Project[] {
  return projects.filter(project => project.status === status)
}

export function filterProjectsByPriority(projects: Project[], priority: string): Project[] {
  return projects.filter(project => project.status === priority)
}

export function searchProjects(projects: Project[], query: string): Project[] {
  if (!query.trim())
    return projects

  const lowercaseQuery = query.toLowerCase()

  return projects.filter(project =>
    project.name.toLowerCase().includes(lowercaseQuery)
    || project.description.toLowerCase().includes(lowercaseQuery)
    || project.location.toLowerCase().includes(lowercaseQuery)
    || project.client_name.toLowerCase().includes(lowercaseQuery),
  )
}
