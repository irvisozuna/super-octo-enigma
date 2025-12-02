// src/modules/ReadingsReport/api/readingsReport.api.ts

import type { ReadingsReport } from '../../types/ReadingsReport'
import { rawApi } from '@/services/api' // ajusta la ruta si es distinta
import { ENDPOINTS } from '@/services/endpoints'

/**
 * Filtros disponibles en el reporte
 */
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

/**
 * Parámetros para listar (filtros + paginación + sort)
 */
export interface ReadingsReportListParams extends ReadingsReportFilters {
  page?: number
  per_page?: number
  sort_by?: string
  sort_desc?: 0 | 1
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

/**
 * Obtiene la lista paginada de lecturas para el reporte,
 * respetando filtros, búsqueda y ordenamiento server-side.
 */
export async function fetchReadingsReportList(
  params: ReadingsReportListParams,
): Promise<ReadingsReportListResponse> {
  // Normalmente ENDPOINTS.READINGS debería ser algo tipo '/api/readings'
  const endpoint = ENDPOINTS.READINGS || '/api/readings'

  const response = await rawApi(endpoint, {
    method: 'GET',
    params: {
      page: params.page,
      per_page: params.per_page,

      // filtros
      search: params.search || undefined,
      contract_id: params.contract_id || undefined,
      customer_id: params.customer_id || undefined,
      period_id: params.period_id || undefined,
      sector_id: params.sector_id || undefined,
      route_id: params.route_id || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,

      // sort
      sort_by: params.sort_by || 'id',
      sort_desc: params.sort_desc ?? 0,
    },

    // responseType: 'json' es default, no hace falta ponerlo
  })

  // rawApi ya devuelve JSON parseado
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

/**
 * Exporta el reporte de lecturas (por ejemplo a Excel o PDF).
 * Ajusta el endpoint según tengas tu ruta en el backend.
 */
export async function exportReadingsReport(
  type: 'excel' | 'pdf',
  params: ReadingsReportListParams,
): Promise<Blob> {
  const endpoint = (ENDPOINTS.READINGS as string) || '/readings'

  const blob = await rawApi(endpoint, {
    method: 'GET',
    responseType: 'blob', // 👈 importante para archivos
    params: {
      export_type: type,

      page: params.page,
      per_page: params.per_page,

      // mismos filtros
      search: params.search || undefined,
      contract_id: params.contract_id || undefined,
      customer_id: params.customer_id || undefined,
      period_id: params.period_id || undefined,
      sector_id: params.sector_id || undefined,
      route_id: params.route_id || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,

      // mismo sort
      sort_by: params.sort_by || 'id',
      sort_desc: params.sort_desc ?? 0,
    },
  })

  // rawApi con responseType 'blob' ya devuelve un Blob
  return blob as Blob
}
