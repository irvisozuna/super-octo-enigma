import type {
  DriverCreateDto,
  DriverDetailDto,
  DriverFilterDto,
  DriverListDto,
  DriverUpdateDto,
  PaginatedResponseDto,
  VehicleCreateDto,
  VehicleDetailDto,
  VehicleFilterDto,
  VehicleListDto,
  VehicleUpdateDto,
} from '../../application/dtos/VehicleDtos'
import { rawApi } from '@/services/api'

export class VehicleApiService {
  private readonly baseUrl = '/transport/vehicles'
  private readonly driversUrl = '/transport/drivers'

  // Vehicle methods
  async getList(filters: VehicleFilterDto = {}): Promise<PaginatedResponseDto<VehicleListDto>> {
    const params = new URLSearchParams()

    if (filters.search)
      params.append('search', filters.search)
    if (filters.status)
      params.append('status', filters.status)
    if (filters.vehicle_type)
      params.append('vehicle_type', filters.vehicle_type)
    if (filters.concession_id)
      params.append('concession_id', filters.concession_id)
    if (filters.page)
      params.append('page', filters.page.toString())
    if (filters.per_page)
      params.append('per_page', filters.per_page.toString())
    if (filters.sort_by)
      params.append('sort_by', filters.sort_by)
    if (filters.sort_order)
      params.append('sort_order', filters.sort_order)

    return await rawApi(`${this.baseUrl}?${params.toString()}`, {
      method: 'GET',
    })
  }

  async getById(id: string): Promise<VehicleDetailDto> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'GET',
    })
  }

  async create(data: VehicleCreateDto): Promise<VehicleDetailDto> {
    return await rawApi(this.baseUrl, {
      method: 'POST',
      body: data,
    })
  }

  async update(id: string, data: VehicleUpdateDto): Promise<VehicleDetailDto> {
    return await rawApi(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  async delete(id: string): Promise<void> {
    await rawApi(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  async getVehiclesByConcession(concessionId: string): Promise<VehicleListDto[]> {
    const response = await this.getList({ concession_id: concessionId, per_page: 100 })

    return response.data
  }

  // Driver methods
  async getDrivers(filters: DriverFilterDto = {}): Promise<PaginatedResponseDto<DriverListDto>> {
    const params = new URLSearchParams()

    if (filters.search)
      params.append('search', filters.search)
    if (filters.status)
      params.append('status', filters.status)
    if (filters.license_type)
      params.append('license_type', filters.license_type)
    if (filters.vehicle_id)
      params.append('vehicle_id', filters.vehicle_id)
    if (filters.concession_id)
      params.append('concession_id', filters.concession_id)
    if (filters.page)
      params.append('page', filters.page.toString())
    if (filters.per_page)
      params.append('per_page', filters.per_page.toString())
    if (filters.sort_by)
      params.append('sort_by', filters.sort_by)
    if (filters.sort_order)
      params.append('sort_order', filters.sort_order)

    return await rawApi(`${this.driversUrl}?${params.toString()}`, {
      method: 'GET',
    })
  }

  async getDriverById(id: string): Promise<DriverDetailDto> {
    return await rawApi(`${this.driversUrl}/${id}`, {
      method: 'GET',
    })
  }

  async createDriver(data: DriverCreateDto): Promise<DriverDetailDto> {
    return await rawApi(this.driversUrl, {
      method: 'POST',
      body: data,
    })
  }

  async updateDriver(id: string, data: DriverUpdateDto): Promise<DriverDetailDto> {
    return await rawApi(`${this.driversUrl}/${id}`, {
      method: 'PUT',
      body: data,
    })
  }

  async deleteDriver(id: string): Promise<void> {
    await rawApi(`${this.driversUrl}/${id}`, {
      method: 'DELETE',
    })
  }

  async getVehicleDrivers(vehicleId: string): Promise<DriverListDto[]> {
    return await rawApi(`${this.baseUrl}/${vehicleId}/drivers`, {
      method: 'GET',
    })
  }

  async addDriverToVehicle(vehicleId: string, driverData: DriverCreateDto): Promise<DriverDetailDto> {
    return await rawApi(`${this.baseUrl}/${vehicleId}/drivers`, {
      method: 'POST',
      body: driverData,
    })
  }

  async assignVehicleToConcession(vehicleId: string, concessionId: string): Promise<VehicleDetailDto> {
    // Primero, desasignar cualquier vehículo existente en esta concesión
    await this.unassignAllVehiclesFromConcession(concessionId)

    // Luego asignar el nuevo vehículo
    return await rawApi(`${this.baseUrl}/${vehicleId}/assign`, {
      method: 'POST',
      body: {
        concession_id: concessionId,
      },
    })
  }

  async unassignAllVehiclesFromConcession(concessionId: string): Promise<void> {
    // Obtener todos los vehículos asignados a esta concesión
    const vehicles = await this.getVehiclesByConcession(concessionId)

    // Desasignar cada vehículo
    for (const vehicle of vehicles)
      await this.unassignVehicleFromConcession(vehicle.id)
  }

  async unassignVehicleFromConcession(vehicleId: string): Promise<VehicleDetailDto> {
    return await rawApi(`${this.baseUrl}/${vehicleId}/unassign`, {
      method: 'POST',
    })
  }
}
