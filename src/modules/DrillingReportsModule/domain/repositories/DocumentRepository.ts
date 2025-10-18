import type { Document, DocumentCreateRequest, DocumentListResponse, DocumentUpdateRequest, DocumentUploadResponse } from '../entities/DocumentEntity'

export interface DocumentRepository {
  getAll(params?: any): Promise<DocumentListResponse>
  getById(id: string): Promise<Document>
  create(document: DocumentCreateRequest): Promise<Document>
  update(id: string, document: DocumentUpdateRequest): Promise<Document>
  delete(id: string): Promise<void>
  upload(file: File, metadata: Omit<DocumentCreateRequest, 'file'>): Promise<DocumentUploadResponse>
  download(id: string): Promise<Blob>
  getByEntity(entityType: string, entityId: string, params?: any): Promise<DocumentListResponse>
}
