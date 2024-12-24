<!-- // src/modules/users/components/UserDeleteDialog.vue -->
<template>
  <VDialog v-model="isOpen" max-width="400">
    <VCard>
      <VCardTitle>{{ $t('delete ') }}</VCardTitle>
      <VCardText>
        <p>Are you sure you want to delete <strong>{{ user?.name }}</strong>?</p>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn color="error" @click="deleteUser">{{ $t('delete') }}</VBtn>
        <VBtn color="secondary" @click="close">{{ $t('cancel') }}</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { useUserStore } from '@/modules/users/stores/userStore';
import { ref } from 'vue';
import { User } from '../types/user';

const isOpen = ref(false);
const user = ref<User>({
  id: '',
  name: '',
  email: '',
  role: '',
});

const userStore = useUserStore();

function open(userData: User) {
  user.value = { ...userData }; // Carga los datos del usuario a eliminar
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

async function deleteUser() {
  try {
    if (user.value?.id) {
      await userStore.deleteItem(user.value.id);
      close();
    }
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

defineExpose({ open });
</script>
