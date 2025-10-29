/**
 * Composable específico para cache de empleados
 * Extiende el composable base con funcionalidad específica
 */

import { computed, ref } from 'vue'
import { EmployeeCacheService } from '../services/EmployeeCacheService'
import { useBaseCache } from '@/@core/cache/composables/useBaseCache'

// Instancia singleton del servicio de cache
let cacheServiceInstance: EmployeeCacheService | null = null

export function useEmployeeCache() {
  // Crear instancia singleton
  if (!cacheServiceInstance)
    cacheServiceInstance = new EmployeeCacheService()

  // Usar el composable base
  const baseCache = useBaseCache(cacheServiceInstance, 'EmployeeModule')

  // ========== FUNCIONALIDAD ESPECÍFICA DE EMPLEADOS ==========

  /**
   * Cachear lista de empleados
   */
  async function cacheEmployeesList(employees: any[]): Promise<void> {
    try {
      await cacheServiceInstance!.cacheEmployeesList(employees)
      await baseCache.updateCacheState()
    }
    catch (error) {
      console.error('Error cacheando lista de empleados:', error)
      throw error
    }
  }

  /**
   * Cachear empleado individual
   */
  async function cacheEmployee(employee: any): Promise<void> {
    try {
      await cacheServiceInstance!.cacheEmployee(employee)
      await baseCache.updateCacheState()
    }
    catch (error) {
      console.error('Error cacheando empleado:', error)
      throw error
    }
  }

  /**
   * Obtener lista de empleados del cache
   */
  async function getCachedEmployeesList(): Promise<any[] | null> {
    try {
      return await cacheServiceInstance!.get('employees_list')
    }
    catch (error) {
      console.error('Error obteniendo lista de empleados del cache:', error)

      return null
    }
  }

  /**
   * Obtener empleado individual del cache
   */
  async function getCachedEmployee(employeeId: string): Promise<any | null> {
    try {
      return await cacheServiceInstance!.get(`employee_${employeeId}`)
    }
    catch (error) {
      console.error('Error obteniendo empleado del cache:', error)

      return null
    }
  }

  /**
   * Cachear departamentos
   */
  async function cacheDepartments(departments: any[]): Promise<void> {
    try {
      await cacheServiceInstance!.cacheDepartments(departments)
      await baseCache.updateCacheState()
    }
    catch (error) {
      console.error('Error cacheando departamentos:', error)
      throw error
    }
  }

  /**
   * Obtener departamentos del cache
   */
  async function getCachedDepartments(): Promise<any[] | null> {
    try {
      return await cacheServiceInstance!.get('departments_list')
    }
    catch (error) {
      console.error('Error obteniendo departamentos del cache:', error)

      return null
    }
  }

  /**
   * Cachear estadísticas de empleados
   */
  async function cacheEmployeeStats(stats: any): Promise<void> {
    try {
      await cacheServiceInstance!.cacheEmployeeStats(stats)
      await baseCache.updateCacheState()
    }
    catch (error) {
      console.error('Error cacheando estadísticas de empleados:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  async function getCachedEmployeeStats(): Promise<any | null> {
    try {
      return await cacheServiceInstance!.get('employee_statistics')
    }
    catch (error) {
      console.error('Error obteniendo estadísticas del cache:', error)

      return null
    }
  }

  /**
   * Inicializar cache de empleados
   */
  async function initializeEmployeeCache(): Promise<void> {
    try {
      await cacheServiceInstance!.init()
      console.log('✅ Cache de empleados inicializado')
    }
    catch (error) {
      console.error('❌ Error inicializando cache de empleados:', error)
      throw error
    }
  }

  // ========== RETURN ==========

  return {
    // Funcionalidad base del cache
    ...baseCache,

    // Funcionalidad específica de empleados
    cacheEmployeesList,
    cacheEmployee,
    getCachedEmployeesList,
    getCachedEmployee,
    cacheDepartments,
    getCachedDepartments,
    cacheEmployeeStats,
    getCachedEmployeeStats,
    initializeEmployeeCache,
  }
}
