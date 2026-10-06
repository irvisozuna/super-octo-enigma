<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FiltroDef, ValoresFiltros } from '../../types/reporte'
import { estaVacio } from '../../utils/filtros'

const props = defineProps<{
  definiciones: FiltroDef[]
  valores: ValoresFiltros
  etiqueta: (def: FiltroDef, valor: unknown) => string
}>()

const emit = defineEmits<{
  quitar: [key: string]
}>()

const { t } = useI18n()

const activos = computed(() => props.definiciones
  .filter(def => !def.oculto && !estaVacio(props.valores[def.key]))
  .map(def => ({ def, texto: props.etiqueta(def, props.valores[def.key]), fijo: def.requerido || def.fijo })))
</script>

<template>
  <div
    v-if="activos.length"
    class="d-flex flex-wrap gap-2"
  >
    <VChip
      v-for="{ def, texto, fijo } in activos"
      :key="def.key"
      size="small"
      label
      :closable="!fijo"
      :close-label="t('reportes.filtros.quitar')"
      @click:close="emit('quitar', def.key)"
    >
      <span class="text-medium-emphasis me-1">{{ def.etiqueta }}:</span>
      <span class="font-weight-medium">{{ texto }}</span>
    </VChip>
  </div>
</template>
