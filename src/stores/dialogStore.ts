import { DialogOptions } from '@/types/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDialogStore = defineStore('dialogStore', () => {
  const dialogState = ref<{
    show: boolean;
    options: DialogOptions | null;
  }>({
    show: false,
    options: null,
  });

  const dialogStack = ref<DialogOptions[]>([]);
  const dialogHistory = ref<DialogOptions[]>([]); // Historial de diálogos abiertos/cerrados

  function openDialog(options: DialogOptions) {
    dialogStack.value.push(options);
    dialogHistory.value.push(options); // Agregar al historial
    dialogState.value = {
      show: true,
      options,
    };

    // Emitir evento global
    window.dispatchEvent(new CustomEvent('dialog-opened', { detail: options }));
  }

  function closeDialog() {
    dialogStack.value.pop();
    const previousDialog = dialogStack.value.at(-1);
    dialogState.value = previousDialog
      ? { show: true, options: previousDialog }
      : { show: false, options: null };

    // Emitir evento global
    window.dispatchEvent(new CustomEvent('dialog-closed', { detail: dialogState.value.options }));
  }

  return {
    dialogState,
    dialogStack,
    dialogHistory,
    openDialog,
    closeDialog,
  };
});
