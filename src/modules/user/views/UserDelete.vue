<template>
  <VCard>
    <VCardTitle>{{ $t('delete ') }}</VCardTitle>
    <VCardText>

      <p v-html="$t('Are you sure you want to delete', { name: itemData.user.name })"></p>
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

const isOpen = ref(false);
const item = ref<User>({
  id: ''
});
// Props del diálogo
const props = defineProps({
  item: {
    type: Object as () => User,
    required: true,
  },
});
const userStore = useUserStore();
const itemData = ref<User>({ ...props.item });

// Método para cerrar el diálogo
function close() {
  closeDialog();
}

async function deleteItem() {
  try {
    if (itemData.value.id) {
      await userStore.deleteItem(itemData.value.id);
      close();
    }
  } catch (error) {
    console.error(`Error deleting user:`, error);
  } finally {
    close();
  }
}

</script>
