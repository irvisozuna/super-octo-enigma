/**
 * Transport Statistics Store
 *
 * Pinia store for managing transport module statistics and analytics
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  type FineStatusDistributionResponse,
  type FinesByPeriodResponse,
  type MonthlyRevenueTrendResponse,
  type RecentActivityResponse,
  type SummaryCardsResponse,
  type TopConcessionHoldersResponse,
  type TransportOverviewResponse,
  TransportStatisticsApiService,
  type ViolationTypesResponse,
} from '../../infrastructure/api/services/TransportStatisticsApiService'

export const useTransportStatisticsStore = defineStore('transport-statistics', () => {
  // Services
  const apiService = new TransportStatisticsApiService()

  // State
  const overview = ref<TransportOverviewResponse | null>(null)
  const summaryCards = ref<SummaryCardsResponse | null>(null)
  const finesByPeriod = ref<FinesByPeriodResponse | null>(null)
  const violationTypes = ref<ViolationTypesResponse | null>(null)
  const finesStatusDistribution = ref<FineStatusDistributionResponse | null>(null)
  const monthlyRevenueTrend = ref<MonthlyRevenueTrendResponse | null>(null)
  const topConcessionHolders = ref<TopConcessionHoldersResponse | null>(null)
  const recentActivity = ref<RecentActivityResponse | null>(null)

  // Loading states
  const loading = ref({
    overview: false,
    summaryCards: false,
    finesByPeriod: false,
    violationTypes: false,
    finesStatusDistribution: false,
    monthlyRevenueTrend: false,
    topConcessionHolders: false,
    recentActivity: false,
  })

  // Error states
  const errors = ref({
    overview: null as string | null,
    summaryCards: null as string | null,
    finesByPeriod: null as string | null,
    violationTypes: null as string | null,
    finesStatusDistribution: null as string | null,
    monthlyRevenueTrend: null as string | null,
    topConcessionHolders: null as string | null,
    recentActivity: null as string | null,
  })

  // Computed
  const isLoadingAny = computed(() =>
    Object.values(loading.value).some(isLoading => isLoading),
  )

  const hasAnyErrors = computed(() =>
    Object.values(errors.value).some(error => error !== null),
  )

  const hasData = computed(() => ({
    overview: overview.value !== null,
    summaryCards: summaryCards.value !== null,
    finesByPeriod: finesByPeriod.value !== null && finesByPeriod.value.data.length > 0,
    violationTypes: violationTypes.value !== null && violationTypes.value.data.length > 0,
    finesStatusDistribution: finesStatusDistribution.value !== null && finesStatusDistribution.value.data.length > 0,
    monthlyRevenueTrend: monthlyRevenueTrend.value !== null && monthlyRevenueTrend.value.data.length > 0,
    topConcessionHolders: topConcessionHolders.value !== null && topConcessionHolders.value.data.length > 0,
    recentActivity: recentActivity.value !== null && recentActivity.value.data.length > 0,
  }))

  // Mock data generators for when API fails
  const generateMockOverview = (): TransportOverviewResponse => ({
    concessions: {
      total: 45,
      active: 42,
      suspended: 3,
      active_percentage: 93.3,
    },
    vehicles: {
      total: 89,
      active: 85,
      active_percentage: 95.5,
    },
    fines: {
      total: 1247,
      paid: 1103,
      pending: 144,
      paid_percentage: 88.5,
    },
    revenue: {
      total_collected: 1875000.00,
      pending_collection: 216000.00,
      formatted_total: '$1,875,000.00',
      formatted_pending: '$216,000.00',
    },
  })

  const generateMockSummaryCards = (): SummaryCardsResponse => ({
    fines: {
      title: 'Multas',
      subtitle: 'Esta semana',
      value: 124,
      change: 12.6,
      trend: 'up',
    },
    revenue: {
      title: 'Ingresos',
      subtitle: 'Esta semana',
      value: 467300.00,
      formatted_value: '$467,300.00',
      change: 25.2,
      trend: 'up',
    },
    concessions: {
      title: 'Concesiones Activas',
      subtitle: 'Total activas',
      value: 42,
      change: null,
      trend: 'stable',
    },
    vehicles: {
      title: 'Vehículos Activos',
      subtitle: 'Total activos',
      value: 85,
      change: null,
      trend: 'stable',
    },
  })

  // Actions
  const fetchOverview = async () => {
    loading.value.overview = true
    errors.value.overview = null

    try {
      overview.value = await apiService.getOverview()
    }
    catch (error: any) {
      console.warn('Failed to fetch overview from API, using mock data:', error)
      errors.value.overview = error.message || 'Error al cargar resumen general'
      overview.value = generateMockOverview()
    }
    finally {
      loading.value.overview = false
    }
  }

  const fetchSummaryCards = async (period: 'week' | 'month' | 'year' = 'week') => {
    loading.value.summaryCards = true
    errors.value.summaryCards = null

    try {
      summaryCards.value = await apiService.getSummaryCards(period)
    }
    catch (error: any) {
      console.warn('Failed to fetch summary cards from API, using mock data:', error)
      errors.value.summaryCards = error.message || 'Error al cargar tarjetas de resumen'
      summaryCards.value = generateMockSummaryCards()
    }
    finally {
      loading.value.summaryCards = false
    }
  }

  const fetchFinesByPeriod = async (period: 'day' | 'week' | 'month' | 'year' = 'month', limit: number = 12) => {
    loading.value.finesByPeriod = true
    errors.value.finesByPeriod = null

    try {
      finesByPeriod.value = await apiService.getFinesByPeriod(period, limit)
    }
    catch (error: any) {
      console.warn('Failed to fetch fines by period from API:', error)
      errors.value.finesByPeriod = error.message || 'Error al cargar multas por período'
      finesByPeriod.value = { period, data: [] }
    }
    finally {
      loading.value.finesByPeriod = false
    }
  }

  const fetchViolationTypes = async (limit: number = 10) => {
    loading.value.violationTypes = true
    errors.value.violationTypes = null

    try {
      violationTypes.value = await apiService.getViolationTypes(limit)
    }
    catch (error: any) {
      console.warn('Failed to fetch violation types from API:', error)
      errors.value.violationTypes = error.message || 'Error al cargar tipos de violación'
      violationTypes.value = { data: [], total_violations: 0 }
    }
    finally {
      loading.value.violationTypes = false
    }
  }

  const fetchFinesStatusDistribution = async () => {
    loading.value.finesStatusDistribution = true
    errors.value.finesStatusDistribution = null

    try {
      finesStatusDistribution.value = await apiService.getFinesStatusDistribution()
    }
    catch (error: any) {
      console.warn('Failed to fetch fines status distribution from API:', error)
      errors.value.finesStatusDistribution = error.message || 'Error al cargar distribución de estados'
      finesStatusDistribution.value = { data: [] }
    }
    finally {
      loading.value.finesStatusDistribution = false
    }
  }

  const fetchMonthlyRevenueTrend = async (months: number = 12) => {
    loading.value.monthlyRevenueTrend = true
    errors.value.monthlyRevenueTrend = null

    try {
      monthlyRevenueTrend.value = await apiService.getMonthlyRevenueTrend(months)
    }
    catch (error: any) {
      console.warn('Failed to fetch monthly revenue trend from API:', error)
      errors.value.monthlyRevenueTrend = error.message || 'Error al cargar tendencia de ingresos'
      monthlyRevenueTrend.value = { data: [] }
    }
    finally {
      loading.value.monthlyRevenueTrend = false
    }
  }

  const fetchTopConcessionHolders = async (limit: number = 10) => {
    loading.value.topConcessionHolders = true
    errors.value.topConcessionHolders = null

    try {
      topConcessionHolders.value = await apiService.getTopConcessionHolders(limit)
    }
    catch (error: any) {
      console.warn('Failed to fetch top concession holders from API:', error)
      errors.value.topConcessionHolders = error.message || 'Error al cargar top concesionarios'
      topConcessionHolders.value = { data: [] }
    }
    finally {
      loading.value.topConcessionHolders = false
    }
  }

  const fetchRecentActivity = async (limit: number = 10) => {
    loading.value.recentActivity = true
    errors.value.recentActivity = null

    try {
      recentActivity.value = await apiService.getRecentActivity(limit)
    }
    catch (error: any) {
      console.warn('Failed to fetch recent activity from API:', error)
      errors.value.recentActivity = error.message || 'Error al cargar actividad reciente'
      recentActivity.value = { data: [] }
    }
    finally {
      loading.value.recentActivity = false
    }
  }

  const fetchAllData = async () => {
    await Promise.allSettled([
      fetchOverview(),
      fetchSummaryCards(),
      fetchFinesByPeriod(),
      fetchViolationTypes(),
      fetchFinesStatusDistribution(),
      fetchMonthlyRevenueTrend(),
      fetchTopConcessionHolders(),
      fetchRecentActivity(),
    ])
  }

  const clearErrors = () => {
    Object.keys(errors.value).forEach(key => {
      errors.value[key as keyof typeof errors.value] = null
    })
  }

  const clearData = () => {
    overview.value = null
    summaryCards.value = null
    finesByPeriod.value = null
    violationTypes.value = null
    finesStatusDistribution.value = null
    monthlyRevenueTrend.value = null
    topConcessionHolders.value = null
    recentActivity.value = null
  }

  return {
    // State
    overview,
    summaryCards,
    finesByPeriod,
    violationTypes,
    finesStatusDistribution,
    monthlyRevenueTrend,
    topConcessionHolders,
    recentActivity,
    loading,
    errors,

    // Computed
    isLoadingAny,
    hasAnyErrors,
    hasData,

    // Actions
    fetchOverview,
    fetchSummaryCards,
    fetchFinesByPeriod,
    fetchViolationTypes,
    fetchFinesStatusDistribution,
    fetchMonthlyRevenueTrend,
    fetchTopConcessionHolders,
    fetchRecentActivity,
    fetchAllData,
    clearErrors,
    clearData,
  }
})
