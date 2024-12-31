import { useDialogStore } from '@/stores/dialogStore';
import { DialogOptions } from '@/types/types';

export function useDialogManager() {
  const dialogStore = useDialogStore();

  function openDialog(
    component: any,
    props: Record<string, any> = {},
    options: Partial<DialogOptions> = {}
  ) {
    dialogStore.openDialog({
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

  function closeDialog() {
    dialogStore.closeDialog();
  }

  function getDialogHistory() {
    return dialogStore.dialogHistory;
  }

  function onDialogOpened(callback: (options: DialogOptions) => void) {
    window.addEventListener('dialog-opened', (event: Event) => callback((event as CustomEvent).detail));
  }

  function onDialogClosed(callback: (options: DialogOptions | null) => void) {
    window.addEventListener('dialog-closed', (event: Event) => callback((event as CustomEvent).detail));
  }

  return {
    openDialog,
    closeDialog,
    getDialogHistory,
    onDialogOpened,
    onDialogClosed,
  };
}
