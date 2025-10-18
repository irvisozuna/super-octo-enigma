import { Tool, ToolCreateRequest, ToolListResponse, ToolUpdateRequest } from '../../domain/entities/ToolEntity'

export interface ToolDto {
  id: string
  name: string
  tool_type: 'drill_bit' | 'casing' | 'cement' | 'mud' | 'pump' | 'other'
  manufacturer: string
  model: string
  serial_number: string
  specifications: {
    diameter?: number
    length?: number
    weight?: number
    material?: string
    [key: string]: any
  }
  status: 'available' | 'in_use' | 'maintenance' | 'retired'
  location: string
  purchase_date: string
  warranty_expiry?: string
  created_at: string
  updated_at: string
}

export interface ToolCreateDto {
  name: string
  tool_type: 'drill_bit' | 'casing' | 'cement' | 'mud' | 'pump' | 'other'
  manufacturer: string
  model: string
  serial_number: string
  specifications: {
    diameter?: number
    length?: number
    weight?: number
    material?: string
    [key: string]: any
  }
  location: string
  purchase_date: string
  warranty_expiry?: string
}

export interface ToolUpdateDto {
  name?: string
  tool_type?: 'drill_bit' | 'casing' | 'cement' | 'mud' | 'pump' | 'other'
  manufacturer?: string
  model?: string
  serial_number?: string
  specifications?: {
    diameter?: number
    length?: number
    weight?: number
    material?: string
    [key: string]: any
  }
  status?: 'available' | 'in_use' | 'maintenance' | 'retired'
  location?: string
  purchase_date?: string
  warranty_expiry?: string
}

export interface ToolListDto {
  data: ToolDto[]
  total: number
  page: number
  per_page: number
  last_page: number
}
