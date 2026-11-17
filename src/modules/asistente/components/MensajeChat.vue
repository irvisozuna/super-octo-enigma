<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsistenteStore } from '../stores/asistenteStore'
import type { MensajeChat } from '../types'
import { idsDocumentos } from '../utils/documentos'
import { fuentesConsultadas } from '../utils/herramientas'
import { separarRespuesta, textoParaCopiar } from '../utils/respuesta'
import MarkdownSeguro from './MarkdownSeguro'
import ProgresoRespuesta from './ProgresoRespuesta.vue'
import SelloCifras from './SelloCifras.vue'
import TarjetaDocumento from './TarjetaDocumento.vue'
import { useNotificacion } from '@/composables/useNotificacion'

/*
 * Un mensaje del chat (XEL1-721). La pregunta en burbuja; la respuesta en tarjeta: cifra principal arriba, el cuerpo
 * (texto, tablas, gráficas) y la fuente en el pie con "Abrir reporte". Debajo: Copiar, Exportar, el sello de cifras, lo
 * que hizo y, en la última respuesta, las preguntas de seguimiento.
 */
const props = defineProps<{
  mensaje: MensajeChat
  ultimo?: boolean
}>()

const { t } = useI18n()
const store = useAsistenteStore()
const notificar = useNotificacion()

const transmitiendo = computed(() => props.mensaje.estado === 'transmitiendo')
const partes = computed(() => separarRespuesta(props.mensaje.texto))
const hayTarjeta = computed(() => partes.value.cifras.length > 0 || partes.value.cuerpo.length > 0 || partes.value.fuentes.length > 0)
const documentos = computed(() => (transmitiendo.value || props.mensaje.rol !== 'asistente' ? [] : idsDocumentos(props.mensaje.texto)))
const etiquetaNivel = computed(() => (props.mensaje.nivel ? t(`asistente.nivel.${props.mensaje.nivel}`) : ''))
const selloCompleto = computed(() => !!props.mensaje.verificacion && props.mensaje.verificacion.verificadas === props.mensaje.verificacion.total)

// Mensajes guardados antes del avance por pasos (XEL1-714) solo traen las herramientas
const fuentesViejas = computed(() => (props.mensaje.pasos.length ? [] : fuentesConsultadas(props.mensaje.herramientas)))

async function copiar() {
  try {
    await navigator.clipboard.writeText(textoParaCopiar(props.mensaje.texto))
    notificar.exito(t('asistente.respuesta.copiada'))
  }
  catch {
    notificar.error(t('asistente.respuesta.noCopiada'))
  }
}

function exportar(tipo: 'informe' | 'presentacion') {
  store.enviar(t(`asistente.respuesta.pedir.${tipo}`))
}
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
    class="respuesta"
    :aria-busy="transmitiendo"
  >
    <ProgresoRespuesta
      v-if="transmitiendo"
      :mensaje="mensaje"
    />

    <article
      v-if="hayTarjeta"
      class="respuesta-tarjeta"
    >
      <header
        v-if="partes.cifras.length"
        class="respuesta-tarjeta__cifras"
      >
        <div
          v-for="(c, i) in partes.cifras"
          :key="i"
          class="respuesta-cifra"
        >
          <div class="respuesta-cifra__fila">
            <span class="respuesta-cifra__etiqueta">{{ c.etiqueta }}</span>
            <span
              v-if="i === 0 && etiquetaNivel"
              class="respuesta-nivel"
            >{{ etiquetaNivel }}</span>
          </div>
          <span class="respuesta-cifra__valor">{{ c.valor }}</span>
          <span
            v-if="c.detalle"
            class="respuesta-cifra__detalle"
          >{{ c.detalle }}</span>
        </div>
      </header>

      <div
        v-if="partes.cuerpo.length"
        class="respuesta-tarjeta__cuerpo chat-respuesta"
      >
        <MarkdownSeguro :bloques="partes.cuerpo" />
      </div>

      <footer
        v-for="(f, i) in partes.fuentes"
        :key="i"
        class="respuesta-tarjeta__fuente"
      >
        <span class="respuesta-tarjeta__fuente-texto">
          <VIcon
            icon="tabler-file-text"
            size="15"
          />
          <span>
            {{ t('asistente.respuesta.fuente', { nombre: f.nombre }) }}<template v-if="f.filtros"> · {{ f.filtros }}</template><template v-if="f.datos_al"> · {{ t('asistente.respuesta.corte', { fecha: f.datos_al }) }}</template>
          </span>
        </span>
        <RouterLink
          v-if="f.ruta"
          :to="f.ruta"
          class="respuesta-tarjeta__abrir"
        >
          {{ t('asistente.respuesta.abrir') }}
        </RouterLink>
      </footer>
    </article>

    <TarjetaDocumento
      v-for="id in documentos"
      :id="id"
      :key="id"
    />

    <SelloCifras
      v-if="mensaje.verificacion && !transmitiendo && !selloCompleto"
      :verificacion="mensaje.verificacion"
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
      v-if="!transmitiendo && mensaje.texto"
      class="respuesta-acciones"
    >
      <VBtn
        variant="text"
        size="small"
        prepend-icon="tabler-copy"
        @click="copiar"
      >
        {{ t('asistente.respuesta.copiar') }}
      </VBtn>
      <VMenu
        v-if="ultimo"
        location="bottom start"
      >
        <template #activator="{ props: activador }">
          <VBtn
            v-bind="activador"
            variant="text"
            size="small"
            prepend-icon="tabler-download"
            :disabled="store.enviando"
          >
            {{ t('asistente.respuesta.exportar') }}
          </VBtn>
        </template>
        <VList density="compact">
          <VListItem
            prepend-icon="tabler-file-text"
            :title="t('asistente.respuesta.comoInforme')"
            @click="exportar('informe')"
          />
          <VListItem
            prepend-icon="tabler-presentation"
            :title="t('asistente.respuesta.comoPresentacion')"
            @click="exportar('presentacion')"
          />
        </VList>
      </VMenu>
      <span
        v-if="!partes.cifras.length && etiquetaNivel"
        class="respuesta-nivel"
      >{{ etiquetaNivel }}</span>
      <SelloCifras
        v-if="mensaje.verificacion && selloCompleto"
        :verificacion="mensaje.verificacion"
        compacto
        class="respuesta-acciones__sello"
      />
    </div>
    <ProgresoRespuesta
      v-if="!transmitiendo"
      :mensaje="mensaje"
    />
    <div
      v-if="!transmitiendo && fuentesViejas.length"
      class="chat-nota"
    >
      <VIcon
        icon="tabler-database-search"
        size="14"
      />
      {{ t('asistente.consulto', { fuentes: fuentesViejas.join(', ') }) }}
    </div>

    <div
      v-if="ultimo && !transmitiendo && partes.sugerencias.length"
      class="respuesta-sugerencias"
    >
      <VBtn
        v-for="s in partes.sugerencias"
        :key="s"
        variant="outlined"
        rounded="pill"
        color="on-surface"
        class="respuesta-sugerencia"
        :disabled="store.enviando"
        @click="store.enviar(s)"
      >
        {{ s }}
      </VBtn>
    </div>
  </div>
