import type { Document } from '../../domain/entities/DocumentEntity'
import { DOCUMENT_ACCESS_LEVELS, DOCUMENT_CATEGORIES, DOCUMENT_FILE_TYPES, DOCUMENT_METRICS, DOCUMENT_PRIORITIES, DOCUMENT_RELATED_ENTITIES, DOCUMENT_SIZE_LIMITS, DOCUMENT_STATUS, DOCUMENT_TYPES } from '../constants/DocumentConstants'

export function getDocumentTypeLabel(type: string): string {
  return DOCUMENT_TYPES.find(t => t.value === type)?.label || type
}

export function getDocumentTypeIcon(type: string): string {
  return DOCUMENT_TYPES.find(t => t.value === type)?.icon || '❓'
}

export function getDocumentTypeCategory(type: string): string {
  return DOCUMENT_TYPES.find(t => t.value === type)?.category || 'misc'
}

export function getDocumentCategoryLabel(category: string): string {
  return DOCUMENT_CATEGORIES.find(c => c.value === category)?.label || category
}

export function getDocumentCategoryIcon(category: string): string {
  return DOCUMENT_CATEGORIES.find(c => c.value === category)?.icon || '❓'
}

export function getDocumentCategoryColor(category: string): string {
  return DOCUMENT_CATEGORIES.find(c => c.value === category)?.color || '#6B7280'
}

export function getDocumentStatusLabel(status: string): string {
  return DOCUMENT_STATUS.find(s => s.value === status)?.label || status
}

export function getDocumentStatusColor(status: string): string {
  return DOCUMENT_STATUS.find(s => s.value === status)?.color || '#6B7280'
}

export function getDocumentStatusBgColor(status: string): string {
  return DOCUMENT_STATUS.find(s => s.value === status)?.bgColor || '#F3F4F6'
}

export function getDocumentStatusIcon(status: string): string {
  return DOCUMENT_STATUS.find(s => s.value === status)?.icon || '❓'
}

export function getDocumentPriorityLabel(priority: string): string {
  return DOCUMENT_PRIORITIES.find(p => p.value === priority)?.label || priority
}

export function getDocumentPriorityColor(priority: string): string {
  return DOCUMENT_PRIORITIES.find(p => p.value === priority)?.color || '#6B7280'
}

export function getDocumentPriorityBgColor(priority: string): string {
  return DOCUMENT_PRIORITIES.find(p => p.value === priority)?.bgColor || '#F3F4F6'
}

export function getDocumentPriorityIcon(priority: string): string {
  return DOCUMENT_PRIORITIES.find(p => p.value === priority)?.icon || '❓'
}

export function getDocumentFileTypeLabel(fileType: string): string {
  return DOCUMENT_FILE_TYPES.find(t => t.value === fileType)?.label || fileType
}

export function getDocumentFileTypeIcon(fileType: string): string {
  return DOCUMENT_FILE_TYPES.find(t => t.value === fileType)?.icon || '❓'
}

export function getDocumentFileTypeMimeType(fileType: string): string {
  return DOCUMENT_FILE_TYPES.find(t => t.value === fileType)?.mimeType || 'application/octet-stream'
}

export function getDocumentRelatedEntityLabel(entity: string): string {
  return DOCUMENT_RELATED_ENTITIES.find(e => e.value === entity)?.label || entity
}

export function getDocumentRelatedEntityIcon(entity: string): string {
  return DOCUMENT_RELATED_ENTITIES.find(e => e.value === entity)?.icon || '❓'
}

export function getDocumentSizeLimitLabel(sizeLimit: string): string {
  return DOCUMENT_SIZE_LIMITS.find(s => s.value === sizeLimit)?.label || sizeLimit
}

export function getDocumentSizeLimitMaxSize(sizeLimit: string): number {
  return DOCUMENT_SIZE_LIMITS.find(s => s.value === sizeLimit)?.maxSize || 0
}

export function getDocumentSizeLimitColor(sizeLimit: string): string {
  return DOCUMENT_SIZE_LIMITS.find(s => s.value === sizeLimit)?.color || '#6B7280'
}

export function getDocumentAccessLevelLabel(level: string): string {
  return DOCUMENT_ACCESS_LEVELS.find(l => l.value === level)?.label || level
}

export function getDocumentAccessLevelColor(level: string): string {
  return DOCUMENT_ACCESS_LEVELS.find(l => l.value === level)?.color || '#6B7280'
}

export function getDocumentAccessLevelIcon(level: string): string {
  return DOCUMENT_ACCESS_LEVELS.find(l => l.value === level)?.icon || '❓'
}

