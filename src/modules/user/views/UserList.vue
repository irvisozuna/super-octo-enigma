<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">{{ title }}</h4>
      <p class="text-body-1 mb-4">{{ description }}</p>
    </VCardTitle>

    <!-- Filtros reutilizables -->
    <UserFilters :initial-filters="userStore.filters" @update:filters="applyFilters" />

    <VCardText>
      <div class="d-flex align-center flex-wrap gap-4 justify-end">
        <!-- Campo de búsqueda -->
        <VTextField v-model="userStore.filters.search" :label="$t('Search User')" variant="outlined" dense
          class="filter-field" @input="applyFilters" />

        <!-- Botón para exportar -->
        <GlobalMenu :label="$t('export')" :options="menuOptions" color="secondary" variant="tonal"
          icon="tabler-chevron-down" />

        <!-- Botón para agregar usuario -->
        <VBtn prepend-icon="tabler-plus" color="primary" @click="openAddDialog">{{ $t('add user') }}</VBtn>

        <!-- Botones para acciones con seleccionados -->
        <VBtn color="error" v-if="$can('write', 'users') && userStore.selectedItems.length > 1" @click="deleteSelected">
          {{ $t('delete selected') }}
        </VBtn>
      </div>
    </VCardText>

    <VDivider />

    <!-- Tabla de elementos -->
    <UserTable :headers="headers" :items="userStore.list" :total="userStore.total" :page="userStore.page"
      :items-per-page="userStore.itemsPerPage" :loading="userStore.isLoading" :selection="userStore.selectedItems"
      @update:selection="val => userStore.selectedItems = val" @update:page="onPageChange"
      @update:items-per-page="onItemsPerPageChange" @view="openViewDialog" @edit="openEditDialog"
      @delete="openDeleteDialog" />
  </VCard>
</template>

<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'users',
  },
})
import { useUserStore } from '@/modules/user/stores/userStore';
import debounce from 'lodash/debounce';


// Componentes internos
import { useI18n } from 'vue-i18n';
import UserFilters from '../components/UserFilters.vue';
import UserTable from '../components/UserTable.vue';
import UserAdd from './UserAdd.vue';
import UserDelete from './UserDelete.vue';
import UserEdit from './UserEdit.vue';

// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager();
const { t } = useI18n();

// Props para personalizar el título y descripción
const props = defineProps({
  title: {
    type: String,
    default: 'users management',
  },
  description: {
    type: String,
    default: 'manager your users with ease',
  },
});

// Store
const userStore = useUserStore();

// Headers para la tabla
const headers = [
  { title: t('name'), key: 'name' },
  { title: t('email'), key: 'email' },
  { title: t('role'), key: 'role' },
  { title: t('actionsText'), key: 'actions', sortable: false },
];

// Opciones del menú de exportación
const menuOptions = [
  {
    text: t('export to') + ' ' + 'Excel',
    icon: 'tabler-file-spreadsheet',
    action: () => exportItems('excel'),
  },
  {
    text: t('export to') + ' ' + 'PDF',
    icon: 'tabler-file-type-pdf',
    action: () => exportItems('pdf'),
  },
];

// Métodos
const debouncedFetchList = debounce(() => {
  userStore.fetchList();
}, 500);

function applyFilters(newFilters: any) {
  Object.assign(userStore.filters, newFilters);
  debouncedFetchList();
}

function onPageChange(newPage: number) {
  userStore.page = newPage;
  userStore.fetchList();
}

function onItemsPerPageChange(newItemsPerPage: number) {
  userStore.itemsPerPage = newItemsPerPage;
  userStore.fetchList();
}

function deleteSelected() {
  openDialog(UserDelete, {}, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      userStore.fetchList();
    }
  });
}



function openAddDialog() {
  openDialog(UserAdd, { title: '' }, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      userStore.fetchList();
    }
  });
}

function openEditDialog(item: any) {
  openDialog(UserEdit, { item, title: '' }, { width: '800px', persistent: true }).then((result) => {
    if (result === 'submit') {
      userStore.fetchList();
    }
  });
}

function openViewDialog(item: any) {
  navigateTo(`/users/${item.id}`);
}

function openDeleteDialog(item: any) {
  openDialog(UserDelete, { item, title: '' }, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      userStore.fetchList();
    }
  });
}

function exportItems(type: string) {
  userStore.exportItems(type);
}
// onMounted
onMounted(() => {
  userStore.fetchList();
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
