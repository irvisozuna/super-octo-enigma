import { ref } from 'vue'
import { GetConcessionHolderByIdUseCase } from '../../application/use-cases/GetConcessionHolderByIdUseCase'
import { UpdateConcessionHolderUseCase } from '../../application/use-cases/UpdateConcessionHolderUseCase'
import { ConcessionHolderRepositoryImpl } from '../../infrastructure/repositories/ConcessionHolderRepositoryImpl'
import { ConcessionHolderApiService } from '../../infrastructure/api/services/ConcessionHolderApiService'
import type { ConcessionHolderDetailDto, ConcessionHolderUpdateDto } from '../../application/dtos/ConcessionHolderDtos'

export function useConcessionHolderEdit() {
  // Inyección de dependencias
  const apiService = new ConcessionHolderApiService()
  const repository = new ConcessionHolderRepositoryImpl(apiService)
  const getConcessionHolderByIdUseCase = new GetConcessionHolderByIdUseCase(repository)
  const updateConcessionHolderUseCase = new UpdateConcessionHolderUseCase(repository)

  // Estado
  const holder = ref<ConcessionHolderDetailDto | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Casos de uso
  const loadHolder = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      holder.value = await getConcessionHolderByIdUseCase.execute(id)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar el titular'
      console.error('Error loading holder:', err)
    }
    finally {
      loading.value = false
    }
  }

  const updateHolder = async (id: string, data: ConcessionHolderUpdateDto) => {
    try {
      loading.value = true
      error.value = null
      holder.value = await updateConcessionHolderUseCase.execute(id, data)

      return holder.value
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar el titular'
      console.error('Error updating holder:', err)
      throw err
    }
    finally {
      loading.value = false
    }
  }

  return {
    // Estado
    holder,
    loading,
    error,

    // Casos de uso
    loadHolder,
    updateHolder,
  }
}
