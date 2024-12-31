<template>
  <VSnackbar v-if="currentSnackbar" v-model="visible" :color="currentSnackbar.color" :timeout="currentSnackbar.timeout"
    :location="currentSnackbar.position" :variant="currentSnackbar.variant" :rounded="currentSnackbar.rounded"
    :elevation="currentSnackbar.elevation">
    {{ currentSnackbar.message }}
    <template v-slot:actions>
      <VBtn icon @click="visible = false">
        <VIcon>tabler-x</VIcon>
      </VBtn>
    </template>
  </VSnackbar>
</template>

<script setup lang="ts">
import { useGlobalSnackbarStore } from '@/stores/globalSnackbarStore';
import { computed, ref, watch } from 'vue';

const snackbarStore = useGlobalSnackbarStore();
const currentSnackbar = computed(() => snackbarStore.currentSnackbar);

// Controla la visibilidad del snackbar actual
const visible = ref(false);

watch(currentSnackbar, (newValue) => {
  visible.value = !!newValue;
});
</script>
