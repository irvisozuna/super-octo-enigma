<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAsistenteStore } from '../stores/asistenteStore'
import type { NivelRespuesta } from '../types'

/* Caja de la pregunta: Enter envía, Mayús+Enter hace salto de línea; mientras contesta, el botón la detiene. */
const store = useAsistenteStore()
const { enviando, nivel, estado, sinCupo } = storeToRefs(store)
const { t } = useI18n()

const texto = ref('')
const MAXIMO = 2000

const niveles: NivelRespuesta[] = ['auto', 'rapido', 'analisis']

const aviso = computed(() => {
  if (sinCupo.value)
    return t('asistente.sinCupo')
  const restantes = estado.value?.preguntas_restantes
  if (restantes !== undefined && restantes <= 5)
    return t('asistente.restantes', { n: restantes })
  const pct = estado.value?.consumo_mensual_pct
  if (pct !== null && pct !== undefined && pct >= 80)
    return t('asistente.consumoAlto', { pct })

  return ''
})

function enviar() {
  if (enviando.value || sinCupo.value || !texto.value.trim())
    return
  const pregunta = texto.value

  texto.value = ''
  void store.enviar(pregunta)
}

function alTeclear(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    enviar()
  }
}
</script>

<template>
  <div class="chat-compositor">
    <VTextarea
      v-model="texto"
      :placeholder="t('asistente.placeholder')"
      :aria-label="t('asistente.placeholder')"
      :maxlength="MAXIMO"
      :disabled="sinCupo"
      persistent-placeholder
      rows="1"
      max-rows="6"
      auto-grow
      hide-details
      density="compact"
      variant="outlined"
      @keydown="alTeclear"
    >
      <template #append-inner>
        <VBtn
          v-if="enviando"
          icon="tabler-player-stop-filled"
          size="small"
          variant="text"
          color="error"
          :aria-label="t('asistente.detener')"
          @click="store.detener()"
        />
        <VBtn
          v-else
          icon="tabler-send"
          size="small"
          variant="text"
          color="primary"
          :disabled="!texto.trim() || sinCupo"
          :aria-label="t('asistente.enviar')"
          @click="enviar"
        />
      </template>
    </VTextarea>
    <div class="chat-compositor__pie">
      <span class="chat-compositor__etiqueta">{{ t('asistente.nivel.etiqueta') }}</span>
      <VChipGroup
        v-model="nivel"
        mandatory
        selected-class="text-primary"
        :aria-label="t('asistente.nivel.etiqueta')"
      >
        <VChip
          v-for="n in niveles"
          :key="n"
          :value="n"
          size="small"
          variant="outlined"
          filter
        >
          {{ t(`asistente.nivel.${n}`) }}
        </VChip>
      </VChipGroup>
      <VTooltip
        :text="t('asistente.nivel.ayuda')"
        location="top"
        max-width="280"
      >
        <template #activator="{ props: activador }">
          <VIcon
            v-bind="activador"
            icon="tabler-info-circle"
            size="16"
            class="text-medium-emphasis"
          />
        </template>
      </VTooltip>
      <span
        v-if="aviso"
        class="chat-compositor__aviso"
      >{{ aviso }}</span>
    </div>
    <p class="chat-compositor__legal">
      {{ t('asistente.aviso') }}
    </p>
  </div>
</template>

<style scoped>
.chat-compositor {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-2);
  inline-size: 100%;
}

.chat-compositor__pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: var(--as-sp-2);
}

.chat-compositor__etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-xs);
}

.chat-compositor__pie :deep(.v-chip-group) {
  padding-block: 0;
}

.chat-compositor__aviso {
  color: rgb(var(--v-theme-warning));
  font-size: var(--as-fs-xs);
  margin-inline-start: auto;
}

.chat-compositor__legal {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-xs);
  margin: 0;
}
</style>
