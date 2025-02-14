<template>
  <VCard>
    <VCardTitle>
      {{ itemData?.id
        ? $t('delete')
        : $t('deleteSelected', { count: selectedItems.length }) }}
    </VCardTitle>
    <VCardText>
      <p v-if="itemData?.id" v-html="$t('Are you sure you want to delete', { name: itemData.name })"></p>
      <p v-else>
        {{ selectedItems.length > 1
          ? $t('Are you sure you want to delete these items', { count: selectedItems.length, module: $t('users') })
          : $t('Are you sure you want to delete these items', { count: selectedItems.length, module: $t('user') })
        }}
      </p>
    </VCardText>
    <VCardActions>
      <VSpacer />
      <VBtn color="error" @click="deleteItem">{{ $t('delete') }}</VBtn>
      <VBtn color="secondary" @click="close">{{ $t('cancel') }}</VBtn>
    </VCardActions>
  </VCard>
</template>

<script setup lang="ts">
import { useAppManager } from '@/composables/useAppManager';
import { useUserStore } from '@/modules/user/stores/userStore';
import { ref } from 'vue';
import { User } from '../types/user';

const { closeDialog } = useAppManager();

// Props del diálogo
const props = defineProps({
  item: {
    type: Object as () => User,
    required: false, // Puede no venir si es eliminación masiva
  },
});

const userStore = useUserStore();
const itemData = ref<User | null>(props.item ?? null);
const selectedItems = ref(userStore.selectedItems); // Elementos seleccionados

// Método para cerrar el diálogo
function close() {
  closeDialog();
}

async function deleteItem() {
  try {
    if (itemData.value?.id) {
    // Eliminar un solo elemento
      await userStore.deleteItem(itemData.value.id);
    } else if (selectedItems.value.length > 0) {
      // Eliminar elementos seleccionados
      const idsToDelete = selectedItems.value.map((item) => item.id);
      await userStore.batchAction(idsToDelete, 'delete');
    }
    close();
  } catch (error) {
    console.error(`Error deleting user(s):`, error);
  } finally {
    close();
  }
}
</script>
