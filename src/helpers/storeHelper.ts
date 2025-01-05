// Asegúrate de que este sea el Pinia principal
import { store } from '@/plugins/2.pinia';
import { stores } from '@/stores/crudFactory'; // Ajusta con la ubicación real

/**
 * Obtiene dinámicamente un store basado en su `storeId`
 * @param storeId - Identificador único del store
 */
export function getStoreById(storeId: string) {
  // Verifica si el store ya está registrado
  const existingStore = store._s.get(storeId);
  if (existingStore) {
    return existingStore;
  }

  // Si no está registrado, busca en las factorías
  const storeFactory = stores[storeId];
  if (!storeFactory) {
    throw new Error(`No se encontró un store para el storeId: ${storeId}`);
  }

  // Registra y devuelve el store
  return storeFactory();
}
