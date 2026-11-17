<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Verificacion } from '../types'

/*
 * Sello de cifras verificadas (XEL1-719). Verde si todas las cifras salieron de las consultas; ámbar con las que no,
 * para que el usuario las revise. `compacto` es la versión de una línea para la tarjeta de un documento.
 */
const props = defineProps<{ verificacion: Verificacion; compacto?: boolean }>()

const { t } = useI18n()
const completa = computed(() => props.verificacion.verificadas === props.verificacion.total)
const n = computed(() => ({ n: props.verificacion.verificadas, total: props.verificacion.total }))
</script>

<template>
  <div
    class="sello"
    :class="[completa ? 'sello--ok' : 'sello--revisar', { 'sello--compacto': compacto }]"
    :title="t('asistente.sello.ayuda')"
  >
    <VIcon
      :icon="completa ? 'tabler-shield-check' : 'tabler-alert-triangle'"
      size="16"
      class="sello__icono"
    />
    <div>
      <span class="sello__titulo">{{ completa ? t('asistente.sello.todas', n) : t('asistente.sello.algunas', n) }}</span>
      <template v-if="!completa && !compacto">
        <span class="sello__detalle">{{ t('asistente.sello.revisar') }}</span>
        <span class="sello__cifras">{{ verificacion.sin_verificar.join(' · ') }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sello {
  display: flex;
  align-items: flex-start;
  border-radius: var(--as-radio-md);
  font-size: var(--as-fs-sm);
  gap: var(--as-sp-2);
  padding-block: var(--as-sp-1);
  padding-inline: var(--as-sp-2);
}

.sello__icono {
  flex-shrink: 0;
  margin-block-start: 2px;
}

.sello > div {
  display: flex;
  flex-direction: column;
}

.sello--ok {
  align-self: flex-start;
  background: rgba(var(--v-theme-success), 0.1);
}

.sello--ok .sello__icono {
  color: rgb(var(--v-theme-success));
}

.sello--revisar {
  background: rgba(var(--v-theme-warning), 0.12);
}

.sello--revisar .sello__icono {
  color: rgb(var(--v-theme-warning));
}

.sello__titulo {
  font-weight: var(--as-peso-medio);
}

.sello__detalle {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.sello__cifras {
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.sello--compacto {
  padding: 0;
  background: none;
  margin-block-start: 2px;
}
</style>
