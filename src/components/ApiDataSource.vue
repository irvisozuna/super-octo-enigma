<template>
  <span>
    <slot :load="load" :response="response" :loading="loading"></slot>
  </span>
</template>

<script setup lang="ts">
import { useApiDataSource } from '@/composables/useApiDataSource';

// DefineProps correctamente tipado
const props = defineProps({
  apiPath: { type: String, required: true }, // Requerido y de tipo String
  queryParams: {
    type: Object,
    default: () => ({}), // Objeto vacío como valor predeterminado
  },
  loadOnMount: { type: Boolean, default: true }, // Valor por defecto true
  firstRecord: { type: Boolean, default: false }, // Valor por defecto false
});

const emits = defineEmits(['loaded']);

// Usa el composable para manejar la carga de datos
const { response, loading, load } = useApiDataSource(props, emits);
</script>
