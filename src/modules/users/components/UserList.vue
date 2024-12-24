<!-- // src/modules/users/components/UserList.vue -->
<template>
  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">{{ title }}</h4>
      <p class="text-body-1 mb-4">{{ description }}</p>
    </VCardTitle>

    <VCardText>
      <!-- Filtros reutilizables -->
      <UserFilters
        :initial-filters="userStore.filters"
        @update:filters="applyFilters"
      />
      <!-- Botón para abrir el diálogo de agregar -->
      <VBtn color="primary" @click="openAddDialog">Add User</VBtn>

      <!-- Diálogos -->
      <UserAddDialog ref="addDialog" />
      <UserEditDialog ref="editDialog" />
      <UserViewDialog ref="viewDialog" />
      <UserDeleteDialog ref="deleteDialog" />

      <!-- Tabla de usuarios -->
      <UserTable
        :headers="headers"
        :items="userStore.list"
        :total="userStore.total"
        :page="userStore.page"
        :items-per-page="userStore.itemsPerPage"
        :loading="userStore.isLoading"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
        @view="openViewDialog"
        @edit="openEditDialog"
        @delete="openDeleteDialog"
      />
    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { useCrud } from '@/composables/useCrud';
import { useUserStore } from '@/modules/users/stores/userStore';
import { ref } from 'vue';

// Importa los componentes
import UserAddDialog from './UserAddDialog.vue';
import UserDeleteDialog from './UserDeleteDialog.vue';
import UserEditDialog from './UserEditDialog.vue';
import UserFilters from './UserFilters.vue';
import UserTable from './UserTable.vue';
import UserViewDialog from './UserViewDialog.vue';

// Props para personalizar el título y la descripción
const props = defineProps({
  title: {
    type: String,
    default: 'User Management',
  },
  description: {
    type: String,
    default: 'Manage your application users with ease.',
  },
});

// Instancia del store de usuarios
const userStore = useUserStore();

// Sincroniza el CRUD con el store
useCrud(userStore, { autoFetch: true });

// Cabeceras para la tabla
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Actions', key: 'actions', sortable: false },
];





// Referencias para los diálogos
const addDialog = ref();
const editDialog = ref();
const viewDialog = ref();
const deleteDialog = ref();

// Método para aplicar filtros
function applyFilters(newFilters: any) {
  userStore.filters = { ...newFilters };
  userStore.fetchList(); // Actualiza la lista con los filtros aplicados
}

// Métodos para manejar la paginación y otras acciones
function onPageChange(newPage: number) {
  userStore.page = newPage;
  userStore.fetchList(); // Actualiza la lista de usuarios
}

function onItemsPerPageChange(newItemsPerPage: number) {
  userStore.itemsPerPage = newItemsPerPage;
  userStore.fetchList(); // Actualiza la lista de usuarios
}

// Métodos para abrir los diálogos
function openAddDialog() {
  addDialog.value?.open();
}

function openEditDialog(user: any) {
  editDialog.value?.open(user);
}

function openViewDialog(user: any) {
  viewDialog.value?.open(user);
}

function openDeleteDialog(user: any) {
  deleteDialog.value?.open(user);
}
</script>
