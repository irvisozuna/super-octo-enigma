<script setup lang="ts">
import { ref } from 'vue'
import type { Paymentmandate } from '../types/paymentmandate'
import { useAppManager } from '@/composables/useAppManager'
import { usePaymentmandateStore } from '@/modules/paymentmandate/stores/paymentmandateStore'

// Props del diálogo
const props = defineProps({
  item: {
    type: Object as () => Paymentmandate,
    required: false, // Puede no venir si es eliminación masiva
  },
})

const { closeDialog } = useAppManager()

const paymentmandateStore = usePaymentmandateStore()
const itemData = ref<Paymentmandate | null>(props.item ?? null)
const selectedItems = ref(paymentmandateStore.selectedItems) // Elementos seleccionados

// Método para cerrar el diálogo
function close() {
  closeDialog()
}

async function deleteItem() {
  try {
    if (itemData.value?.id) {
    // Eliminar un solo elemento
      await paymentmandateStore.deleteItem(itemData.value.id)
    }
    else if (selectedItems.value.length > 0) {
      // Eliminar elementos seleccionados
      const idsToDelete = selectedItems.value.map(item => item.id)

      await paymentmandateStore.batchAction(idsToDelete, 'delete')
    }
    close()
  }
  catch (error) {
    console.error('Error deleting paymentmandate(s):', error)
  }
  finally {
    close()
  }
}
</script>

<template>
  <VCard>
    <VCardTitle>
      {{ itemData?.id
        ? $t('delete')
        : $t('deleteSelected', { count: selectedItems.length }) }}
    </VCardTitle>
    <VCardText>
      <p
        v-if="itemData?.id"
        v-html="$t('Are you sure you want to delete', { name: itemData.name })"
      />
      <p v-else>
        {{ selectedItems.length > 1
          ? $t('Are you sure you want to delete these items', { count: selectedItems.length, module: $t('paymentmandates') })
          : $t('Are you sure you want to delete these items', { count: selectedItems.length, module: $t('paymentmandate') })
        }}
      </p>
    </VCardText>
    <VCardActions>
      <VSpacer />
      <VBtn
        color="error"
        @click="deleteItem"
      >
        {{ $t('delete') }}
      </VBtn>
      <VBtn
        color="secondary"
        @click="close"
      >
        {{ $t('cancel') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>
