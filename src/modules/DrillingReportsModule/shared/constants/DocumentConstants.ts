export const DOCUMENT_TYPES = [
  { value: 'report', label: 'Reporte', icon: '📊', category: 'reporting' },
  { value: 'permit', label: 'Permiso', icon: '📋', category: 'legal' },
  { value: 'certificate', label: 'Certificado', icon: '🏆', category: 'certification' },
  { value: 'manual', label: 'Manual', icon: '📖', category: 'documentation' },
  { value: 'other', label: 'Otro', icon: '📄', category: 'misc' },
]

export const DOCUMENT_CATEGORIES = [
  { value: 'reporting', label: 'Reportes', icon: '📊', color: '#3B82F6' },
  { value: 'legal', label: 'Legal', icon: '📋', color: '#10B981' },
  { value: 'certification', label: 'Certificaciones', icon: '🏆', color: '#F59E0B' },
  { value: 'documentation', label: 'Documentación', icon: '📖', color: '#8B5CF6' },
  { value: 'misc', label: 'Misceláneo', icon: '📄', color: '#6B7280' },
]

export const DOCUMENT_STATUS = [
  { value: 'draft', label: 'Borrador', color: '#6B7280', bgColor: '#F3F4F6', icon: '📝' },
  { value: 'pending_review', label: 'Pendiente de Revisión', color: '#F59E0B', bgColor: '#FEF3C7', icon: '⏳' },
  { value: 'under_review', label: 'En Revisión', color: '#3B82F6', bgColor: '#DBEAFE', icon: '👀' },
  { value: 'approved', label: 'Aprobado', color: '#10B981', bgColor: '#D1FAE5', icon: '✅' },
  { value: 'rejected', label: 'Rechazado', color: '#EF4444', bgColor: '#FEE2E2', icon: '❌' },
  { value: 'archived', label: 'Archivado', color: '#6B7280', bgColor: '#F3F4F6', icon: '📦' },
]

export const DOCUMENT_PRIORITIES = [
  { value: 'low', label: 'Baja', color: '#6B7280', bgColor: '#F3F4F6', icon: '🔵' },
  { value: 'medium', label: 'Media', color: '#F59E0B', bgColor: '#FEF3C7', icon: '🟡' },
  { value: 'high', label: 'Alta', color: '#EF4444', bgColor: '#FEE2E2', icon: '🔴' },
  { value: 'critical', label: 'Crítica', color: '#7C2D12', bgColor: '#FED7AA', icon: '🚨' },
]

