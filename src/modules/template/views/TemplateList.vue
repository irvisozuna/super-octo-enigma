<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">{{ title }}</h4>
      <p class="text-body-1 mb-4">{{ description }}</p>
    </VCardTitle>

    <!-- Filtros reutilizables -->
    <TemplateFilters :initial-filters="templateStore.filters" @update:filters="applyFilters" />

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField v-model="templateStore.filters.search" :label="$t('Search Template')" variant="outlined" dense
          class="filter-field" @input="applyFilters" />

        <!-- Botón para exportar -->
        <GlobalMenu :label="$t('export')" :options="menuOptions" color="secondary" variant="tonal"
          icon="tabler-chevron-down" />

        <!-- Botón para agregar usuario -->
        <VBtn prepend-icon="tabler-plus" color="primary" @click="openAddDialog">{{ $t('add template') }}</VBtn>

        <!-- Botones para acciones con seleccionados -->
        <VBtn color="error" v-if="templateStore.selectedItems.length > 1" @click="deleteSelected">
          {{ $t('delete selected') }}
        </VBtn>
      </div>
    </VCardText>

    <VDivider />

    <!-- Tabla de elementos -->
    <TemplateTable :headers="headers" :items="templateStore.list" :total="templateStore.total"
      :page="templateStore.page" :items-per-page="templateStore.itemsPerPage" :loading="templateStore.isLoading"
      :selection="templateStore.selectedItems" @update:selection="val => templateStore.selectedItems = val"
      @update:page="onPageChange" @update:items-per-page="onItemsPerPageChange" @view="openViewDialog"
      @edit="openEditDialog" @delete="openDeleteDialog" @update:items-update-option="onItemsSortChange"/>
  </VCard>
</template>

<script setup lang="ts">
import { useTemplateStore } from '@/modules/template/stores/templateStore';
import { newOptions } from '@/types/types';
import debounce from 'lodash/debounce';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const moduleName = 'template';

// Componentes internos
import TemplateFilters from '../components/TemplateFilters.vue';
import TemplateTable from '../components/TemplateTable.vue';
import TemplateAdd from './TemplateAdd.vue';
import TemplateDelete from './TemplateDelete.vue';
import TemplateEdit from './TemplateEdit.vue';

// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager();

// Props para personalizar el título y descripción
const props = defineProps({
  title: {
    type: String,
    default: 'Template Management',
  },
  description: {
    type: String,
    default: 'Manage your template with ease.',
  },
});

// Store
const templateStore = useTemplateStore();

// Headers para la tabla
const headers = [
  { title: t(`${moduleName}.name`), key: 'name' },
  { title: t(`${moduleName}.description`), key: 'description' },
  { title: t(`${moduleName}.is_default`), key: 'is_default' },
  { title: t(`${moduleName}.is_active`), key: 'is_active' },
  { title: t(`${moduleName}.actions`), key: 'actions', sortable: false },
];

// Opciones del menú de exportación
const menuOptions = [
  {
    text: t(`export_to`) + ' ' +t(`excel`),
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: t(`export_to`) + ' ' +t(`pdf`),
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
];

// Métodos
const debouncedFetchList = debounce(() => {
  templateStore.fetchList();
}, 500);

function applyFilters(newFilters: any) {
  Object.assign(templateStore.filters, newFilters);
  debouncedFetchList();
}

function onPageChange(newPage: number) {
  templateStore.page = newPage;
  templateStore.fetchList();
}

function onItemsPerPageChange(newItemsPerPage: number) {
  templateStore.itemsPerPage = newItemsPerPage;
  templateStore.fetchList();
}

function onItemsSortChange(newOptions: newOptions) {
  templateStore.sortBy = newOptions.sortBy.map(option => option.key);
  templateStore.sortDesc = newOptions.sortBy.map(option => option.order === 'desc');
  templateStore.fetchList();
}

function deleteSelected() {
  openDialog(TemplateDelete, {}, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      templateStore.fetchList();
    }
  });
}



function openAddDialog() {
  openDialog(TemplateAdd, { title: 'Add Template' }, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      templateStore.fetchList();
    }
  });
}

function openEditDialog(item: any) {
  openDialog(TemplateEdit, { item, title: 'Edit Template' }, { width: '800px', persistent: true }).then((result) => {
    if (result === 'submit') {
      templateStore.fetchList();
    }
  });
}

function openViewDialog(item: any) {
  navigateTo(`/templates/${item.id}`);
}

function openDeleteDialog(item: any) {
  openDialog(TemplateDelete, { item, title: 'Delete Template' }, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      templateStore.fetchList();
    }
  });
}
function exportItems(type: string) {
  templateStore.exportItems(type);
}

// onMounted
onMounted(() => {
  templateStore.fetchList();
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
