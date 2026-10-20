<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AyudaColumna } from '../../types/reporte'

/*
 * Ícono ⓘ del encabezado: tooltip con el resumen al pasar el mouse y, al dar clic o tocar (celular), pide abrir la
 * explicación completa. Detiene el clic para que el encabezado no cambie el orden de la tabla.
 */
defineProps<{
  etiqueta: string
  ayuda: AyudaColumna
}>()

const emit = defineEmits<{ abrir: [] }>()

const { t } = useI18n()
</script>

<template>
  <VBtn
    icon
    variant="text"
    size="x-small"
    density="comfortable"
    class="ayuda-columna"
    :aria-label="t('reportes.ayuda.verExplicacion', { columna: etiqueta })"
    @click.stop="emit('abrir')"
    @keydown.enter.stop
    @keydown.space.stop
  >
    <VIcon
      icon="tabler-info-circle"
      size="16"
    />
    <VTooltip
      activator="parent"
      location="top"
      max-width="320"
      open-delay="150"
    >
      <span class="d-block">{{ ayuda.resumen }}</span>
      <span class="d-block text-caption mt-1 ayuda-columna__pista">{{ t('reportes.ayuda.clicDetalle') }}</span>
    </VTooltip>
  </VBtn>
</template>

<style scoped>
.ayuda-columna {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-inline: 2px;
}

.ayuda-columna:hover,
.ayuda-columna:focus-visible {
  color: rgb(var(--v-theme-primary));
}

.ayuda-columna__pista {
  opacity: 0.8;
}
</style>
