import { computed } from 'vue'
import { WellOptionsService } from '../../domain/services/WellOptionsService'

/**
 * Composable para opciones de pozos
 * Encapsula la lógica de presentación para opciones de formularios
 */
export function useWellOptions() {
  const statusOptions = computed(() => WellOptionsService.getStatusOptions())

  const drillingTypeOptions = computed(() => WellOptionsService.getDrillingTypeOptions())

  const holeDiameterOptions = computed(() => WellOptionsService.getHoleDiameterOptions())

  const allOptions = computed(() => WellOptionsService.getAllOptions())

  return {
    statusOptions,
    drillingTypeOptions,
    holeDiameterOptions,
    allOptions,
  }
}
