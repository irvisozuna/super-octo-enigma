<script setup lang="ts">
import { useI18n } from 'vue-i18n'

/*
 * Barra de filtros compacta pero cómoda: los campos que se pongan dentro heredan densidad compacta, borde y
 * sin mensajes de ayuda (VDefaultsProvider), así las vistas no repiten props. Anchos por clase: as-filtro--sm | md | lg.
 * "Quitar filtros (n)" aparece solo cuando hay filtros activos.
 */
withDefaults(defineProps<{
  activos?: number
  deshabilitado?: boolean

  /** Sin fondo ni borde propios (cuando ya va dentro de una tarjeta). */
  sinTarjeta?: boolean
}>(), { activos: 0 })

const emit = defineEmits<{
  limpiar: []
}>()

const { t } = useI18n()

const defaults = {
  VSelect: { density: 'compact', variant: 'outlined', hideDetails: true, color: 'primary' },
  VAutocomplete: { density: 'compact', variant: 'outlined', hideDetails: true, color: 'primary' },
  VCombobox: { density: 'compact', variant: 'outlined', hideDetails: true, color: 'primary' },
  VTextField: { density: 'compact', variant: 'outlined', hideDetails: true, color: 'primary' },
  VBtnToggle: { density: 'compact', variant: 'tonal', color: 'primary', divided: true },
  VChipGroup: { selectedClass: 'text-primary' },
  VChip: { label: true, size: 'small' },
  VCheckbox: { density: 'compact', hideDetails: true },
  VSwitch: { density: 'compact', hideDetails: true },
}
</script>

<template>
  <div
    class="as-filtros"
    :class="{ 'as-filtros--tarjeta': !sinTarjeta }"
    role="search"
  >
    <VDefaultsProvider :defaults="defaults">
      <div class="d-flex flex-wrap align-center gap-2">
        <slot name="inicio" />
        <slot />
        <VBtn
          v-if="activos > 0"
          variant="text"
          size="small"
          color="primary"
          prepend-icon="tabler-eraser"
          :disabled="deshabilitado"
          @click="emit('limpiar')"
        >
          {{ t('as.filtros.quitar', { n: activos }) }}
        </VBtn>
        <VSpacer v-if="$slots.fin" />
        <slot name="fin" />
      </div>
    </VDefaultsProvider>
  </div>
</template>

<style>
.as-filtros--tarjeta {
  border: var(--as-borde);
  border-radius: var(--as-radio-lg);
  background: rgb(var(--v-theme-surface));
  padding-block: var(--as-sp-2);
  padding-inline: var(--as-sp-3);
}

/* Anchos de campo del sistema (los tokens --as-ancho-filtro-*); se usan desde las vistas */
.as-filtros .as-filtro--sm {
  flex: 0 1 var(--as-ancho-filtro-sm);
  min-inline-size: calc(var(--as-ancho-filtro-sm) * 0.85);
}

.as-filtros .as-filtro--md {
  flex: 1 1 var(--as-ancho-filtro-md);
  max-inline-size: calc(var(--as-ancho-filtro-md) * 1.3);
  min-inline-size: calc(var(--as-ancho-filtro-md) * 0.8);
}

.as-filtros .as-filtro--lg {
  flex: 1 1 var(--as-ancho-filtro-lg);
  max-inline-size: calc(var(--as-ancho-filtro-lg) * 1.3);
  min-inline-size: calc(var(--as-ancho-filtro-lg) * 0.8);
}

.as-filtros .v-btn-group--density-compact.v-btn-group {
  block-size: var(--as-control);
}
</style>
