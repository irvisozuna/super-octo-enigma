<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { MensajeChat } from '../types'
import { idsDocumentos } from '../utils/documentos'
import { fuentesConsultadas } from '../utils/herramientas'
import MarkdownSeguro from './MarkdownSeguro'
import ProgresoRespuesta from './ProgresoRespuesta.vue'
import TarjetaDocumento from './TarjetaDocumento.vue'

/* Un mensaje del chat: la pregunta a la derecha; la respuesta con formato, el avance y lo que consultó. */
const props = defineProps<{
  mensaje: MensajeChat
}>()

const { t } = useI18n()

// Mensajes guardados antes del avance por pasos (XEL1-714) solo traen las herramientas
const fuentes = computed(() => (props.mensaje.pasos.length ? [] : fuentesConsultadas(props.mensaje.herramientas)))
const transmitiendo = computed(() => props.mensaje.estado === 'transmitiendo')
const documentos = computed(() => (transmitiendo.value || props.mensaje.rol !== 'asistente' ? [] : idsDocumentos(props.mensaje.texto)))
</script>

<template>
  <div
    v-if="mensaje.rol === 'usuario'"
    class="chat-pregunta"
  >
    {{ mensaje.texto }}
  </div>
  <div
    v-else
    class="chat-respuesta"
    :aria-busy="transmitiendo"
  >
    <ProgresoRespuesta :mensaje="mensaje" />
    <MarkdownSeguro
      v-if="mensaje.texto"
      :texto="mensaje.texto"
    />
    <TarjetaDocumento
      v-for="id in documentos"
      :id="id"
      :key="id"
    />
    <div
      v-if="mensaje.cortada && !transmitiendo"
      class="chat-aviso"
      role="status"
    >
      <VIcon
        icon="tabler-alert-triangle"
        size="16"
      />
      <span>{{ t(`asistente.cortada.${mensaje.cortada}`) }}</span>
    </div>
    <div
      v-if="mensaje.estado === 'error'"
      class="chat-error"
      role="alert"
    >
      <VIcon
        icon="tabler-alert-circle"
        size="16"
      />
      <span>{{ mensaje.error || t('asistente.error') }}</span>
    </div>
    <div
      v-else-if="mensaje.estado === 'detenido'"
      class="chat-nota"
    >
      {{ t('asistente.detenido') }}
    </div>
    <div
      v-if="!transmitiendo && fuentes.length"
      class="chat-nota"
    >
      <VIcon
        icon="tabler-database-search"
        size="14"
      />
      {{ t('asistente.consulto', { fuentes: fuentes.join(', ') }) }}
    </div>
  </div>
</template>

<style scoped>
.chat-pregunta {
  align-self: flex-end;
  border-radius: var(--as-radio-lg);
  background: rgb(var(--v-theme-surface-resaltada));
  font-size: var(--as-fs-base);
  max-inline-size: 85%;
  overflow-wrap: anywhere;
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-3);
  white-space: pre-wrap;
}

.chat-respuesta {
  display: flex;
  flex-direction: column;
  font-size: var(--as-fs-base);
  gap: var(--as-sp-2);
  line-height: var(--as-lh-normal);
  min-inline-size: 0;
}

.chat-nota,
.chat-error {
  display: flex;
  align-items: center;
  font-size: var(--as-fs-sm);
  gap: var(--as-sp-2);
}

.chat-nota {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.chat-error {
  color: rgb(var(--v-theme-error));
}

.chat-aviso {
  display: flex;
  align-items: flex-start;
  border-radius: var(--as-radio-md);
  background: rgba(var(--v-theme-warning), 0.12);
  color: rgb(var(--v-theme-on-surface));
  font-size: var(--as-fs-sm);
  gap: var(--as-sp-2);
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-3);
}

.chat-aviso .v-icon {
  color: rgb(var(--v-theme-warning));
  margin-block-start: 2px;
}

.chat-respuesta :deep(.md > :first-child) {
  margin-block-start: 0;
}

.chat-respuesta :deep(.md-parrafo),
.chat-respuesta :deep(.md-lista) {
  margin-block: 0 var(--as-sp-2);
}

.chat-respuesta :deep(.md-lista) {
  padding-inline-start: var(--as-sp-5);
}

.chat-respuesta :deep(.md-titulo) {
  font-size: var(--as-fs-md);
  font-weight: var(--as-peso-semi);
  margin-block: var(--as-sp-3) var(--as-sp-2);
}

.chat-respuesta :deep(.md-codigo) {
  border-radius: var(--as-radio-sm);
  background: rgb(var(--v-theme-surface-variant));
  font-size: 0.9em;
  padding-inline: 4px;
}

.chat-respuesta :deep(.md-pre) {
  overflow: auto;
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface-variant));
  font-size: var(--as-fs-sm);
  padding: var(--as-sp-3);
}

.chat-respuesta :deep(.md-enlace) {
  color: rgb(var(--v-theme-primary));
  font-weight: var(--as-peso-medio);
}

.chat-respuesta :deep(.md-tabla) {
  overflow-x: auto;
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  margin-block: 0 var(--as-sp-2);
}

.chat-respuesta :deep(.md-tabla table) {
  border-collapse: collapse;
  font-size: var(--as-fs-sm);
  font-variant-numeric: tabular-nums;
  inline-size: 100%;
}

.chat-respuesta :deep(.md-tabla th) {
  background: rgb(var(--v-theme-surface-tabla-cabecera));
  color: rgb(var(--v-theme-on-surface-tabla-cabecera));
  font-weight: var(--as-peso-semi);
  white-space: nowrap;
}

.chat-respuesta :deep(.md-tabla th),
.chat-respuesta :deep(.md-tabla td) {
  border-block-end: var(--as-borde);
  padding-block: 6px;
  padding-inline: var(--as-sp-3);
}

.chat-respuesta :deep(.md-tabla td) {
  white-space: nowrap;
}

.chat-respuesta :deep(.md-tabla tbody tr:last-child td) {
  border-block-end: 0;
}

.chat-respuesta :deep(.md-separador) {
  border: 0;
  border-block-start: var(--as-borde);
  margin-block: var(--as-sp-3);
}
</style>
