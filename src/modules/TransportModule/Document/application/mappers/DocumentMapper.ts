/**
 * Document Mapper - Application Layer
 *
 * Maps between domain entities and DTOs
 */

import type { DocumentEntity } from '../../domain/entities/DocumentEntity'
import type {
  DocumentCreateDto,
  DocumentDetailDto,
  DocumentListDto,
  DocumentUpdateDto,
} from '../dtos/DocumentDtos'

export class DocumentMapper {
  static toListDto(entity: DocumentEntity): DocumentListDto {
    return {
      id: entity.id,
      document_type: entity.documentType,
      document_number: entity.documentNumber,
      issued_by: entity.issuedBy,
      issue_date: entity.issueDate,
      expiry_date: entity.expiryDate,
      status: entity.status,
      holder_name: entity.holderName,
      holder_type: entity.holderType,
      holder_id: entity.holderId,
      file_url: entity.fileUrl,
      file_name: entity.fileName,
      file_size: entity.fileSize,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    }
  }

  static toDetailDto(entity: DocumentEntity): DocumentDetailDto {
    return {
      ...this.toListDto(entity),
      notes: entity.notes,
      verification_status: entity.verificationStatus || 'PENDING',
      verification_date: entity.verificationDate,
      verified_by: entity.verifiedBy,
      rejection_reason: entity.rejectionReason,
      metadata: entity.metadata,
    }
  }

  static fromCreateDto(dto: DocumentCreateDto): Omit<DocumentEntity, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      documentType: dto.document_type,
      documentNumber: dto.document_number,
      issuedBy: dto.issued_by,
      issueDate: dto.issue_date,
      expiryDate: dto.expiry_date,
      status: 'PENDING',
      holderType: dto.holder_type,
      holderId: dto.holder_id,
      holderName: '',
      notes: dto.notes,
      verificationStatus: 'PENDING',
    }
  }

  static fromUpdateDto(dto: DocumentUpdateDto): Partial<DocumentEntity> {
    const updates: Partial<DocumentEntity> = {}

    if (dto.document_type !== undefined)
      updates.documentType = dto.document_type
    if (dto.document_number !== undefined)
      updates.documentNumber = dto.document_number
    if (dto.issued_by !== undefined)
      updates.issuedBy = dto.issued_by
    if (dto.issue_date !== undefined)
      updates.issueDate = dto.issue_date
    if (dto.expiry_date !== undefined)
      updates.expiryDate = dto.expiry_date
    if (dto.status !== undefined)
      updates.status = dto.status
    if (dto.notes !== undefined)
      updates.notes = dto.notes

    return updates
  }

  static fromApiResponse(response: any): DocumentEntity {
    return {
      id: response.id,
      documentType: response.document_type,
      documentNumber: response.document_number,
      issuedBy: response.issued_by,
      issueDate: response.issue_date,
      expiryDate: response.expiry_date,
      status: response.status,
      holderName: response.holder_name || '',
      holderType: response.holder_type,
      holderId: response.holder_id,
      fileUrl: response.file_url,
      fileName: response.file_name,
      fileSize: response.file_size,
      notes: response.notes,
      verificationStatus: response.verification_status || 'PENDING',
      verificationDate: response.verification_date,
      verifiedBy: response.verified_by,
      rejectionReason: response.rejection_reason,
      metadata: response.metadata,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
    }
  }

  static toApiRequest(entity: Partial<DocumentEntity>): Record<string, any> {
    const request: Record<string, any> = {}

    if (entity.documentType !== undefined)
      request.document_type = entity.documentType
    if (entity.documentNumber !== undefined)
      request.document_number = entity.documentNumber
    if (entity.issuedBy !== undefined)
      request.issued_by = entity.issuedBy
    if (entity.issueDate !== undefined)
      request.issue_date = entity.issueDate
    if (entity.expiryDate !== undefined)
      request.expiry_date = entity.expiryDate
    if (entity.status !== undefined)
      request.status = entity.status
    if (entity.holderType !== undefined)
      request.holder_type = entity.holderType
    if (entity.holderId !== undefined)
      request.holder_id = entity.holderId
    if (entity.notes !== undefined)
      request.notes = entity.notes

    return request
  }
}