</template>

<style scoped>
.chat-pregunta {
  align-self: flex-end;
  border-radius: 14px 14px 4px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: var(--as-fs-base);
  line-height: var(--as-lh-normal);
  max-inline-size: 75%;
  overflow-wrap: anywhere;
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-4);
  white-space: pre-wrap;
}

.respuesta {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-3);
  min-inline-size: 0;
}

.respuesta-tarjeta {
  overflow: hidden;
  border: var(--as-borde);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
}

.respuesta-tarjeta__cifras {
  display: grid;
  gap: var(--as-sp-4);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  padding-block: var(--as-sp-5) var(--as-sp-3);
  padding-inline: var(--as-sp-6);
}

.respuesta-cifra {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-inline-size: 0;
}

.respuesta-cifra__fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--as-sp-3);
}

.respuesta-cifra__etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  font-weight: var(--as-peso-medio);
}

.respuesta-cifra__valor {
  font-size: 2.25rem;
  font-variant-numeric: tabular-nums;
  font-weight: var(--as-peso-semi);
  letter-spacing: -0.02em;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.respuesta-cifra__detalle {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-size: var(--as-fs-sm);
}

.respuesta-nivel {
  flex-shrink: 0;
  border-radius: 999px;
  background: rgb(var(--v-theme-surface-resaltada));
  color: rgb(var(--v-theme-on-surface-resaltada));
  font-size: var(--as-fs-xs);
  font-weight: var(--as-peso-semi);
  padding-block: 2px;
  padding-inline: 10px;
}

.respuesta-tarjeta__cuerpo {
  padding-block: var(--as-sp-4);
  padding-inline: var(--as-sp-6);
}

.respuesta-tarjeta__cifras + .respuesta-tarjeta__cuerpo {
  padding-block-start: var(--as-sp-1);
}

.respuesta-tarjeta__fuente {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  background: rgb(var(--v-theme-surface-tabla-cabecera));
  border-block-start: var(--as-borde);
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-size: var(--as-fs-sm);
  gap: var(--as-sp-3);
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-6);
}

.respuesta-tarjeta__fuente-texto {
  display: flex;
  align-items: flex-start;
  gap: var(--as-sp-2);
}

.respuesta-tarjeta__fuente-texto .v-icon {
  flex-shrink: 0;
  margin-block-start: 2px;
}

.respuesta-tarjeta__abrir {
  color: rgb(var(--v-theme-primary));
  font-weight: var(--as-peso-semi);
  text-decoration: none;
  white-space: nowrap;
}

.respuesta-tarjeta__abrir:hover {
  text-decoration: underline;
}

.respuesta-acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--as-sp-1);
  margin-block-start: calc(-1 * var(--as-sp-1));
}

.respuesta-acciones__sello {
  margin-inline-start: auto;
}

.respuesta-sugerencias {
  display: flex;
  flex-wrap: wrap;
  gap: var(--as-sp-2);
}

.respuesta-sugerencias .respuesta-sugerencia {
  border-color: rgba(var(--v-border-color), 0.32);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-weight: var(--as-peso-normal);
  letter-spacing: normal;
  min-block-size: 40px;
  text-transform: none;
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
  padding: var(--as-sp-3);
  border-radius: var(--as-radio-md);
  background: rgb(var(--v-theme-surface-variant));
  font-size: var(--as-fs-sm);
}

.chat-respuesta :deep(.md-enlace) {
  color: rgb(var(--v-theme-primary));
  font-weight: var(--as-peso-medio);
}

.chat-respuesta :deep(.md-tabla) {
  border: var(--as-borde);
  border-radius: var(--as-radio-md);
  margin-block: 0 var(--as-sp-2);
  overflow-x: auto;
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

.chat-respuesta :deep(.md-nota) {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  margin-block: 0 var(--as-sp-2);
}

.chat-respuesta :deep(.md-separador) {
  border: 0;
  border-block-start: var(--as-borde);
  margin-block: var(--as-sp-3);
}
</style>
