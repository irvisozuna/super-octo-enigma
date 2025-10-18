import type { DocumentRepository } from '../../../domain/repositories/DocumentRepository'
import type { Document, DocumentCreateRequest, DocumentListResponse, DocumentUpdateRequest, DocumentUploadResponse } from '../../../domain/entities/DocumentEntity'
import type { DocumentApiService } from '../../api/services/DocumentApiService'

export class DocumentRepositoryImpl implements DocumentRepository {
  constructor(private documentApiService: DocumentApiService) {}

  async getAll(params?: any): Promise<DocumentListResponse> {
    return await this.documentApiService.getDocuments(params)
  }

  async getById(id: string): Promise<Document> {
    return await this.documentApiService.getDocumentById(id)
  }

  async create(document: DocumentCreateRequest): Promise<Document> {
    return await this.documentApiService.createDocument(document)
  }

  async update(id: string, document: DocumentUpdateRequest): Promise<Document> {
    return await this.documentApiService.updateDocument(id, document)
  }

  async delete(id: string): Promise<void> {
    return await this.documentApiService.deleteDocument(id)
  }

  async upload(file: File, metadata: Omit<DocumentCreateRequest, 'file'>): Promise<DocumentUploadResponse> {
    return await this.documentApiService.uploadDocument(file, metadata)
  }

  async download(id: string): Promise<Blob> {
    return await this.documentApiService.downloadDocument(id)
  }

  async getByEntity(entityType: string, entityId: string, params?: any): Promise<DocumentListResponse> {
    return await this.documentApiService.getDocumentsByEntity(entityType, entityId, params)
  }
}
