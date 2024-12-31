import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useGlobalSnackbarStore = defineStore('globalSnackbar', () => {
  const snackbarQueue = ref<
    {
      message: string;
      color: string;
      timeout: number;
      position: 'top' | 'bottom' | 'top end' | 'top start' | 'bottom end' | 'bottom start';
      closable?: boolean; // Nueva propiedad para controlar si el snackbar es cerrable
      variant?: 'text' | 'tonal' | 'flat' | 'elevated' | 'outlined' | 'plain';
      rounded?: boolean | string;
      elevation?: number;
    }[]
  >([]);

  const currentSnackbar = ref<
    {
      message: string;
      color: string;
      timeout: number;
      position: 'top' | 'bottom' | 'top end' | 'top start' | 'bottom end' | 'bottom start';
      closable?: boolean; // Agregada aquí también
      variant?: 'text' | 'tonal' | 'flat' | 'elevated' | 'outlined' | 'plain';
      rounded?: boolean | string;
      elevation?: number;
    } | null
  >(null);

  function showSnackbar(
    message: string,
    color: 'success' | 'error' | 'info' | 'warning',
    options: {
      timeout?: number;
      position?: 'top' | 'bottom' | 'top end' | 'top start' | 'bottom end' | 'bottom start';
      closable?: boolean; // Agregar la opción closable
      variant?: 'text' | 'tonal' | 'flat' | 'elevated' | 'outlined' | 'plain';
      rounded?: boolean | string;
      elevation?: number;
    } = {}
  ) {
    snackbarQueue.value.push({
      message,
      color,
      timeout: options.timeout ?? 7000,
      position: options.position ?? 'top end',
      closable: options.closable ?? false, // Predeterminado a no closable
      variant: options.variant ?? 'elevated',
      rounded: options.rounded ?? 'lg',
      elevation: options.elevation ?? 4,
    });

    if (!currentSnackbar.value) {
      processQueue();
    }
  }

  function processQueue() {
    if (snackbarQueue.value.length > 0) {
      const nextSnackbar = snackbarQueue.value.shift();
      if (nextSnackbar) {
        currentSnackbar.value = nextSnackbar;
        setTimeout(() => {
          currentSnackbar.value = null;
          processQueue();
        }, currentSnackbar.value.timeout);
      }
    }
  }

  return {
    snackbarQueue,
    currentSnackbar,
    showSnackbar,
  };
});
