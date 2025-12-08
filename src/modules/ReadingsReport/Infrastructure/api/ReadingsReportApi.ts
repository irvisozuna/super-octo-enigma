import type { ReadingsReportAdvanceCard, ReadingsReportAdvanceGlobal, ReadingsReportAdvanceResult } from '../../domain/value-objects/ReadingsReportAdvance'
import type { ReadingsReport } from '../../shared/types/ReadingsReport'
import { rawApi } from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

export interface ReadingsReportFilters {
  search?: string
  contract_id?: number | null
  customer_id?: number | null
  period_id?: number | null
  sector_id?: number | null
  route_id?: number | null
  status?: string | null
  from?: string | null
  to?: string | null
}

export interface ReadingsReportListParams extends ReadingsReportFilters {
  page?: number
  per_page?: number
  sort_by?: string
  sort_desc?: 0 | 1
}

// Params y respuesta para el endpoint de avance (routes-progress)
export interface ReadingsAdvanceParams extends ReadingsReportFilters {
  page?: number
  per_page?: number
  sort_by?: string
  sort_desc?: 0 | 1
}

export interface ReadingsAdvanceResponse {
  data: any[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}

export interface ReadingsReportListResponse {
  data: ReadingsReport[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Rutas descargadas (listado general de rutas)
export interface RoutesListParams {
  page?: number
  per_page?: number
  period_id?: number
  status?: string
  sort_by?: string
  sort_desc?: 0 | 1
}

export interface RoutesListResponse {
  data: any[]
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}

export async function fetchReadingsReportList(
  params: ReadingsReportListParams,
): Promise<ReadingsReportListResponse> {
  const endpoint = ENDPOINTS.READINGS || '/api/readings'

  const response = await rawApi(endpoint, {
    method: 'GET',
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      contract_id: params.contract_id || undefined,
      customer_id: params.customer_id || undefined,
      period_id: params.period_id || undefined,
      sector_id: params.sector_id || undefined,
      route_id: params.route_id || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      sort_by: params.sort_by || 'id',
      sort_desc: params.sort_desc ?? 0,
    },
  })

  return {
    data: response?.data ?? [],
    meta: response?.meta ?? {
      current_page: 1,
      last_page: 1,
      per_page: params.per_page ?? 15,
      total: (response?.data ?? []).length,
    },
  }
}

export async function fetchReadingsReportAdvance(
  params: ReadingsReportListParams = {},
): Promise<ReadingsReportAdvanceResult> {
  const endpoint
    = ENDPOINTS.READINGS_PERIOD_CONSUMPTION
    || '/readings/report/period-consumption'

  const response = await rawApi(endpoint, {
    method: 'GET',
    params: {
      page: params.page,
      per_page: params.per_page,

      // filtra por periodo si aplica
      period_id: params.period_id || undefined,
      search: params.search || undefined,
      contract_id: params.contract_id || undefined,
      customer_id: params.customer_id || undefined,
      sector_id: params.sector_id || undefined,
      route_id: params.route_id || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      sort_by: params.sort_by || 'id',
      sort_desc: params.sort_desc ?? 0,
    },
  })

  const payload = response?.data?.data ? response.data : response
  const body = (payload as any)?.data ?? payload

  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.data?.data)
      ? payload.data.data
      : []

  const meta = payload?.meta ?? payload?.data?.meta ?? { total: list.length }

  const cards = payload?.cards ?? payload?.data?.cards ?? []
  const global = (payload?.global ?? payload?.data?.global ?? {}) as Partial<ReadingsReportAdvanceGlobal>

  // Soporte para payload plano de consumo/avance de periodo
  const totalReadings = (payload as any)?.total_readings ?? (payload as any)?.totalReadings
  const totalContracts = (payload as any)?.total_downloaded ?? (payload as any)?.totalDownloaded
  const totalConsumption = (payload as any)?.total_consumption ?? (payload as any)?.totalConsumption
  const progressPercent = (payload as any)?.progress_percent ?? (payload as any)?.progressPercent

  return {
    cards: cards as ReadingsReportAdvanceCard[],
    global: {
      title: global.title ?? 'Avance global',
      subtitle: global.subtitle ?? '',
      readsSummary: global.readsSummary
        ?? (global as any).reads_summary
        ?? (totalReadings != null && totalContracts != null ? `${totalReadings} / ${totalContracts}` : ''),
      volumeSummary: global.volumeSummary
        ?? (global as any).volume_summary
        ?? (totalConsumption != null ? `${totalConsumption}` : ''),
      progress: Number(
        global.progress
        ?? (global as any).progress_percent
        ?? (global as any).progressPercent
        ?? progressPercent
        ?? 0,
      ),
    },
    data: list,
    meta,
  }
}

export async function exportReadingsReport(
  type: 'excel' | 'pdf',
  params: ReadingsReportListParams,
): Promise<Blob> {
  const endpoint = (ENDPOINTS.READINGS as string) || '/readings'

  const blob = await rawApi(endpoint, {
    method: 'GET',
    responseType: 'blob',
    params: {
      export_type: type,
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      contract_id: params.contract_id || undefined,
      customer_id: params.customer_id || undefined,
      period_id: params.period_id || undefined,
      sector_id: params.sector_id || undefined,
      route_id: params.route_id || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      sort_by: params.sort_by || 'id',
      sort_desc: params.sort_desc ?? 0,
    },
  })

  return blob as Blob
}

// Endpoint de avance por ruta (routes-progress)
export async function fetchRoutesProgress(
  params: ReadingsAdvanceParams = {},
): Promise<ReadingsAdvanceResponse> {
  const endpoint = ENDPOINTS.READINGS_ADVANCE || '/routes-progress'

  const response = await rawApi(endpoint, {
    method: 'GET',
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      contract_id: params.contract_id || undefined,
      customer_id: params.customer_id || undefined,
      period_id: params.period_id || undefined,
      sector_id: params.sector_id || undefined,
      route_id: params.route_id || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      sort_by: params.sort_by || 'id',
      sort_desc: params.sort_desc ?? 0,
    },
  })

  return {
    data: response?.data ?? [],
    meta: response?.meta,
  }
}

// Lista de rutas (descargadas u otros estados) por periodo
export async function fetchRoutesList(
  params: RoutesListParams = {},
): Promise<RoutesListResponse> {
  const endpoint = ENDPOINTS.ROUTES || '/routes'

  const response = await rawApi(endpoint, {
    method: 'GET',
    params: {
      page: params.page,
      per_page: params.per_page,
      period_id: params.period_id,
      status: params.status,
      sort_by: params.sort_by || 'id',
      sort_desc: params.sort_desc ?? 0,
    },
  })

  const data = response?.data ?? []
  const meta = response?.meta ?? { total: data.length }

  return { data, meta }
}
