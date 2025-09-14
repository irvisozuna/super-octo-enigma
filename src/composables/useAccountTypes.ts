import { computed, ref } from 'vue'
import { ACCOUNT_TYPES, getAccountTypeOptions, type AccountType } from '@/data/accountTypes'

export function useAccountTypes() {
  const searchQuery = ref('')
  
  // Opciones para VSelect con búsqueda
  const accountTypeOptions = computed(() => {
    if (!searchQuery.value) {
      return getAccountTypeOptions()
    }
    
    const lowercaseQuery = searchQuery.value.toLowerCase()
    const filteredTypes = ACCOUNT_TYPES.filter(type => 
      type.name.toLowerCase().includes(lowercaseQuery) ||
      type.description.toLowerCase().includes(lowercaseQuery)
    )
    
    return filteredTypes.map(type => ({
      title: type.name,
      value: type.name,
      subtitle: type.description,
      props: {
        prependIcon: 'tabler-credit-card',
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
  
  // Obtener todos los tipos de cuenta
  const getAllAccountTypes = () => ACCOUNT_TYPES
  
  // Obtener tipos de cuenta como opciones simples (sin búsqueda)
  const getSimpleAccountTypeOptions = () => getAccountTypeOptions()
  
  return {
    searchQuery,
    accountTypeOptions,
    updateSearch,
    clearSearch,
    getAllAccountTypes,
    getSimpleAccountTypeOptions,
  }
}
