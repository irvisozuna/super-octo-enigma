<template>
  <slot :load="load" :response="response" :loading="loading" :error="error">
    <div v-if="error">{{ error.message }}</div>
  </slot>
</template>

<script setup lang="ts">
import { useApiDataSource } from '@/composables/useApiDataSource';

interface Props {
  apiPath: string;
  queryParams?: Record<string, any>;
  loadOnMount?: boolean;
  firstRecord?: boolean;
  formatResponse?: (data: any) => any[];
}

const props = withDefaults(defineProps<Props>(), {
  queryParams: () => ({}),
  loadOnMount: true,
  firstRecord: false,
  formatResponse: (data: any) => data
});

const emit = defineEmits<{
  (e: 'loaded', response: any[]): void;
}>();

const { response, loading, load, error } = useApiDataSource(props, emit);
</script>
