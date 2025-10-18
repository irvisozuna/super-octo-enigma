/**
 * Documents Module Shared Types
 *
 * Common types and interfaces used across the module
 */

// Base entity interface
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Filter interfaces
export interface DocumentFilter {
  title?: string
  document_type?: string
  category?: string
  resource_type?: string
  resource_subtype?: string
  status?: string
  tags?: string[]
  uploaded_by?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
}

// Search interfaces
export interface DocumentSearchCriteria {
  title?: string
  document_type?: string
  category?: string
  resource_type?: string
  resource_id?: string
  resource_subtype?: string
  status?: string
  tags?: string[]
  uploaded_by?: string
  date_from?: string
  date_to?: string
}

// Statistics interfaces
export interface DocumentStatistics {
  total_documents: number
  documents_by_type: Record<string, number>
  documents_by_category: Record<string, number>
  documents_by_status: Record<string, number>
  total_size: number
  average_size: number
  recent_uploads: number
  active_share_links: number
  expired_share_links: number
}

// Metadata template interfaces
export interface MetadataTemplate {
  name: string
  description: string
  fields: MetadataField[]
}

export interface MetadataField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'url'
  required: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
  step?: number
  default?: any
  readonly?: boolean
  showIf?: Array<string | string | any>
}

// Share link interfaces
export interface ShareLinkRequest {
  password?: string
  expires_at?: string
  max_downloads?: number
  permissions: string[]
  allowed_emails?: string[]
  notes?: string
}

export interface ShareLinkResponse {
  id: string
  document_id: string
  share_token: string
  share_url: string
  has_password: boolean
  expires_at?: string
  max_downloads?: number
  download_count: number
  downloads_remaining?: number
  permissions: string[]
  allowed_emails?: string[]
  is_active: boolean
  is_expired: boolean
  created_by: string
  created_at: string
  notes?: string
}

// Version interfaces
export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  change_description?: string
  created_by: string
  is_current: boolean
  created_at: string
}

// Access log interfaces
export interface DocumentAccessLog {
  id: string
  document_id: string
  user_id?: string
  action: string
  ip_address?: string
  user_agent?: string
  share_token?: string
  metadata?: Record<string, any>
  created_at: string
}

// Bulk operation interfaces
export interface BulkOperationRequest {
  document_ids: string[]
  operation: 'delete' | 'update' | 'export' | 'archive' | 'restore'
  data?: Record<string, any>
}

export interface BulkOperationResponse {
  success: boolean
  processed: number
  failed: number
  errors: string[]
}

// Export interfaces
export interface ExportRequest {
  format: 'csv' | 'excel' | 'pdf'
  filters?: DocumentFilter
  fields?: string[]
}

export interface ExportResponse {
  download_url: string
  expires_at: string
}

// Notification interfaces
export interface DocumentNotification {
  type: 'upload' | 'update' | 'delete' | 'share' | 'expire' | 'access'
  document_id: string
  document_title: string
  user_id: string
  message: string
  metadata?: Record<string, any>
}

// Audit interfaces
export interface DocumentAudit {
  id: string
  document_id: string
  action: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
  created_at: string
}

// Security interfaces
export interface SecurityAudit {
  id: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip_address: string
  user_id?: string
  document_id?: string
  description: string
  metadata?: Record<string, any>
  created_at: string
}

export interface FailedAccessAttempt {
  id: string
  ip_address: string
  user_id?: string
  document_id?: string
  share_token?: string
  attempt_type: string
  reason: string
  metadata?: Record<string, any>
  attempted_at: string
}

