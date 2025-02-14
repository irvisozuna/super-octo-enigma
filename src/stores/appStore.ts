import { DialogOptions } from '@/types/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('appStore', () => {
  const dialogState = ref<{
    show: boolean;
    options: DialogOptions | null;
  }>({
    show: false,
    options: null,
  });

  const dialogStack = ref<DialogOptions[]>([]);
  const dialogHistory = ref<DialogOptions[]>([]);

  /**
   * Abre un diálogo.
   */
  function openDialog(options: DialogOptions) : Promise<'submit' | 'cancel' | 'close'> {
    return new Promise((resolve) => {
      dialogStack.value.push(options);
      dialogHistory.value.push(options);
      dialogState.value = {
        show: true,
        options,
      };

      // Emitir evento global
      window.dispatchEvent(new CustomEvent('dialog-opened', { detail: options }));

      window.addEventListener('dialog-closed', (event: Event) => {
        resolve((event as CustomEvent).detail.result);
      }, { once: true });
    });
  }

  /**
   * Cierra el diálogo actual.
   */
  function closeDialog(result: 'submit' | 'cancel' | 'close' = 'close') {
    dialogStack.value.pop();
    const previousDialog = dialogStack.value.at(-1);
    dialogState.value = previousDialog
      ? { show: true, options: previousDialog }
      : { show: false, options: null };

    // Emitir evento global
    window.dispatchEvent(new CustomEvent('dialog-closed', { detail: { result, options: dialogState.value.options } }));
  }

  /**
   * Navega a una URL.
   */
  async function navigateTo(route: string, params: Record<string, any> = {}, query: Record<string, any> = {}) {
    const router = useRouter();
    await router.push({ path: route, params, query });
  }

  return {
    dialogState,
    dialogStack,
    dialogHistory,
    openDialog,
    closeDialog,
    navigateTo,
  };
});
