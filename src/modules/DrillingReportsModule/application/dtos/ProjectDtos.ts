import { Project, ProjectCreateRequest, ProjectListResponse, ProjectUpdateRequest } from '../../domain/entities/ProjectEntity'

export interface ProjectDto {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'cancelled' | 'on_hold'
  client_id: string
  client_name: string
  location: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  created_at: string
  updated_at: string
}

export interface ProjectCreateDto {
  name: string
  description: string
  start_date: string
  end_date: string
  client_id: string
  location: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface ProjectUpdateDto {
  name?: string
  description?: string
  start_date?: string
  end_date?: string
  status?: 'active' | 'completed' | 'cancelled' | 'on_hold'
  location?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface ProjectListDto {
  data: ProjectDto[]
  total: number
  page: number
  per_page: number
  last_page: number
}
