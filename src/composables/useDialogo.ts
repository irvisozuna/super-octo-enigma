import { useDialogoStore } from '@/stores/dialogoStore'
import type { OpcionesConfirmacion } from '@/stores/dialogoStore'

/*
 * Confirmación imperativa con el diálogo del sistema de diseño.
 *
 *   const dialogo = useDialogo()
 *   if (await dialogo.confirmar({ titulo: '¿Cerrar la alerta?', mensaje: 'Se registrará en el historial.', color: 'error', textoConfirmar: 'Cerrar alerta' }))
 *     await cerrarAlerta()
 */
export function useDialogo() {
  const store = useDialogoStore()

  return {
    confirmar: (opciones: OpcionesConfirmacion) => store.confirmar(opciones),

    /** Atajo para borrados: botón rojo y textos de eliminar. */
    confirmarEliminar: (titulo: string, mensaje?: string) => store.confirmar({ titulo, mensaje, color: 'error', textoConfirmar: 'Eliminar', icono: 'tabler-trash' }),
  }
}