export function getDocumentAgeCategory(age: number): string {
  const category = DOCUMENT_METRICS.AGE_RANGES.find(r => age >= r.min && age < r.max)

  return category?.label || 'No especificado'
}

export function getDocumentDownloadCategory(downloads: number): string {
  const category = DOCUMENT_METRICS.DOWNLOAD_RANGES.find(r => downloads >= r.min && downloads < r.max)

  return category?.label || 'No especificado'
}

export function isDocumentDraft(document: Document): boolean {
  return document.status === 'draft'
}

export function isDocumentPendingReview(document: Document): boolean {
  return document.status === 'pending_review'
}

export function isDocumentUnderReview(document: Document): boolean {
  return document.status === 'under_review'
}

export function isDocumentApproved(document: Document): boolean {
  return document.status === 'approved'
}

export function isDocumentRejected(document: Document): boolean {
  return document.status === 'rejected'
}

export function isDocumentArchived(document: Document): boolean {
  return document.status === 'archived'
}

export function calculateDocumentAge(document: Document): number {
  if (!document.created_at)
    return 0

  const createdDate = new Date(document.created_at)
  const now = new Date()

  return Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDocumentSize(size: number): string {
  if (size < 1024)
    return `${size} B`
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} MB`

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function getDocumentFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

export function getDocumentMimeTypeFromExtension(extension: string): string {
  const fileType = DOCUMENT_FILE_TYPES.find(t => t.value === extension)

  return fileType?.mimeType || 'application/octet-stream'
}

export function isDocumentImage(document: Document): boolean {
  const extension = getDocumentFileExtension(document.file_name)

  return ['jpg', 'jpeg', 'png', 'gif'].includes(extension)
}

export function isDocumentPDF(document: Document): boolean {
  const extension = getDocumentFileExtension(document.file_name)

  return extension === 'pdf'
}

export function isDocumentOffice(document: Document): boolean {
  const extension = getDocumentFileExtension(document.file_name)

  return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)
}

export function getDocumentStatusBadgeClass(status: string): string {
  const statusConfig = DOCUMENT_STATUS.find(s => s.value === status)
  if (!statusConfig)
    return 'bg-gray-100 text-gray-800'

  const colorMap: Record<string, string> = {
    '#6B7280': 'bg-gray-100 text-gray-800',
    '#F59E0B': 'bg-yellow-100 text-yellow-800',
    '#3B82F6': 'bg-blue-100 text-blue-800',
    '#10B981': 'bg-green-100 text-green-800',
    '#EF4444': 'bg-red-100 text-red-800',
  }

  return colorMap[statusConfig.color] || 'bg-gray-100 text-gray-800'
}

export function getDocumentPriorityBadgeClass(priority: string): string {
  const priorityConfig = DOCUMENT_PRIORITIES.find(p => p.value === priority)
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

export function sortDocumentsByStatus(documents: Document[]): Document[] {
  const statusOrder = ['draft', 'pending_review', 'under_review', 'approved', 'rejected', 'archived']

  return documents.sort((a, b) => {
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

export function sortDocumentsByPriority(documents: Document[]): Document[] {
  const priorityOrder = ['critical', 'high', 'medium', 'low']

  return documents.sort((a, b) => {
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

export function filterDocumentsByStatus(documents: Document[], status: string): Document[] {
  return documents.filter(doc => doc.status === status)
}

export function filterDocumentsByType(documents: Document[], type: string): Document[] {
  return documents.filter(doc => doc.document_type === type)
}

export function filterDocumentsByCategory(documents: Document[], category: string): Document[] {
  return documents.filter(doc => {
    const documentType = DOCUMENT_TYPES.find(t => t.value === doc.document_type)

    return documentType?.category === category
  })
}

export function filterDocumentsByRelatedEntity(documents: Document[], entityType: string, entityId: string): Document[] {
  return documents.filter(doc => doc.related_entity_type === entityType && doc.related_entity_id === entityId)
}

export function searchDocuments(documents: Document[], query: string): Document[] {
  if (!query.trim())
    return documents

  const lowercaseQuery = query.toLowerCase()

  return documents.filter(doc =>
    doc.name.toLowerCase().includes(lowercaseQuery)
    || doc.description?.toLowerCase().includes(lowercaseQuery)
    || doc.file_name.toLowerCase().includes(lowercaseQuery)
    || doc.uploaded_by_name.toLowerCase().includes(lowercaseQuery),
  )
}
