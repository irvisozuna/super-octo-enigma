import { defineStore } from 'pinia'
import { ref } from 'vue'

/*
 * Confirmaciones imperativas del sistema de diseño: `const ok = await useDialogo().confirmar({ … })`.
 * El componente AsDialogoGlobal (montado en App.vue) pinta la petición actual.
 */
export interface OpcionesConfirmacion {
  titulo: string
  mensaje?: string
  textoConfirmar?: string
  textoCancelar?: string

  /** `error` para acciones destructivas. */
  color?: 'primary' | 'error' | 'warning'
  icono?: string
}

interface Peticion extends OpcionesConfirmacion {
  resolver: (ok: boolean) => void
}

export const useDialogoStore = defineStore('dialogoAs', () => {
  const actual = ref<Peticion | null>(null)
  const procesando = ref(false)

  function confirmar(opciones: OpcionesConfirmacion): Promise<boolean> {
    // Una confirmación nueva cancela la anterior (no se encolan: la segunda es la que importa)
    actual.value?.resolver(false)

    return new Promise<boolean>(resolve => {
      actual.value = { ...opciones, resolver: resolve }
    })
  }

  function responder(ok: boolean) {
    const peticion = actual.value

    actual.value = null
    procesando.value = false
    peticion?.resolver(ok)
  }

  return { actual, procesando, confirmar, responder }
})
