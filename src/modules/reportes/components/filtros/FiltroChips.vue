<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FiltroDef, ValoresFiltros } from '../../types/reporte'
import { estaVacio } from '../../utils/filtros'

const props = defineProps<{
  definiciones: FiltroDef[]
  valores: ValoresFiltros
  etiqueta: (def: FiltroDef, valor: unknown) => string

  /** Muestra un chip "Cambiar filtros" y hace clicables los chips para abrir el panel. */
  mostrarAcceso?: boolean
}>()

const emit = defineEmits<{
  quitar: [key: string]
  abrir: []
}>()

const { t } = useI18n()

const activos = computed(() => props.definiciones
  .filter(def => !def.oculto && !estaVacio(props.valores[def.key]))
  .map(def => ({ def, texto: props.etiqueta(def, props.valores[def.key]), fijo: def.requerido || def.fijo })))
</script>

<template>
  <div
    v-if="activos.length || mostrarAcceso"
    class="d-flex flex-wrap align-center gap-2"
  >
    <VChip
      v-if="mostrarAcceso"
      size="small"
      color="primary"
      variant="tonal"
      prepend-icon="tabler-adjustments"
      @click="emit('abrir')"
    >
      {{ t('reportes.filtros.editar') }}
    </VChip>
    <VChip
      v-for="{ def, texto, fijo } in activos"
      :key="def.key"
      size="small"
      label
      :closable="!fijo"
      :close-label="t('reportes.filtros.quitar')"
      @click="mostrarAcceso ? emit('abrir') : undefined"
      @click:close="emit('quitar', def.key)"
    >
      <span class="text-medium-emphasis me-1">{{ def.etiqueta }}:</span>
      <span class="font-weight-medium">{{ texto }}</span>
    </VChip>
  </div>
</template>
