import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useContractDataDialogStore = defineStore('contractDataDialog', () => {
  // Estado del diálogo
  const isOpen = ref(false)
  const contractData = ref<any>(null)

  // Abrir el diálogo con datos del contrato
  function openDialog(data: any) {
    contractData.value = data
    isOpen.value = true
  }

  // Cerrar el diálogo
  function closeDialog() {
    isOpen.value = false
    contractData.value = null
  }

  // Resetear completamente el estado
  function reset() {
    isOpen.value = false
    contractData.value = null
  }

  // Aplicar datos del contrato (esto se llamará desde el componente padre)
  function applyContractData(useData: boolean) {
    if (useData && contractData.value) {
      return {
        name: contractData.value.name || '',
        phone: contractData.value.phone || '',
      }
    }

    return null
  }

  return {
    isOpen,
    contractData,
    openDialog,
    closeDialog,
    reset,
    applyContractData,
  }
})
