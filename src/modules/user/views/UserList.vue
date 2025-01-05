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
        <VBtn prepend-icon="tabler-plus" color="primary" @click="openAddDialog">Add User</VBtn>

        <!-- Botones para acciones con seleccionados -->
        <VBtn color="error" v-if="userStore.selectedItems.length > 1" @click="deleteSelected">
          Eliminar seleccionados
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
import { useUserStore } from '@/modules/user/stores/userStore';
import debounce from 'lodash/debounce';


// Componentes internos
import UserFilters from '../components/UserFilters.vue';
import UserTable from '../components/UserTable.vue';
import UserAdd from './UserAdd.vue';
import UserDelete from './UserDelete.vue';
import UserEdit from './UserEdit.vue';

// Composable para manejar diálogos
const { openDialog, navigateTo } = useAppManager();

// Props para personalizar el título y descripción
const props = defineProps({
  title: {
    type: String,
    default: 'User Management',
  },
  description: {
    type: String,
    default: 'Manage your users with ease.',
  },
});

// Store
const userStore = useUserStore();

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
    action: () => exportSelected('excel'),
  },
  {
    text: 'Exportar a PDF',
    icon: 'tabler-file-type-pdf',
    action: () => exportSelected('pdf'),
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
  openDialog(UserAdd, { title: 'Add User' }, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      userStore.fetchList();
    }
  });
}

function openEditDialog(item: any) {
  openDialog(UserEdit, { item, title: 'Edit User' }, { width: '800px', persistent: true }).then((result) => {
    if (result === 'submit') {
      userStore.fetchList();
    }
  });
}

function openViewDialog(item: any) {
  navigateTo(`/users/${item.id}`);
}

function openDeleteDialog(item: any) {
  openDialog(UserDelete, { item, title: 'Delete User' }, { width: '900px', persistent: true }).then((result) => {
    if (result === 'submit') {
      userStore.fetchList();
    }
  });
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
