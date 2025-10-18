/**
 * Document Mapper
 *
 * Transforms between domain entities and DTOs
 * Handles data conversion and validation
 */

import type {
  CreateDocumentRequest,
  DocumentAccessLogEntity,
  DocumentEntity,
  DocumentShareLinkEntity,
  DocumentStatistics,
  DocumentVersionEntity,
  MetadataTemplate,
  UpdateDocumentRequest,
} from '../../domain/entities/DocumentEntity'
import type {
  AccessLogDto,
  CreateDocumentDto,
  CreateShareLinkDto,
  DocumentDto,
  DocumentListDto,
  DocumentStatisticsDto,
  DocumentVersionDto,
  MetadataTemplateDto,
  ShareLinkDto,
  UpdateDocumentDto,
  UpdateShareLinkDto,
} from '../dtos/DocumentDtos'

export class DocumentMapper {
  /**
   * Map DocumentEntity to DocumentDto
   */
  static toDto(entity: DocumentEntity): DocumentDto {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      file_name: entity.file_name,
      file_path: entity.file_path,
      file_size: entity.file_size,
      mime_type: entity.mime_type,
      file_extension: entity.file_extension,
      resource_type: entity.resource_type,
      resource_id: entity.resource_id,
      resource_subtype: entity.resource_subtype,
      document_type: entity.document_type,
      category: entity.category,
      tags: entity.tags,
      metadata: entity.metadata,
      is_public: entity.is_public,
      is_encrypted: entity.is_encrypted,
      access_level: entity.access_level,
      version: entity.version,
      parent_document_id: entity.parent_document_id,
      is_latest_version: entity.is_latest_version,
      status: entity.status,
      uploaded_by: entity.uploaded_by,
      uploaded_by_user: entity.uploaded_by_user,
      file_size_formatted: entity.file_size_formatted,
      is_image: entity.is_image,
      is_pdf: entity.is_pdf,
      is_office_document: entity.is_office_document,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    }
  }

  /**
   * Map DocumentEntity to DocumentListDto
   */
  static toListDto(entity: DocumentEntity): DocumentListDto {
    return {
      id: entity.id,
      title: entity.title,
      file_name: entity.file_name,
      file_size: entity.file_size,
      file_size_formatted: entity.file_size_formatted,
      mime_type: entity.mime_type,
      document_type: entity.document_type,
      category: entity.category,
      status: entity.status,
      resource_type: entity.resource_type,
      resource_id: entity.resource_id,
      resource_subtype: entity.resource_subtype,
      tags: entity.tags,
      is_public: entity.is_public,
      access_level: entity.access_level,
      version: entity.version,
      is_latest_version: entity.is_latest_version,
      uploaded_by: entity.uploaded_by,
      uploaded_by_user: entity.uploaded_by_user,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    }
  }

  /**
   * Map CreateDocumentDto to CreateDocumentRequest
   */
  static toCreateRequest(dto: CreateDocumentDto): CreateDocumentRequest {
    return {
      title: dto.title,
      description: dto.description,
      resource_type: dto.resource_type,
      resource_id: dto.resource_id,
      resource_subtype: dto.resource_subtype,
      document_type: dto.document_type,
      category: dto.category,
      tags: dto.tags || [],
      metadata: dto.metadata || {},
      is_public: dto.is_public || false,
      access_level: dto.access_level || 'internal',
      file: dto.file,
    }
  }

  /**
   * Map UpdateDocumentDto to UpdateDocumentRequest
   */
  static toUpdateRequest(dto: UpdateDocumentDto): UpdateDocumentRequest {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      document_type: dto.document_type,
      category: dto.category,
      tags: dto.tags,
      metadata: dto.metadata,
      is_public: dto.is_public,
      access_level: dto.access_level,
      change_description: dto.change_description,
    }
  }

  /**
   * Map DocumentVersionEntity to DocumentVersionDto
   */
  static versionToDto(entity: DocumentVersionEntity): DocumentVersionDto {
    return {
      id: entity.id,
      document_id: entity.document_id,
      version_number: entity.version_number,
      file_name: entity.file_name,
      file_path: entity.file_path,
      file_size: entity.file_size,
      mime_type: entity.mime_type,
      change_description: entity.change_description,
      created_by: entity.created_by,
      is_current: entity.is_current,
      created_at: entity.created_at,
    }
  }

  /**
   * Map DocumentShareLinkEntity to ShareLinkDto
   */
  static shareLinkToDto(entity: DocumentShareLinkEntity): ShareLinkDto {
    return {
      id: entity.id,
      document_id: entity.document_id,
      share_token: entity.share_token,
      share_url: entity.share_url,
      has_password: !!entity.password,
      expires_at: entity.expires_at,
      max_downloads: entity.max_downloads,
      download_count: entity.download_count,
      downloads_remaining: entity.max_downloads ? entity.max_downloads - entity.download_count : undefined,
      permissions: entity.permissions,
      allowed_emails: entity.allowed_emails,
      is_active: entity.is_active,
      is_expired: entity.expires_at ? new Date(entity.expires_at) < new Date() : false,
      created_by: entity.created_by,
      created_at: entity.created_at,
      notes: entity.notes,
    }
  }

  /**
   * Map CreateShareLinkDto to CreateShareLinkRequest
   */
  static toCreateShareLinkRequest(dto: CreateShareLinkDto): any {
    return {
      password: dto.password,
      expires_at: dto.expires_at,
      max_downloads: dto.max_downloads,
      permissions: dto.permissions,
      allowed_emails: dto.allowed_emails,
      notes: dto.notes,
    }
  }

  /**
   * Map UpdateShareLinkDto to UpdateShareLinkRequest
   */
  static toUpdateShareLinkRequest(dto: UpdateShareLinkDto): any {
    return {
      password: dto.password,
      expires_at: dto.expires_at,
      max_downloads: dto.max_downloads,
      permissions: dto.permissions,
      allowed_emails: dto.allowed_emails,
      notes: dto.notes,
    }
  }

  /**
   * Map DocumentAccessLogEntity to AccessLogDto
   */
  static accessLogToDto(entity: DocumentAccessLogEntity): AccessLogDto {
    return {
      id: entity.id,
      document_id: entity.document_id,
      user_id: entity.user_id,
      action: entity.action,
      ip_address: entity.ip_address,
      user_agent: entity.user_agent,
      share_token: entity.share_token,
      metadata: entity.metadata,
      created_at: entity.created_at,
    }
  }

  /**
   * Map DocumentStatistics to DocumentStatisticsDto
   */
  static statisticsToDto(stats: DocumentStatistics): DocumentStatisticsDto {
    return {
      total_documents: stats.total_documents,
      documents_by_type: stats.documents_by_type,
      documents_by_category: stats.documents_by_category,
      documents_by_status: stats.documents_by_status,
      total_size: stats.total_size,
      average_size: stats.average_size,
      recent_uploads: stats.recent_uploads,
      active_share_links: stats.active_share_links,
      expired_share_links: stats.expired_share_links,
    }
  }

  /**
   * Map MetadataTemplate to MetadataTemplateDto
   */
  static metadataTemplateToDto(template: MetadataTemplate): MetadataTemplateDto {
    return {
      name: template.name,
      description: template.description,
      fields: template.fields.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        options: field.options,
        min: field.min,
        max: field.max,
        step: field.step,
        default: field.default,
        readonly: field.readonly,
        showIf: field.showIf,
      })),
    }
  }

  /**
   * Map array of DocumentEntity to array of DocumentDto
   */
  static toDtoArray(entities: DocumentEntity[]): DocumentDto[] {
    return entities.map(entity => DocumentMapper.toDto(entity))
  }

  /**
   * Map array of DocumentEntity to array of DocumentListDto
   */
  static toListDtoArray(entities: DocumentEntity[]): DocumentListDto[] {
    return entities.map(entity => DocumentMapper.toListDto(entity))
  }

  /**
   * Map array of DocumentVersionEntity to array of DocumentVersionDto
   */
  static versionToDtoArray(entities: DocumentVersionEntity[]): DocumentVersionDto[] {
    return entities.map(entity => DocumentMapper.versionToDto(entity))
  }

  /**
   * Map array of DocumentShareLinkEntity to array of ShareLinkDto
   */
  static shareLinkToDtoArray(entities: DocumentShareLinkEntity[]): ShareLinkDto[] {
    return entities.map(entity => DocumentMapper.shareLinkToDto(entity))
  }

  /**
   * Map array of DocumentAccessLogEntity to array of AccessLogDto
   */
  static accessLogToDtoArray(entities: DocumentAccessLogEntity[]): AccessLogDto[] {
    return entities.map(entity => DocumentMapper.accessLogToDto(entity))
  }

  /**
   * Map DocumentDto to DocumentEntity (for updates)
   */
  static fromDto(dto: DocumentDto): Partial<DocumentEntity> {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      file_name: dto.file_name,
      file_path: dto.file_path,
      file_size: dto.file_size,
      mime_type: dto.mime_type,
      file_extension: dto.file_extension,
      resource_type: dto.resource_type,
      resource_id: dto.resource_id,
      resource_subtype: dto.resource_subtype,
      document_type: dto.document_type,
      category: dto.category,
      tags: dto.tags,
      metadata: dto.metadata,
      is_public: dto.is_public,
      is_encrypted: dto.is_encrypted,
      access_level: dto.access_level,
      version: dto.version,
      parent_document_id: dto.parent_document_id,
      is_latest_version: dto.is_latest_version,
      status: dto.status,
      uploaded_by: dto.uploaded_by,
      uploaded_by_user: dto.uploaded_by_user,
      file_size_formatted: dto.file_size_formatted,
      is_image: dto.is_image,
      is_pdf: dto.is_pdf,
      is_office_document: dto.is_office_document,
      created_at: dto.created_at,
      updated_at: dto.updated_at,
    }
  }

  /**
   * Map DocumentListDto to DocumentEntity (for list items)
   */
  static fromListDto(dto: DocumentListDto): Partial<DocumentEntity> {
    return {
      id: dto.id,
      title: dto.title,
      file_name: dto.file_name,
      file_size: dto.file_size,
      file_size_formatted: dto.file_size_formatted,
      mime_type: dto.mime_type,
      document_type: dto.document_type,
      category: dto.category,
      status: dto.status,
      resource_type: dto.resource_type,
      resource_id: dto.resource_id,
      resource_subtype: dto.resource_subtype,
      tags: dto.tags,
      is_public: dto.is_public,
      access_level: dto.access_level,
      version: dto.version,
      is_latest_version: dto.is_latest_version,
      uploaded_by: dto.uploaded_by,
      uploaded_by_user: dto.uploaded_by_user,
      created_at: dto.created_at,
      updated_at: dto.updated_at,
    }
  }

  /**
   * Map ShareLinkDto to DocumentShareLinkEntity
   */
  static shareLinkFromDto(dto: ShareLinkDto): Partial<DocumentShareLinkEntity> {
    return {
      id: dto.id,
      document_id: dto.document_id,
      share_token: dto.share_token,
      share_url: dto.share_url,
      expires_at: dto.expires_at,
      max_downloads: dto.max_downloads,
      download_count: dto.download_count,
      permissions: dto.permissions,
      allowed_emails: dto.allowed_emails,
      is_active: dto.is_active,
      created_by: dto.created_by,
      created_at: dto.created_at,
      notes: dto.notes,
    }
  }

  /**
   * Map DocumentVersionDto to DocumentVersionEntity
   */
  static versionFromDto(dto: DocumentVersionDto): Partial<DocumentVersionEntity> {
    return {
      id: dto.id,
      document_id: dto.document_id,
      version_number: dto.version_number,
      file_name: dto.file_name,
      file_path: dto.file_path,
      file_size: dto.file_size,
      mime_type: dto.mime_type,
      change_description: dto.change_description,
      created_by: dto.created_by,
      is_current: dto.is_current,
      created_at: dto.created_at,
    }
  }

  /**
   * Map AccessLogDto to DocumentAccessLogEntity
   */
  static accessLogFromDto(dto: AccessLogDto): Partial<DocumentAccessLogEntity> {
    return {
      id: dto.id,
      document_id: dto.document_id,
      user_id: dto.user_id,
      action: dto.action,
      ip_address: dto.ip_address,
      user_agent: dto.user_agent,
      share_token: dto.share_token,
      metadata: dto.metadata,
      created_at: dto.created_at,
    }
  }

  /**
   * Map DocumentStatisticsDto to DocumentStatistics
   */
  static statisticsFromDto(dto: DocumentStatisticsDto): DocumentStatistics {
    return {
      total_documents: dto.total_documents,
      documents_by_type: dto.documents_by_type,
      documents_by_category: dto.documents_by_category,
      documents_by_status: dto.documents_by_status,
      total_size: dto.total_size,
      average_size: dto.average_size,
      recent_uploads: dto.recent_uploads,
      active_share_links: dto.active_share_links,
      expired_share_links: dto.expired_share_links,
    }
  }

  /**
   * Map MetadataTemplateDto to MetadataTemplate
   */
  static metadataTemplateFromDto(dto: MetadataTemplateDto): MetadataTemplate {
    return {
      name: dto.name,
      description: dto.description,
      fields: dto.fields.map(field => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder,
        options: field.options,
        min: field.min,
        max: field.max,
        step: field.step,
        default: field.default,
        readonly: field.readonly,
        showIf: field.showIf,
      })),
    }
  }
}
