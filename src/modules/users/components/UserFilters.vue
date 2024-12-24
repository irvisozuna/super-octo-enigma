<!-- // src/modules/users/components/UserFilters.vue -->
<template>
  <div class="filters-container">
    <!-- Campo de búsqueda -->
    <VTextField
      v-model="filters.search"
      label="Search User"
      variant="outlined"
      dense
      class="filter-field"
      @input="applyFilters"
    />

    <!-- Selector de roles dinámico -->
    <api-data-source
      api-path="company/roles?onlykeyvalue=true"
      @loaded="(response) => roleOptions = response"
    >
      <template v-slot="{ loading }">
        <VSelect
          v-model="filters.role"
          :items="roleOptions"
          item-text="title"
          item-value="value" 
          label="Select Role"
          variant="outlined"
          dense
          class="filter-field"
          clearable
          chips
          multiple
          closable-chips
          :loading="loading"
          :disabled="loading"
          style="min-inline-size: 200px;"
          @change="applyFilters"
        >
          <!-- Mensaje de placeholder para cargar datos -->
          <template #prepend-item v-if="loading">
            <span class="text-secondary text-caption">Loading roles...</span>
          </template>
        </VSelect>
      </template>
    </api-data-source>

  </div>
</template>

<script setup lang="ts">
import ApiDataSource from '@/components/ApiDataSource.vue';
import { defineEmits, defineProps, ref } from 'vue';

const emits = defineEmits(['update:filters']);
const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => ({
      search: '',
      role: '',
      emails: [],
    }),
  },
  availableEmails: {
    type: Array as () => Array<{ value: string; title: string }>,
    default: () => [],
  },
});

// Opciones dinámicas de roles (se cargan desde la API)
const roleOptions = ref<Array<{ value: string; title: string }>>([]);


// Opciones de emails (se obtiene desde props.availableEmails)
const emailOptions = props.availableEmails.map((email) => ({
  value: email.value,
  title: email.title,
}));

// Filtros locales
const filters = ref({ ...props.initialFilters });

// Emitir cambios de filtros al componente padre
function applyFilters() {
  emits('update:filters', filters.value);
}
</script>

<style scoped>
.filters-container {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* Inclina los filtros hacia la derecha */
  gap: 1rem;
}

.filter-field {
  flex: 1; /* Hace que los campos sean del mismo tamaño dinámicamente */
  max-inline-size: 300px; /* Limita el ancho máximo de los campos */
}
</style>