// File upload interfaces
export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface FileValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Search and filter interfaces
export interface DocumentSearchRequest {
  query?: string
  filters?: DocumentSearchCriteria
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface DocumentSearchResponse {
  data: any[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  facets?: {
    document_types: Record<string, number>
    categories: Record<string, number>
    statuses: Record<string, number>
    resource_types: Record<string, number>
  }
}

// Public share interfaces (no authentication required)
export interface PublicShareCheck {
  requires_password: boolean
  requires_email: boolean
  permissions: string[]
}

export interface PublicShareInfo {
  document: {
    id: string
    title: string
    file_name: string
    file_size: number
    file_size_formatted: string
    mime_type: string
    created_at: string
  }
  share_link: {
    expires_at?: string
    max_downloads?: number
    download_count: number
    downloads_remaining?: number
    permissions: string[]
  }
}

// Workflow interfaces
export interface DocumentWorkflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkflowStep {
  id: string
  name: string
  type: 'approval' | 'review' | 'notification' | 'automation'
  order: number
  assignees: string[]
  conditions?: Record<string, any>
  actions?: Record<string, any>
}

// Approval interfaces
export interface DocumentApproval {
  id: string
  document_id: string
  workflow_id: string
  step_id: string
  approver_id: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approved_at?: string
  created_at: string
}

// Archive interfaces
export interface DocumentArchive {
  id: string
  document_id: string
  archived_by: string
  archived_at: string
  reason?: string
  retention_period?: number
  auto_delete_date?: string
}

// Encryption interfaces
export interface DocumentEncryption {
  id: string
  document_id: string
  encryption_key: string
  encryption_algorithm: string
  encrypted_at: string
  decrypted_at?: string
}

// Compliance interfaces
export interface DocumentCompliance {
  id: string
  document_id: string
  compliance_type: string
  compliance_status: 'compliant' | 'non_compliant' | 'pending'
  compliance_date: string
  compliance_notes?: string
  compliance_officer?: string
}

// Retention interfaces
export interface DocumentRetention {
  id: string
  document_id: string
  retention_policy: string
  retention_period: number
  retention_start_date: string
  retention_end_date: string
  auto_delete: boolean
  retention_officer?: string
}

// Backup interfaces
export interface DocumentBackup {
  id: string
  document_id: string
  backup_location: string
  backup_type: 'full' | 'incremental' | 'differential'
  backup_size: number
  backup_date: string
  backup_status: 'success' | 'failed' | 'in_progress'
  backup_notes?: string
}

// Sync interfaces
export interface DocumentSync {
  id: string
  document_id: string
  sync_source: string
  sync_destination: string
  sync_status: 'pending' | 'in_progress' | 'completed' | 'failed'
  sync_started_at: string
  sync_completed_at?: string
  sync_errors?: string[]
}

// Analytics interfaces
export interface DocumentAnalytics {
  document_id: string
  views: number
  downloads: number
  shares: number
  last_accessed: string
  access_frequency: 'high' | 'medium' | 'low'
  user_engagement: number
  popular_tags: string[]
  related_documents: string[]
}

// Recommendation interfaces
export interface DocumentRecommendation {
  document_id: string
  recommended_documents: string[]
  recommendation_score: number
  recommendation_reason: string
  recommendation_type: 'similar' | 'related' | 'trending' | 'personalized'
}

// Collaboration interfaces
export interface DocumentCollaboration {
  id: string
  document_id: string
  user_id: string
  collaboration_type: 'view' | 'comment' | 'edit' | 'review'
  collaboration_status: 'active' | 'inactive' | 'completed'
  collaboration_started_at: string
  collaboration_ended_at?: string
  collaboration_notes?: string
}

// Comment interfaces
export interface DocumentComment {
  id: string
  document_id: string
  user_id: string
  comment: string
  comment_type: 'general' | 'review' | 'approval' | 'rejection'
  is_resolved: boolean
  parent_comment_id?: string
  created_at: string
  updated_at: string
}

// Tag interfaces
export interface DocumentTag {
  id: string
  name: string
  color: string
  description?: string
  usage_count: number
  created_at: string
  updated_at: string
}

// Category interfaces
export interface DocumentCategory {
  id: string
  name: string
  description?: string
  parent_category_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Type interfaces
export interface DocumentType {
  id: string
  name: string
  description?: string
  allowed_extensions: string[]
  max_file_size: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Permission interfaces
export interface DocumentPermission {
  id: string
  document_id: string
  user_id?: string
  role_id?: string
  permission_type: 'read' | 'write' | 'delete' | 'share' | 'admin'
  granted_by: string
  granted_at: string
  expires_at?: string
  is_active: boolean
}

// Access control interfaces
export interface DocumentAccessControl {
  id: string
  document_id: string
  access_type: 'public' | 'private' | 'restricted' | 'confidential'
  access_level: number
  access_rules: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

// Watermark interfaces
export interface DocumentWatermark {
  id: string
  document_id: string
  watermark_type: 'text' | 'image' | 'logo'
  watermark_content: string
  watermark_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  watermark_opacity: number
  watermark_size: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Digital signature interfaces
export interface DocumentSignature {
  id: string
  document_id: string
  signer_id: string
  signature_type: 'electronic' | 'digital' | 'biometric'
  signature_data: string
  signature_certificate?: string
  signature_timestamp: string
  signature_valid: boolean
  signature_verified: boolean
  created_at: string
}

// OCR interfaces
export interface DocumentOCR {
  id: string
  document_id: string
  ocr_text: string
  ocr_confidence: number
  ocr_language: string
  ocr_engine: string
  ocr_processed_at: string
  ocr_errors?: string[]
}

// AI interfaces
export interface DocumentAI {
  id: string
  document_id: string
  ai_analysis: Record<string, any>
  ai_summary?: string
  ai_keywords: string[]
  ai_sentiment?: 'positive' | 'negative' | 'neutral'
  ai_classification?: string
  ai_confidence: number
  ai_processed_at: string
}

// Integration interfaces
export interface DocumentIntegration {
  id: string
  document_id: string
  integration_type: string
  integration_config: Record<string, any>
  integration_status: 'active' | 'inactive' | 'error'
  integration_synced_at: string
  integration_errors?: string[]
}

// Webhook interfaces
export interface DocumentWebhook {
  id: string
  document_id: string
  webhook_url: string
  webhook_events: string[]
  webhook_secret?: string
  webhook_status: 'active' | 'inactive' | 'error'
  webhook_last_triggered?: string
  webhook_errors?: string[]
}
