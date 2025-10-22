/**
 * Servicio de Cache específico para EmployeeModule
 * Extiende el servicio base con lógica específica de empleados
 */

import { BaseCacheService } from '@/@core/cache/services/BaseCacheService'
import { EmployeeIndexedDBService } from './EmployeeIndexedDBService'
import { CachePriority, type CacheModuleConfig } from '@/@core/cache/types/cache.types'
import type { EmployeeEntity } from '../../../domain/entities/EmployeeEntity'

export class EmployeeCacheService extends BaseCacheService<EmployeeEntity> {
  constructor() {
    const indexedDB = new EmployeeIndexedDBService()
    
    const config: CacheModuleConfig = {
      enabled: true,
      dbName: 'EmployeeModuleCache',
      dbVersion: 1,
      stores: {
        employees: {
          key: 'employees',
          priority: CachePriority.HIGH,
          ttl: 10, // 10 minutos
          maxSize: 2000,
          encrypted: false
        },
        departments: {
          key: 'departments',
          priority: CachePriority.MEDIUM,
          ttl: 30, // 30 minutos
          maxSize: 100,
          encrypted: false
        },
        statistics: {
          key: 'statistics',
          priority: CachePriority.LOW,
          ttl: 60, // 1 hora
          maxSize: 50,
          encrypted: false
        }
      },
      sync: {
        enabled: true,
        interval: 300000, // 5 minutos
        retryAttempts: 3,
        conflictResolution: 'server'
      }
    }

    super(indexedDB, config)
  }

  // ========== IMPLEMENTACIÓN DE MÉTODOS ABSTRACTOS ==========

  protected getStoreNameByKey(key: string): string {
    if (key.includes('employees_list') || key.startsWith('employee_')) {
      return 'employees'
    }
    if (key.includes('department')) {
      return 'departments'
    }
    return 'statistics'
  }

  protected getConfigByKey(key: string): { ttl: number; maxSize: number; encrypted: boolean } {
    const storeName = this.getStoreNameByKey(key)
    const config = this.config.stores[storeName]
    
    if (!config) {
      throw new Error(`Configuración no encontrada para la clave: ${key}`)
    }

    return {
      ttl: config.ttl,
      maxSize: config.maxSize,
      encrypted: config.encrypted
    }
  }

  protected transformDataForCache(data: any, key: string): any {
    // Transformaciones específicas para empleados
    if (key.includes('employees_list') && Array.isArray(data)) {
      return data.map(employee => ({
        ...employee,
        // Asegurar que los campos requeridos estén presentes
        employee_code: employee.employee_code || employee.id,
        status: employee.status || 'active',
        department: employee.department || 'unknown'
      }))
    }

    return data
  }

  protected transformDataFromCache(data: any, key: string): any {
    // Transformaciones específicas para empleados al obtener del cache
    if (key.includes('employees_list') && Array.isArray(data)) {
      return data.map(employee => ({
        ...employee,
        // Limpiar campos de cache si es necesario
        cached_at: undefined,
        version: undefined,
        sync_status: undefined
      }))
    }

    return data
  }

  // ========== MÉTODOS ESPECÍFICOS DE EMPLEADOS ==========

  /**
   * Cachear lista de empleados
   */
  async cacheEmployeesList(employees: EmployeeEntity[]): Promise<void> {
    const cacheData = employees.map(employee => ({
      id: employee.id,
      employee_code: employee.employee_code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      status: employee.status,
      hire_date: employee.hire_date,
      salary: employee.salary,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: 'synced' as const
    }))

    await this.set('employees_list', cacheData, CachePriority.HIGH)
  }

  /**
   * Cachear empleado individual
   */
  async cacheEmployee(employee: EmployeeEntity): Promise<void> {
    const cacheData = {
      id: employee.id,
      employee_code: employee.employee_code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      position: employee.position,
      status: employee.status,
      hire_date: employee.hire_date,
      salary: employee.salary,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: 'synced' as const
    }

    await this.set(`employee_${employee.id}`, cacheData, CachePriority.MEDIUM)
  }

  /**
   * Cachear departamentos
   */
  async cacheDepartments(departments: any[]): Promise<void> {
    const cacheData = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      manager_id: dept.manager_id,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: 'synced' as const
    }))

    await this.set('departments_list', cacheData, CachePriority.MEDIUM)
  }

  /**
   * Cachear estadísticas de empleados
   */
  async cacheEmployeeStats(stats: any): Promise<void> {
    const cacheData = {
      id: 'employee_stats',
      total_employees: stats.total_employees,
      active_employees: stats.active_employees,
      departments_count: stats.departments_count,
      average_salary: stats.average_salary,
      cached_at: new Date().toISOString(),
      version: Date.now(),
      sync_status: 'synced' as const
    }

    await this.set('employee_statistics', cacheData, CachePriority.LOW)
  }

  /**
   * Sincronización específica de empleados
   */
  async forceSync(): Promise<void> {
    console.log('🔄 Iniciando sincronización forzada de empleados...')
    
    // Aquí implementarías la lógica específica de sincronización
    // Por ejemplo, llamar a la API y actualizar el cache
    
    await this.updateCacheState()
    console.log('✅ Sincronización de empleados completada')
  }

  /**
   * Alternar estado del cache
   */
  async toggleCache(enabled: boolean): Promise<void> {
    this.state.isEnabled = enabled
    console.log(`🔄 Cache de empleados ${enabled ? 'habilitado' : 'deshabilitado'}`)
  }
}
