/**
 * Document Application Service - Application Layer
 *
 * Orchestrates business logic for document operations
 */

import type { DocumentRepository } from '../../domain/repositories/DocumentRepository'
import type {
  DocumentBulkOperationDto,
  DocumentCreateDto,
  DocumentFilterDto,
  DocumentStatsDto,
  DocumentUpdateDto,
  DocumentValidationDto,
} from '../dtos/DocumentDtos'
import { DocumentMapper } from '../mappers/DocumentMapper'

export class DocumentApplicationService {
  constructor(
    private readonly documentRepository: DocumentRepository,
  ) {}

  async getDocuments(filters: DocumentFilterDto) {
    try {
      const documents = await this.documentRepository.findAll(filters)

      return {
        success: true,
        data: documents.map(doc => DocumentMapper.toListDto(doc)),
        meta: {
          total: await this.documentRepository.count(filters),
          page: filters.page || 1,
          per_page: filters.per_page || 20,
        },
      }
    }
    catch (error) {
      console.error('Error fetching documents:', error)
      throw new Error('Failed to fetch documents')
    }
  }

  async getDocumentById(id: string) {
    try {
      const document = await this.documentRepository.findById(id)
      if (!document)
        throw new Error('Document not found')

      return {
        success: true,
        data: DocumentMapper.toDetailDto(document),
      }
    }
    catch (error) {
      console.error('Error fetching document:', error)
      throw error
    }
  }

  async createDocument(dto: DocumentCreateDto) {
    try {
      // Validate document number uniqueness
      const existingDoc = await this.documentRepository.findByDocumentNumber(
        dto.document_number,
        dto.document_type,
      )

      if (existingDoc)
        throw new Error('Document number already exists for this type')

      // Validate expiry date
      if (new Date(dto.expiry_date) <= new Date(dto.issue_date))
        throw new Error('Expiry date must be after issue date')

      const documentData = DocumentMapper.fromCreateDto(dto)
      const document = await this.documentRepository.create(documentData)

      return {
        success: true,
        data: DocumentMapper.toDetailDto(document),
        message: 'Document created successfully',
      }
    }
    catch (error) {
      console.error('Error creating document:', error)
      throw error
    }
  }

  async updateDocument(id: string, dto: DocumentUpdateDto) {
    try {
      const existingDocument = await this.documentRepository.findById(id)
      if (!existingDocument)
        throw new Error('Document not found')

      // Validate document number uniqueness if changed
      if (dto.document_number && dto.document_number !== existingDocument.documentNumber) {
        const duplicateDoc = await this.documentRepository.findByDocumentNumber(
          dto.document_number,
          dto.document_type || existingDocument.documentType,
        )

        if (duplicateDoc && duplicateDoc.id !== id)
          throw new Error('Document number already exists for this type')
      }

      // Validate expiry date if changed
      if (dto.expiry_date || dto.issue_date) {
        const issueDate = dto.issue_date || existingDocument.issueDate
        const expiryDate = dto.expiry_date || existingDocument.expiryDate

        if (new Date(expiryDate) <= new Date(issueDate))
          throw new Error('Expiry date must be after issue date')
      }

      const updateData = DocumentMapper.fromUpdateDto(dto)
      const document = await this.documentRepository.update(id, updateData)

      return {
        success: true,
        data: DocumentMapper.toDetailDto(document),
        message: 'Document updated successfully',
      }
    }
    catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  }

  async deleteDocument(id: string) {
    try {
      const existingDocument = await this.documentRepository.findById(id)
      if (!existingDocument)
        throw new Error('Document not found')

      await this.documentRepository.delete(id)

      return {
        success: true,
        message: 'Document deleted successfully',
      }
    }
    catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }

  async getDocumentStats(): Promise<DocumentStatsDto> {
    try {
      return await this.documentRepository.getStats()
    }
    catch (error) {
      console.error('Error fetching document stats:', error)
      throw new Error('Failed to fetch document statistics')
    }
  }

  async validateDocument(documentNumber: string, documentType: string): Promise<DocumentValidationDto> {
    try {
      const document = await this.documentRepository.findByDocumentNumber(documentNumber, documentType)

      if (!document) {
        return {
          document_number: documentNumber,
          document_type: documentType,
          issued_by: '',
          is_valid: false,
          verification_date: new Date().toISOString(),
          expiry_date: '',
          status: 'NOT_FOUND',
        }
      }

      const isExpired = new Date(document.expiryDate) < new Date()
      const isActive = document.status === 'ACTIVE'

      return {
        document_number: documentNumber,
        document_type: documentType,
        issued_by: document.issuedBy,
        is_valid: isActive && !isExpired,
        verification_date: new Date().toISOString(),
        expiry_date: document.expiryDate,
        status: document.status,
      }
    }
    catch (error) {
      console.error('Error validating document:', error)
      throw new Error('Failed to validate document')
    }
  }

  async bulkOperation(dto: DocumentBulkOperationDto) {
    try {
      const results = await Promise.allSettled(
        dto.ids.map(async id => {
          switch (dto.operation) {
            case 'delete':
              return this.deleteDocument(id)
            case 'activate':
              return this.updateDocument(id, { status: 'ACTIVE' })
            case 'deactivate':
              return this.updateDocument(id, { status: 'EXPIRED' })
            default:
              throw new Error(`Unsupported operation: ${dto.operation}`)
          }
        }),
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      return {
        success: true,
        message: `Bulk operation completed. ${successful} successful, ${failed} failed.`,
        data: { successful, failed },
      }
    }
    catch (error) {
      console.error('Error in bulk operation:', error)
      throw error
    }
  }

  async getExpiringDocuments(days: number = 30) {
    try {
      const futureDate = new Date()

      futureDate.setDate(futureDate.getDate() + days)

      const filters: DocumentFilterDto = {
        status: 'ACTIVE',
        expiry_date_to: futureDate.toISOString().split('T')[0],
      }

      const documents = await this.documentRepository.findAll(filters)

      return {
        success: true,
        data: documents.map(doc => DocumentMapper.toListDto(doc)),
      }
    }
    catch (error) {
      console.error('Error fetching expiring documents:', error)
      throw new Error('Failed to fetch expiring documents')
    }
  }
}
