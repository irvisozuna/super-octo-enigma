import type { DocumentRepository } from '../../domain/repositories/DocumentRepository'
import type { DocumentCreateRequest, DocumentUpdateRequest } from '../../domain/entities/DocumentEntity'
import type { DocumentCreateDto, DocumentDto, DocumentListDto, DocumentUpdateDto, DocumentUploadDto } from '../dtos/DocumentDtos'
import { DocumentMapper } from '../mappers/DocumentMapper'

export class DocumentApplicationService {
  constructor(private documentRepository: DocumentRepository) {}

  async getAllDocuments(params?: any): Promise<DocumentListDto> {
    const response = await this.documentRepository.getAll(params)

    return {
      data: response.data.map(document => DocumentMapper.toDto(document)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }

  async getDocumentById(id: string): Promise<DocumentDto> {
    const document = await this.documentRepository.getById(id)

    return DocumentMapper.toDto(document)
  }

  async createDocument(documentData: DocumentCreateDto): Promise<DocumentDto> {
    const entityData = DocumentMapper.createDtoToEntity(documentData)
    const document = await this.documentRepository.create(entityData as DocumentCreateRequest)

    return DocumentMapper.toDto(document)
  }

  async updateDocument(id: string, documentData: DocumentUpdateDto): Promise<DocumentDto> {
    const entityData = DocumentMapper.updateDtoToEntity(documentData)
    const document = await this.documentRepository.update(id, entityData as DocumentUpdateRequest)

    return DocumentMapper.toDto(document)
  }

  async deleteDocument(id: string): Promise<void> {
    await this.documentRepository.delete(id)
  }

  async uploadDocument(file: File, metadata: Omit<DocumentCreateDto, 'file'>): Promise<DocumentUploadDto> {
    const response = await this.documentRepository.upload(file, metadata)

    return {
      id: response.id,
      file_name: response.file_name,
      file_path: response.file_path,
      file_size: response.file_size,
      mime_type: response.mime_type,
      created_at: response.created_at,
    }
  }

  async downloadDocument(id: string): Promise<Blob> {
    return await this.documentRepository.download(id)
  }

  async getDocumentsByEntity(entityType: string, entityId: string, params?: any): Promise<DocumentListDto> {
    const response = await this.documentRepository.getByEntity(entityType, entityId, params)

    return {
      data: response.data.map(document => DocumentMapper.toDto(document)),
      total: response.total,
      page: response.page,
      per_page: response.per_page,
      last_page: response.last_page,
    }
  }
}