export const DOCUMENT_FILE_TYPES = [
  { value: 'pdf', label: 'PDF', icon: '📄', mimeType: 'application/pdf' },
  { value: 'doc', label: 'Word', icon: '📝', mimeType: 'application/msword' },
  { value: 'docx', label: 'Word (DOCX)', icon: '📝', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { value: 'xls', label: 'Excel', icon: '📊', mimeType: 'application/vnd.ms-excel' },
  { value: 'xlsx', label: 'Excel (XLSX)', icon: '📊', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { value: 'jpg', label: 'JPEG', icon: '🖼️', mimeType: 'image/jpeg' },
  { value: 'png', label: 'PNG', icon: '🖼️', mimeType: 'image/png' },
  { value: 'gif', label: 'GIF', icon: '🖼️', mimeType: 'image/gif' },
  { value: 'txt', label: 'Texto', icon: '📄', mimeType: 'text/plain' },
  { value: 'zip', label: 'ZIP', icon: '📦', mimeType: 'application/zip' },
  { value: 'rar', label: 'RAR', icon: '📦', mimeType: 'application/x-rar-compressed' },
]

export const DOCUMENT_RELATED_ENTITIES = [
  { value: 'project', label: 'Proyecto', icon: '🏗️' },
  { value: 'well', label: 'Pozo', icon: '🕳️' },
  { value: 'report', label: 'Reporte', icon: '📊' },
  { value: 'tool', label: 'Herramienta', icon: '🔧' },
  { value: 'employee', label: 'Empleado', icon: '👨‍💼' },
]

export const DOCUMENT_SIZE_LIMITS = [
  { value: 'small', label: 'Pequeño (<1MB)', maxSize: 1024 * 1024, color: '#10B981' },
  { value: 'medium', label: 'Mediano (1-5MB)', maxSize: 5 * 1024 * 1024, color: '#3B82F6' },
  { value: 'large', label: 'Grande (5-10MB)', maxSize: 10 * 1024 * 1024, color: '#F59E0B' },
  { value: 'xlarge', label: 'Muy Grande (10-50MB)', maxSize: 50 * 1024 * 1024, color: '#EF4444' },
  { value: 'xxlarge', label: 'Enorme (>50MB)', maxSize: Number.POSITIVE_INFINITY, color: '#7C2D12' },
]

export const DOCUMENT_ACCESS_LEVELS = [
  { value: 'public', label: 'Público', color: '#10B981', icon: '🌐' },
  { value: 'internal', label: 'Interno', color: '#3B82F6', icon: '🏢' },
  { value: 'confidential', label: 'Confidencial', color: '#F59E0B', icon: '🔒' },
  { value: 'restricted', label: 'Restringido', color: '#EF4444', icon: '🚫' },
  { value: 'classified', label: 'Clasificado', color: '#7C2D12', icon: '🔐' },
]

export const DOCUMENT_METRICS = {
  SIZE_LIMITS: DOCUMENT_SIZE_LIMITS,
  AGE_RANGES: [
    { min: 0, max: 30, label: 'Reciente (0-30 días)', color: '#10B981' },
    { min: 30, max: 90, label: 'Reciente (30-90 días)', color: '#3B82F6' },
    { min: 90, max: 365, label: 'Antiguo (90-365 días)', color: '#F59E0B' },
    { min: 365, max: 1095, label: 'Muy Antiguo (1-3 años)', color: '#EF4444' },
    { min: 1095, max: Number.POSITIVE_INFINITY, label: 'Arcaico (>3 años)', color: '#7C2D12' },
  ],
  DOWNLOAD_RANGES: [
    { min: 0, max: 10, label: 'Poco Descargado (0-10)', color: '#10B981' },
    { min: 10, max: 50, label: 'Moderadamente Descargado (10-50)', color: '#3B82F6' },
    { min: 50, max: 100, label: 'Bien Descargado (50-100)', color: '#F59E0B' },
    { min: 100, max: 500, label: 'Muy Descargado (100-500)', color: '#EF4444' },
    { min: 500, max: Number.POSITIVE_INFINITY, label: 'Ultra Descargado (>500)', color: '#7C2D12' },
  ],
}

export const DOCUMENT_FILTERS = {
  TYPE: DOCUMENT_TYPES,
  CATEGORY: DOCUMENT_CATEGORIES,
  STATUS: DOCUMENT_STATUS,
  PRIORITY: DOCUMENT_PRIORITIES,
  FILE_TYPE: DOCUMENT_FILE_TYPES,
  RELATED_ENTITY: DOCUMENT_RELATED_ENTITIES,
  SIZE_LIMIT: DOCUMENT_METRICS.SIZE_LIMITS,
  ACCESS_LEVEL: DOCUMENT_ACCESS_LEVELS,
  AGE_RANGE: DOCUMENT_METRICS.AGE_RANGES,
  DOWNLOAD_RANGE: DOCUMENT_METRICS.DOWNLOAD_RANGES,
}

export const DOCUMENT_PERMISSIONS = {
  CREATE: 'documents.create',
  VIEW: 'documents.view',
  UPDATE: 'documents.update',
  DELETE: 'documents.delete',
  DOWNLOAD: 'documents.download',
  UPLOAD: 'documents.upload',
  SHARE: 'documents.share',
  EXPORT: 'documents.export',
  ARCHIVE: 'documents.archive',
}

export const DOCUMENT_NOTIFICATIONS = {
  CREATED: 'document_created',
  UPDATED: 'document_updated',
  APPROVED: 'document_approved',
  REJECTED: 'document_rejected',
  SHARED: 'document_shared',
  DOWNLOADED: 'document_downloaded',
  ARCHIVED: 'document_archived',
  EXPIRING: 'document_expiring',
  EXPIRED: 'document_expired',
}
