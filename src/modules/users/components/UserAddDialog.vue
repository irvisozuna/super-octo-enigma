<!-- // src/modules/users/components/UserAddDialog.vue -->
<template>
  <VDialog v-model="isOpen" max-width="500">
    <VCard>
      <VCardTitle>{{ $t('add user') }}</VCardTitle>
      <VCardText>
        <VForm ref="form">
          <VTextField v-model="user.name" label="Name" required />
          <VTextField v-model="user.email" label="Email" required />
          <VSelect v-model="user.role" :items="roles" label="Role" required />
        </VForm>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn color="primary" @click="saveUser">{{ $t('save') }}</VBtn>
        <VBtn color="secondary" @click="close">{{ $t('cancel') }}</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { useUserStore } from '@/modules/users/stores/userStore';
import { ref } from 'vue';

const isOpen = ref(false);
const user = ref({ name: '', email: '', role: '' });
const roles = ['admin', 'manager', 'user']; // Opciones de roles

const userStore = useUserStore();

function open() {
  resetForm();
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

function resetForm() {
  user.value = { name: '', email: '', role: '' };
}

async function saveUser() {
  try {
    await userStore.createItem(user.value);
    close();
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

defineExpose({ open });
</script>
