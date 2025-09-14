import { computed, ref } from 'vue'
import { type Bank, MEXICAN_BANKS, getBankOptions, searchBanks } from '@/data/banks'

export function useBanks() {
  const searchQuery = ref('')

  // Opciones para VSelect con búsqueda
  const bankOptions = computed(() => {
    if (!searchQuery.value)
      return getBankOptions()

    const filteredBanks = searchBanks(searchQuery.value)

    return filteredBanks.map(bank => ({
      title: bank.name,
      value: bank.name,
      subtitle: bank.shortName,
      props: {
        prependIcon: 'tabler-building-bank',
      },
    }))
  })

  // Función para actualizar la búsqueda
  const updateSearch = (query: string) => {
    searchQuery.value = query
  }

  // Función para limpiar la búsqueda
  const clearSearch = () => {
    searchQuery.value = ''
  }

  // Obtener todos los bancos
  const getAllBanks = () => MEXICAN_BANKS

  // Obtener bancos como opciones simples (sin búsqueda)
  const getSimpleBankOptions = () => getBankOptions()

  return {
    searchQuery,
    bankOptions,
    updateSearch,
    clearSearch,
    getAllBanks,
    getSimpleBankOptions,
  }
}
