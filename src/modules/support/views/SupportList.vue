<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">{{ title }}</h4>
      <p class="text-body-1 mb-4">{{ description }}</p>
    </VCardTitle>

    <!-- Filtros reutilizables -->
    <SupportFilters :initial-filters="supportStore.filters" @update:filters="applyFilters" />

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField v-model="supportStore.filters.search" :label="$t('Search Support')" variant="outlined" dense
          class="filter-field" @input="applyFilters" />

        <!-- Botón para exportar -->
        <GlobalMenu :label="$t('export')" :options="menuOptions" color="secondary" variant="tonal"
          icon="tabler-chevron-down" />

        <!-- Botón para agregar usuario -->
        <VBtn prepend-icon="tabler-plus" color="primary" @click="openAddDialog">{{ $t('add support') }}</VBtn>

        <!-- Botones para acciones con seleccionados -->
        <VBtn color="error" v-if="supportStore.selectedItems.length > 1" @click="deleteSelected">
          {{ $t('delete selected') }}
        </VBtn>
      </div>
    </VCardText>

    <VDivider />

    <!-- Tabla de elementos -->
    <SupportTable :headers="headers" :items="supportStore.list" :total="supportStore.total" :page="supportStore.page"
      :items-per-page="supportStore.itemsPerPage" :loading="supportStore.isLoading" :selection="supportStore.selectedItems"
      @update:selection="val => supportStore.selectedItems = val" @update:page="onPageChange"
      @update:items-per-page="onItemsPerPageChange" @view="openViewDialog" @edit="openEditDialog"
      @delete="openDeleteDialog" />
  </VCard>
</template>

<script setup lang="ts">
import { useSupportStore } from '@/modules/support/stores/supportStore';
import debounce from 'lodash/debounce';


// Componentes internos
import SupportFilters from '../components/SupportFilters.vue';
import SupportTable from '../components/SupportTable.vue';
import SupportAdd from './SupportAdd.vue';
import SupportDelete from './SupportDelete.vue';
import SupportEdit from './SupportEdit.vue';

// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager();

// Props para personalizar el título y descripción
const props = defineProps({
  title: {
    type: String,
    default: 'Support Management',
  },
  description: {
    type: String,
    default: 'Manage your support with ease.',
  },
});

// Store
const supportStore = useSupportStore();

// Headers para la tabla
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Actions', key: 'actions', sortable: false },
];

// Opciones del menú de exportación
const menuOptions = [
  {
    text: 'Exportar a Excel',
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: 'Exportar a PDF',
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
];

// Métodos
const debouncedFetchList = debounce(() => {
  supportStore.fetchList();
}, 500);

function applyFilters(newFilters: any) {
  Object.assign(supportStore.filters, newFilters);
  debouncedFetchList();
}

function onPageChange(newPage: number) {
  supportStore.page = newPage;
  supportStore.fetchList();
}

function onItemsPerPageChange(newItemsPerPage: number) {
  supportStore.itemsPerPage = newItemsPerPage;
  supportStore.fetchList();
}

function deleteSelected() {
  openDialog(SupportDelete, {}, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      supportStore.fetchList();
    }
  });
}



function openAddDialog() {
  openDialog(SupportAdd, { title: 'Add Support' }, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      supportStore.fetchList();
    }
  });
}

function openEditDialog(item: any) {
  openDialog(SupportEdit, { item, title: 'Edit Support' }, { width: '800px', persistent: true }).then((result) => {
    if (result === 'submit') {
      supportStore.fetchList();
    }
  });
}

function openViewDialog(item: any) {
  navigateTo(`/supports/${item.id}`);
}

function openDeleteDialog(item: any) {
  openDialog(SupportDelete, { item, title: 'Delete Support' }, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      supportStore.fetchList();
    }
  });
}
function exportItems(type: string) {
  userStore.exportItems(type);
}

// onMounted
onMounted(() => {
  supportStore.fetchList();
});
</script>

<style scoped>
.buttons-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.filter-field {
  flex: 1;
  max-inline-size: 300px;
}
</style>
