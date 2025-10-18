import { Well, WellCreateRequest, WellListResponse, WellUpdateRequest } from '../../domain/entities/WellEntity'

export interface WellDto {
  id: string
  name: string
  project_id: string
  project_name: string
  well_type: 'exploration' | 'production' | 'injection' | 'monitoring'
  depth_planned: number
  depth_actual?: number
  diameter: number
  coordinates: {
    latitude: number
    longitude: number
  }
  status: 'planned' | 'drilling' | 'completed' | 'abandoned'
  start_date?: string
  completion_date?: string
  created_at: string
  updated_at: string
}

export interface WellCreateDto {
  name: string
  project_id: string
  well_type: 'exploration' | 'production' | 'injection' | 'monitoring'
  depth_planned: number
  diameter: number
  coordinates: {
    latitude: number
    longitude: number
  }
  start_date?: string
}

export interface WellUpdateDto {
  name?: string
  well_type?: 'exploration' | 'production' | 'injection' | 'monitoring'
  depth_planned?: number
  depth_actual?: number
  diameter?: number
  coordinates?: {
    latitude: number
    longitude: number
  }
  status?: 'planned' | 'drilling' | 'completed' | 'abandoned'
  start_date?: string
  completion_date?: string
}

export interface WellListDto {
  data: WellDto[]
  total: number
  page: number
  per_page: number
  last_page: number
}
