<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAsistenteStore } from '../stores/asistenteStore'
import { SUGERENCIAS } from '../utils/sugerencias'
import MensajeChat from './MensajeChat.vue'

/*
 * Mensajes de la conversación actual, o la bienvenida con preguntas sugeridas si está vacía. Baja sola mientras llega
 * la respuesta, salvo que el usuario haya subido a leer algo anterior.
 */
const store = useAsistenteStore()
const { mensajes, vacia, avance, cargandoMensajes } = storeToRefs(store)
const { t } = useI18n()

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
    <div
      v-else-if="vacia"
      class="chat-bienvenida"
    >
      <VIcon
        icon="tabler-sparkles"
        size="28"
        color="primary"
      />
      <p class="text-body-1 mb-0">
        {{ t('asistente.bienvenida') }}
      </p>
      <div class="chat-sugerencias">
        <VChip
          v-for="sugerencia in SUGERENCIAS"
          :key="sugerencia"
          variant="outlined"
          size="small"
          @click="store.enviar(sugerencia)"
        >
          {{ sugerencia }}
        </VChip>
      </div>
    </div>
    <template v-else>
      <MensajeChat
        v-for="mensaje in mensajes"
        :key="mensaje.id"
        :mensaje="mensaje"
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
  gap: var(--as-sp-4);
}

.chat-bienvenida {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--as-sp-3);
  padding-block: var(--as-sp-4);
}

.chat-sugerencias {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-sp-2);
}

.chat-sugerencias :deep(.v-chip) {
  block-size: auto;
  min-block-size: 28px;
  padding-block: 4px;
  white-space: normal;
}
</style>
