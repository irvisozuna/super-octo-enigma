<template>

  <VCard>
    <VCardTitle>
      <h4 class="text-h4 mb-1">{{ title }}</h4>
      <p class="text-body-1 mb-4">{{ description }}</p>
    </VCardTitle>
    <!-- Filtros reutilizables -->
    <UserFilters :initial-filters="userStore.filters" @update:filters="applyFilters" />
    <VCardText>
      <!-- Botón para abrir el diálogo de agregar -->
      <div class=" d-flex align-center flex-wrap gap-4 justify-end">
        <!-- 👉 Search  -->
        <div style="inline-size: 15.625rem;">

          <!-- Campo de búsqueda -->
          <VTextField v-model="userStore.filters.search" label="Search User" variant="outlined" dense
            class="filter-field" @input="applyFilters" />
        </div>

        <!-- 👉 Export button -->
        <GlobalMenu :label="$t('export')" :options="menuOptions" color="secondary" variant="tonal"
          icon="tabler-chevron-down" />

        <!-- 👉 Add user button -->
        <VBtn prepend-icon="tabler-plus" color="primary" @click="openAddDialog">Add User</VBtn>
      </div>

    </VCardText>
    <VDivider />
    <!-- Tabla de elementos -->
    <UserTable :headers="headers" :items="userStore.list" :total="userStore.total" :page="userStore.page"
      :items-per-page="userStore.itemsPerPage" :loading="userStore.isLoading" @update:page="onPageChange"
      @update:items-per-page="onItemsPerPageChange" @view="openViewDialog" @edit="openEditDialog"
      @delete="openDeleteDialog" />
  </VCard>
</template>

<script setup lang="ts">
import { useAppManager } from '@/composables/useAppManager';
import { useCrud } from '@/composables/useCrud';
import { useUserStore } from '@/modules/user/stores/userStore';
import debounce from 'lodash/debounce';

// Importa los componentes
import UserFilters from '../components/UserFilters.vue';
import UserTable from '../components/UserTable.vue';
import UserAdd from './UserAdd.vue';
import UserDelete from './UserDelete.vue';
import UserEdit from './UserEdit.vue';


const { openDialog, closeDialog, getDialogHistory, navigateTo, onDialogOpened, onDialogClosed } =
  useAppManager();

// Props para personalizar el título y la descripción
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



// Instancia del store
const userStore = useUserStore();

// Sincroniza el CRUD con el store
useCrud(userStore, { autoFetch: false });

// Cabeceras para la tabla
const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'role' },
  { title: 'Actions', key: 'actions', sortable: false },
];

const menuOptions = [
  {
    text: 'Exportar a Excel',
    icon: 'tabler-file-spreadsheet',
    actionType: 'api',
    payload: { url: '/api/users?export=excel', method: 'POST', data: { type: 'user' } },
  },
  {
    text: 'Exportar a PDF',
    icon: 'tabler-file-type-pdf',
    actionType: 'api',
    payload: { url: '/api/users?export=pdf', method: 'POST', data: { type: 'user' } },
  }
];

// Función para manejar el debounce

const debouncedFetchList = debounce(() => {
  userStore.fetchList();
}, 500);

// Método para aplicar filtros
function applyFilters(newFilters: any) {
  Object.assign(userStore.filters, newFilters); // Actualizar solo las propiedades específicas
  debouncedFetchList(); // Aplicar los filtros con debounce para evitar múltiples llamadas
}

// Métodos para manejar la paginación y otras acciones
function onPageChange(newPage: number) {
  userStore.page = newPage;
  userStore.fetchList(); // Actualiza la lista
}

function onItemsPerPageChange(newItemsPerPage: number) {
  userStore.itemsPerPage = newItemsPerPage;
  userStore.fetchList(); // Actualiza la lista
}

// Métodos para abrir los diálogos
function openAddDialog() {
  openDialog(UserAdd, {}, { width: '900px', persistent: true });
}

async function openEditDialog(item: any) {
  const result = await openDialog(UserEdit, { item }, { width: '800px' });
  if (result === 'submit') {
    console.log('Cambios guardados');
    // Refrescar la lista o realizar otra acción
  } else {
    console.log('Edición cancelada');
  }
}


function openViewDialog(item: any) {
  navigateTo(`/users/${item.id}`);
}

function openDeleteDialog(item: any) {
  openDialog(UserDelete, { item }, { width: '900px', persistent: true });
}


//Generame el onMounted
onMounted(() => {
  userStore.fetchList(); // Carga la lista de useros
});

// Escucha eventos globales
onDialogOpened((options) => {
  console.log('Diálogo abierto:', options);
});

onDialogClosed((options) => {
  console.log('Diálogo cerrado:', options);
});
</script>

<style scoped>
.buttons-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  /* Inclina los filtros hacia la derecha */
  gap: 1rem;
}

.filter-field {
  flex: 1;

  /* Hace que los campos sean del mismo tamaño dinámicamente */
  max-inline-size: 300px;

  /* Limita el ancho máximo de los campos */
}
</style>
