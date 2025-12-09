export interface EquipmentDto {
  id: string
  name: string
  equipment_type: 'drill_rig' | 'pump' | 'generator' | 'compressor' | 'crane' | 'other'
  manufacturer: string
  model: string
  serial_number: string
  specifications: {
    capacity?: number
    power?: number
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    [key: string]: any
  }
  status: 'available' | 'in_use' | 'maintenance' | 'retired'
  location: string
  purchase_date: string
  warranty_expiry?: string
  created_at: string
  updated_at: string
}

export interface EquipmentCreateDto {
  name: string
  equipment_type: 'drill_rig' | 'pump' | 'generator' | 'compressor' | 'crane' | 'other'
  manufacturer: string
  model: string
  serial_number: string
  specifications: {
    capacity?: number
    power?: number
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    [key: string]: any
  }
  location: string
  purchase_date: string
  warranty_expiry?: string
}

export interface EquipmentUpdateDto {
  name?: string
  equipment_type?: 'drill_rig' | 'pump' | 'generator' | 'compressor' | 'crane' | 'other'
  manufacturer?: string
  model?: string
  serial_number?: string
  specifications?: {
    capacity?: number
    power?: number
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    [key: string]: any
  }
  status?: 'available' | 'in_use' | 'maintenance' | 'retired'
  location?: string
  purchase_date?: string
  warranty_expiry?: string
}

export interface EquipmentListDto {
  data: EquipmentDto[]
  total: number
  page: number
  per_page: number
  last_page: number
}
