/**
 * Document Repository Implementation - Infrastructure Layer
 *
 * Implementation of DocumentRepository using API service
 */

import type { DocumentEntity } from '../../../domain/entities/DocumentEntity'
import type { DocumentRepository } from '../../../domain/repositories/DocumentRepository'
import type { DocumentFilterDto, DocumentStatsDto } from '../../../application/dtos/DocumentDtos'
import type { DocumentApiService } from '../../api/services/DocumentApiService'
import { DocumentMapper } from '../../../application/mappers/DocumentMapper'

export class DocumentRepositoryImpl implements DocumentRepository {
  constructor(
    private readonly apiService: DocumentApiService,
  ) {}

  async findAll(filters: DocumentFilterDto = {}): Promise<DocumentEntity[]> {
    try {
      const response = await this.apiService.getDocuments(filters)

      if (response.success && Array.isArray(response.data))
        return response.data.map(item => DocumentMapper.fromApiResponse(item))

      return []
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.findAll:', error)
      throw error
    }
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    try {
      const response = await this.apiService.getDocumentById(id)

      if (response.success && response.data)
        return DocumentMapper.fromApiResponse(response.data)

      return null
    }
    catch (error) {
      if (error instanceof Error && error.message.includes('not found'))
        return null

      console.error('Error in DocumentRepositoryImpl.findById:', error)
      throw error
    }
  }

  async findByDocumentNumber(documentNumber: string, documentType: string): Promise<DocumentEntity | null> {
    try {
      const filters: DocumentFilterDto = {
        search: documentNumber,
        document_type: documentType,
        per_page: 1,
      }

      const documents = await this.findAll(filters)

      const document = documents.find(d =>
        d.documentNumber === documentNumber
        && d.documentType === documentType,
      )

      return document || null
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.findByDocumentNumber:', error)
      throw error
    }
  }

  async create(data: Omit<DocumentEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentEntity> {
    try {
      const requestData = DocumentMapper.toApiRequest(data)
      const response = await this.apiService.createDocument(requestData)

      if (response.success && response.data)
        return DocumentMapper.fromApiResponse(response.data)

      throw new Error('Failed to create document')
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.create:', error)
      throw error
    }
  }

  async update(id: string, data: Partial<DocumentEntity>): Promise<DocumentEntity> {
    try {
      const requestData = DocumentMapper.toApiRequest(data)
      const response = await this.apiService.updateDocument(id, requestData)

      if (response.success && response.data)
        return DocumentMapper.fromApiResponse(response.data)

      throw new Error('Failed to update document')
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.update:', error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await this.apiService.deleteDocument(id)

      if (!response.success)
        throw new Error('Failed to delete document')
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.delete:', error)
      throw error
    }
  }

  async count(filters: DocumentFilterDto = {}): Promise<number> {
    try {
      // Get first page to extract total count from meta
      const filtersWithPagination = { ...filters, page: 1, per_page: 1 }
      const response = await this.apiService.getDocuments(filtersWithPagination)

      return response.meta?.total || 0
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.count:', error)

      return 0
    }
  }

  async getStats(): Promise<DocumentStatsDto> {
    try {
      return await this.apiService.getDocumentStats()
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.getStats:', error)
      throw error
    }
  }

  async findByHolder(holderId: string, holderType?: string): Promise<DocumentEntity[]> {
    try {
      const filters: DocumentFilterDto = {
        holder_id: holderId,
        ...(holderType && { holder_type: holderType }),
      }

      return await this.findAll(filters)
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.findByHolder:', error)
      throw error
    }
  }

  async findExpiring(days: number = 30): Promise<DocumentEntity[]> {
    try {
      const response = await this.apiService.getExpiringDocuments(days)

      if (response.success && Array.isArray(response.data))
        return response.data.map(item => DocumentMapper.fromApiResponse(item))

      return []
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.findExpiring:', error)
      throw error
    }
  }

  async findByStatus(status: string): Promise<DocumentEntity[]> {
    try {
      const filters: DocumentFilterDto = { status }

      return await this.findAll(filters)
    }
    catch (error) {
      console.error('Error in DocumentRepositoryImpl.findByStatus:', error)
      throw error
    }
  }
}
