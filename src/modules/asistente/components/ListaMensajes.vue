<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAsistenteStore } from '../stores/asistenteStore'
import BienvenidaAsistente from './BienvenidaAsistente.vue'
import MensajeChat from './MensajeChat.vue'

/** En pantalla completa el inicio lleva la caja grande y los temas; en el panel, solo saludo y sugerencias. */
withDefaults(defineProps<{ inicio?: 'pagina' | 'panel' }>(), { inicio: 'panel' })

/*
 * Mensajes de la conversación actual, o la bienvenida con preguntas sugeridas si está vacía. Baja sola mientras llega
 * la respuesta, salvo que el usuario haya subido a leer algo anterior.
 */
const store = useAsistenteStore()
const { mensajes, vacia, avance, cargandoMensajes } = storeToRefs(store)

const fin = ref<HTMLElement | null>(null)

function contenedorDesplazable(el: HTMLElement | null): HTMLElement | null {
  let actual = el?.parentElement ?? null
  while (actual) {
    const { overflowY } = getComputedStyle(actual)
    if (overflowY === 'auto' || overflowY === 'scroll')
      return actual
    actual = actual.parentElement
  }

  return null
}

let siguiendo = true

watch(() => [mensajes.value.length, mensajes.value.at(-1)?.texto.length, mensajes.value.at(-1)?.pasos.length, avance.value], async ([cantidad], anterior) => {
  const contenedor = contenedorDesplazable(fin.value)
  const nuevoMensaje = cantidad !== anterior?.[0]
  if (contenedor && !nuevoMensaje)
    siguiendo = contenedor.scrollHeight - contenedor.scrollTop - contenedor.clientHeight < 120
  await nextTick()
  if (nuevoMensaje || siguiendo)
    fin.value?.scrollIntoView({ block: 'end' })
})
</script>

<template>
  <div class="chat-lista">
    <VProgressLinear
      v-if="cargandoMensajes"
      indeterminate
      height="2"
    />
    <BienvenidaAsistente
      v-else-if="vacia"
      :compacta="inicio === 'panel'"
    />
    <template v-else>
      <MensajeChat
        v-for="(mensaje, i) in mensajes"
        :key="mensaje.id"
        :mensaje="mensaje"
        :ultimo="i === mensajes.length - 1"
      />
    </template>
    <div
      ref="fin"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.chat-lista {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-5);
}
</style>
