<!-- // src/modules/users/components/UserViewDialog.vue -->
<template>
  <VDialog v-model="isOpen" max-width="500">
    <VCard>
      <VCardTitle>User Details</VCardTitle>
      <VCardText>
        <p><strong>Name:</strong> {{ user?.name }}</p>
        <p><strong>Email:</strong> {{ user?.email }}</p>
        <p><strong>Role:</strong> {{ user?.role }}</p>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn color="primary" @click="close">Close</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { User } from '../types/user';

const isOpen = ref(false);
const user = ref<User | null>(null);

function open(userData: User) {
  user.value = { ...userData }; // Carga los datos del usuario a mostrar
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

defineExpose({ open });
</script>
