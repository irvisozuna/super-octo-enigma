export type SortOrder = 'asc' | 'desc'

export interface ReadingFilter {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_order?: SortOrder
  [key: string]: any
}

export interface ReadingDto {
  id?: string | number
  reading?: number | string
  reading_date?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface ReadingListResponseDto {
  data: ReadingDto[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}
