/**
 * Transport Statistics API Service
 *
 * Service for fetching transport module statistics and analytics
 */

import { rawApi } from '@/services/api'

// Types for API responses
export interface TransportOverviewResponse {
  concessions: {
    total: number
    active: number
    suspended: number
    active_percentage: number
  }
  vehicles: {
    total: number
    active: number
    active_percentage: number
  }
  fines: {
    total: number
    paid: number
    pending: number
    paid_percentage: number
  }
  revenue: {
    total_collected: number
    pending_collection: number
    formatted_total: string
    formatted_pending: string
  }
}

export interface SummaryCard {
  title: string
  subtitle: string
  value: number
  formatted_value?: string
  change: number | null
  trend: 'up' | 'down' | 'stable'
}

export interface SummaryCardsResponse {
  fines: SummaryCard
  revenue: SummaryCard
  concessions: SummaryCard
  vehicles: SummaryCard
}

export interface FinesByPeriodData {
  period: string
  count: number
  amount: number
  formatted_amount: string
}

export interface FinesByPeriodResponse {
  period: string
  data: FinesByPeriodData[]
}

export interface ViolationType {
  id: string
  code: string
  description: string
  base_amount: string
  violations_count: number
  total_amount: number
  formatted_amount: string
  percentage: number
}

export interface ViolationTypesResponse {
  data: ViolationType[]
  total_violations: number
}

export interface FineStatusDistribution {
  status: string
  label: string
  count: number
  amount: number
  formatted_amount: string
}

export interface FineStatusDistributionResponse {
  data: FineStatusDistribution[]
}

export interface MonthlyRevenueTrend {
  month: string
  month_number: number
  year: number
  revenue: number
  fines_count: number
  formatted_revenue: string
}

export interface MonthlyRevenueTrendResponse {
  data: MonthlyRevenueTrend[]
}

export interface TopConcessionHolder {
  id: string
  name: string
  fines_count: number
  total_amount: number
  formatted_amount: string
}

export interface TopConcessionHoldersResponse {
  data: TopConcessionHolder[]
}

export interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  amount: number
  formatted_amount: string
  status: string
  created_at: string
  formatted_date: string
}

export interface RecentActivityResponse {
  data: RecentActivity[]
}

export class TransportStatisticsApiService {
  private readonly baseUrl = '/transport/statistics'

  /**
   * Get general transport overview statistics
   */
  async getOverview(): Promise<TransportOverviewResponse> {
    try {
      return await rawApi(`${this.baseUrl}/overview`)
    }
    catch (error) {
      console.error('Error fetching transport overview:', error)
      throw error
    }
  }

  /**
   * Get summary cards with comparisons
   */
  async getSummaryCards(period: 'week' | 'month' | 'year' = 'week'): Promise<SummaryCardsResponse> {
    try {
      return await rawApi(`${this.baseUrl}/summary-cards`, {
        params: { period },
      })
    }
    catch (error) {
      console.error('Error fetching summary cards:', error)
      throw error
    }
  }

  /**
   * Get fines statistics by period
   */
  async getFinesByPeriod(
    period: 'day' | 'week' | 'month' | 'year' = 'month',
    limit: number = 12,
  ): Promise<FinesByPeriodResponse> {
    try {
      return await rawApi(`${this.baseUrl}/fines-by-period`, {
        params: { period, limit },
      })
    }
    catch (error) {
      console.error('Error fetching fines by period:', error)
      throw error
    }
  }

  /**
   * Get top violation types
   */
  async getViolationTypes(limit: number = 10): Promise<ViolationTypesResponse> {
    try {
      return await rawApi(`${this.baseUrl}/violation-types`, {
        params: { limit },
      })
    }
    catch (error) {
      console.error('Error fetching violation types:', error)
      throw error
    }
  }

  /**
   * Get fines status distribution
   */
  async getFinesStatusDistribution(): Promise<FineStatusDistributionResponse> {
    try {
      return await rawApi(`${this.baseUrl}/fines-status-distribution`)
    }
    catch (error) {
      console.error('Error fetching fines status distribution:', error)
      throw error
    }
  }

  /**
   * Get monthly revenue trend
   */
  async getMonthlyRevenueTrend(months: number = 12): Promise<MonthlyRevenueTrendResponse> {
    try {
      return await rawApi(`${this.baseUrl}/monthly-revenue-trend`, {
        params: { months },
      })
    }
    catch (error) {
      console.error('Error fetching monthly revenue trend:', error)
      throw error
    }
  }

  /**
   * Get top concession holders by fines
   */
  async getTopConcessionHolders(limit: number = 10): Promise<TopConcessionHoldersResponse> {
    try {
      return await rawApi(`${this.baseUrl}/top-concession-holders`, {
        params: { limit },
      })
    }
    catch (error) {
      console.error('Error fetching top concession holders:', error)
      throw error
    }
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10): Promise<RecentActivityResponse> {
    try {
      return await rawApi(`${this.baseUrl}/recent-activity`, {
        params: { limit },
      })
    }
    catch (error) {
      console.error('Error fetching recent activity:', error)
      throw error
    }
  }
}
