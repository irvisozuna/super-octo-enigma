import { useAppStore } from '@/stores/appStore';
import { DialogOptions } from '@/types/types';
import { useRouter } from 'vue-router';

export function useAppManager() {
  const appStore = useAppStore();
  const router = useRouter();
  /**
   * Abre un diálogo con el componente y opciones especificadas.
   */
  async function openDialog(
    component: any,
    props: Record<string, any> = {},
    options: Partial<DialogOptions> = {}
  ): Promise<'submit' | 'cancel' | 'close'> {
    return appStore.openDialog({
      component,
      props,
      width: options.width || '700px',
      fullscreen: options.fullscreen || false,
      persistent: options.persistent || false,
      scrollable: options.scrollable || false,
      hideOverlay: options.hideOverlay || false,
      position: options.position || 'center',
      transition: options.transition || 'dialog-transition',
      closeOnEsc: options.closeOnEsc ?? true,
      closeOnBackdropClick: options.closeOnBackdropClick ?? true,
      actions: options.actions || [],
    });
  }

  /**
   * Cierra el diálogo actual.
   */
  function closeDialog(result: 'submit' | 'cancel' | 'close' = 'close') {
    appStore.closeDialog(result);
  }

  /**
   * Navega a una URL.
   */
  async function navigateTo(route: string, params: Record<string, any> = {}, query: Record<string, any> = {}) {
    await router.push({ path: route, params, query });
  }

  /**
   * Obtiene el historial de diálogos.
   */
  function getDialogHistory() {
    return appStore.dialogHistory;
  }

  /**
   * Escucha cuando un diálogo se abre.
   */
  function onDialogOpened(callback: (options: DialogOptions) => void) {
    window.addEventListener('dialog-opened', (event: Event) =>
      callback((event as CustomEvent).detail)
    );
  }
  async function makeApiCall(url: string, method: string = 'GET', data: any = {}) {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.stringify(data) : undefined,
      });
      return await response.json();
    } catch (error) {
      console.error('Error en la llamada a la API:', error);
    }
  }
  /**
   * Escucha cuando un diálogo se cierra.
   */
  function onDialogClosed(callback: (result: { result: string; options: DialogOptions | null }) => void) {
    window.addEventListener('dialog-closed', (event: Event) =>
      callback((event as CustomEvent).detail)
    );
  }

  return {
    openDialog,
    closeDialog,
    navigateTo,
    getDialogHistory,
    onDialogOpened,
    onDialogClosed,
    makeApiCall
  };
}
