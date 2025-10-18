import type { Document } from '../../domain/entities/DocumentEntity'
import type { DocumentCreateDto, DocumentDto, DocumentUpdateDto } from '../dtos/DocumentDtos'

export class DocumentMapper {
  static toDto(document: Document): DocumentDto {
    return {
      id: document.id,
      name: document.name,
      description: document.description,
      file_name: document.file_name,
      file_path: document.file_path,
      file_size: document.file_size,
      mime_type: document.mime_type,
      document_type: document.document_type,
      related_entity_type: document.related_entity_type,
      related_entity_id: document.related_entity_id,
      uploaded_by: document.uploaded_by,
      uploaded_by_name: document.uploaded_by_name,
      created_at: document.created_at,
      updated_at: document.updated_at,
    }
  }

  static toEntity(documentDto: DocumentDto): Document {
    return {
      id: documentDto.id,
      name: documentDto.name,
      description: documentDto.description,
      file_name: documentDto.file_name,
      file_path: documentDto.file_path,
      file_size: documentDto.file_size,
      mime_type: documentDto.mime_type,
      document_type: documentDto.document_type,
      related_entity_type: documentDto.related_entity_type,
      related_entity_id: documentDto.related_entity_id,
      uploaded_by: documentDto.uploaded_by,
      uploaded_by_name: documentDto.uploaded_by_name,
      created_at: documentDto.created_at,
      updated_at: documentDto.updated_at,
    }
  }

  static createDtoToEntity(createDto: DocumentCreateDto): Omit<Document, 'id' | 'created_at' | 'updated_at' | 'file_name' | 'file_path' | 'file_size' | 'mime_type' | 'uploaded_by' | 'uploaded_by_name'> {
    return {
      name: createDto.name,
      description: createDto.description,
      document_type: createDto.document_type,
      related_entity_type: createDto.related_entity_type,
      related_entity_id: createDto.related_entity_id,
    }
  }

  static updateDtoToEntity(updateDto: DocumentUpdateDto): Partial<Document> {
    return {
      ...(updateDto.name && { name: updateDto.name }),
      ...(updateDto.description && { description: updateDto.description }),
      ...(updateDto.document_type && { document_type: updateDto.document_type }),
    }
  }
}
