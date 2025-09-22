import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { VehicleApiService } from '../../infrastructure/api/services/VehicleApiService'
import type {
  DriverCreateDto,
  PaginatedResponseDto,
  VehicleCreateDto,
  VehicleDetailDto,
  VehicleFilterDto,
  VehicleListDto,
  VehicleUpdateDto,
} from '../../application/dtos/VehicleDtos'

export const useVehicleStore = defineStore('vehicle', () => {
  // State
  const items = ref<VehicleListDto[]>([])
  const currentItem = ref<VehicleDetailDto | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  })

  // Filters
  const filters = ref<VehicleFilterDto>({
    search: '',
    status: '',
    vehicle_type: '',
    concession_id: '',
    page: 1,
    per_page: 15,
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  // API Service
  const apiService = new VehicleApiService()

  // Getters
  const hasItems = computed(() => items.value.length > 0)
  const totalPages = computed(() => pagination.value.last_page)
  const currentPage = computed(() => pagination.value.current_page)
  const totalItems = computed(() => pagination.value.total)

  // Actions
  const fetchList = async (customFilters?: Partial<VehicleFilterDto>) => {
    loading.value = true
    error.value = null

    try {
      const mergedFilters = { ...filters.value, ...customFilters }
      const response: PaginatedResponseDto<VehicleListDto> = await apiService.getList(mergedFilters)

      items.value = response.data
      pagination.value = {
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total,
      }
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar vehículos'
      items.value = []
    }
    finally {
      loading.value = false
    }
  }

  const fetchById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      currentItem.value = await apiService.getById(id)
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar vehículo'
      currentItem.value = null
    }
    finally {
      loading.value = false
    }
  }

  const createItem = async (data: VehicleCreateDto) => {
    loading.value = true
    error.value = null

    try {
      const newItem = await apiService.create(data)

      items.value.unshift(newItem)

      return newItem
    }
    catch (err: any) {
      error.value = err.message || 'Error al crear vehículo'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateItem = async (id: string, data: VehicleUpdateDto) => {
    loading.value = true
    error.value = null

    try {
      const updatedItem = await apiService.update(id, data)
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1)
        items.value[index] = updatedItem

      if (currentItem.value?.id === id)
        currentItem.value = updatedItem

      return updatedItem
    }
    catch (err: any) {
      error.value = err.message || 'Error al actualizar vehículo'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteItem = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await apiService.delete(id)
      items.value = items.value.filter(item => item.id !== id)
      if (currentItem.value?.id === id)
        currentItem.value = null
    }
    catch (err: any) {
      error.value = err.message || 'Error al eliminar vehículo'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const getVehiclesByConcession = async (concessionId: string) => {
    try {
      return await apiService.getVehiclesByConcession(concessionId)
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar vehículos de la concesión'

      return []
    }
  }

  const assignToConcession = async (vehicleId: string, concessionId: string) => {
    try {
      return await apiService.assignVehicleToConcession(vehicleId, concessionId)
    }
    catch (err: any) {
      error.value = err.message || 'Error al asignar vehículo'
      throw err
    }
  }

  const unassignFromConcession = async (vehicleId: string) => {
    try {
      return await apiService.unassignVehicleFromConcession(vehicleId)
    }
    catch (err: any) {
      error.value = err.message || 'Error al desasignar vehículo'
      throw err
    }
  }

  // Driver actions
  const createDriver = async (data: DriverCreateDto) => {
    try {
      return await apiService.createDriver(data)
    }
    catch (err: any) {
      error.value = err.message || 'Error al crear conductor'
      throw err
    }
  }

  const addDriverToVehicle = async (vehicleId: string, driverData: DriverCreateDto) => {
    try {
      return await apiService.addDriverToVehicle(vehicleId, driverData)
    }
    catch (err: any) {
      error.value = err.message || 'Error al agregar conductor al vehículo'
      throw err
    }
  }

  const getVehicleDrivers = async (vehicleId: string) => {
    try {
      return await apiService.getVehicleDrivers(vehicleId)
    }
    catch (err: any) {
      error.value = err.message || 'Error al cargar conductores del vehículo'

      return []
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    items.value = []
    currentItem.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    }
  }

  return {
    // State
    items,
    currentItem,
    loading,
    error,
    pagination,
    filters,

    // Getters
    hasItems,
    totalPages,
    currentPage,
    totalItems,

    // Actions
    fetchList,
    fetchById,
    createItem,
    updateItem,
    deleteItem,
    getVehiclesByConcession,
    assignToConcession,
    unassignFromConcession,
    createDriver,
    addDriverToVehicle,
    getVehicleDrivers,
    clearError,
    reset,

    // API Service for direct access
    applicationService: apiService,
  }
})
