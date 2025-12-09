export interface DocumentDto {
  id: string
  name: string
  description?: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  document_type: 'report' | 'permit' | 'certificate' | 'manual' | 'other'
  related_entity_type: 'project' | 'well' | 'report' | 'tool' | 'employee'
  related_entity_id: string
  uploaded_by: string
  uploaded_by_name: string
  created_at: string
  updated_at: string
}

export interface DocumentCreateDto {
  name: string
  description?: string
  file: File
  document_type: 'report' | 'permit' | 'certificate' | 'manual' | 'other'
  related_entity_type: 'project' | 'well' | 'report' | 'tool' | 'employee'
  related_entity_id: string
}

export interface DocumentUpdateDto {
  name?: string
  description?: string
  document_type?: 'report' | 'permit' | 'certificate' | 'manual' | 'other'
}

export interface DocumentListDto {
  data: DocumentDto[]
  total: number
  page: number
  per_page: number
  last_page: number
}

export interface DocumentUploadDto {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
}
