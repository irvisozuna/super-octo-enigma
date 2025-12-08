export interface ReadingsReportAdvanceCard {
  title: string
  subtitle: string
  value: string | number
  trend?: string
  trendColor?: string
  icon?: string
  badgeColor?: string
}

export interface ReadingsReportAdvanceGlobal {
  title: string
  subtitle: string
  readsSummary: string
  volumeSummary: string
  progress: number
}

export interface ReadingsReportAdvanceResult {
  cards: ReadingsReportAdvanceCard[]
  global: ReadingsReportAdvanceGlobal
  data?: any[]
  meta?: {
    total: number
    per_page?: number
    current_page?: number
    last_page?: number
  }
}
