<!-- // src/modules/users/components/UserEditDialog.vue -->
<template>
  <VDialog v-model="isOpen" max-width="500">
    <VCard>
      <VCardTitle>Edit User</VCardTitle>
      <VCardText>
        <VForm ref="form">
          <VTextField v-model="user.name" label="Name" required />
          <VTextField v-model="user.email" label="Email" required />
          <VSelect v-model="user.role" :items="roles" label="Role" required />
        </VForm>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn color="primary" @click="updateUser">Save</VBtn>
        <VBtn color="secondary" @click="close">Cancel</VBtn>
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
const roles = ['admin', 'manager', 'user']; // Opciones de roles

const userStore = useUserStore();

function open(userData: User) {
  user.value = { ...userData }; // Carga los datos del usuario a editar
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

async function updateUser() {
  try {
    await userStore.updateItem(user.value.id, user.value);
    close();
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

defineExpose({ open });
</script>
