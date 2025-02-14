<template>
      <DialogCloseBtn @click="close" />
  <VCard class="pa-sm-10 pa-2">
    <VCardText>
      <!-- Título -->
      <h4 class="text-h4 text-center mb-2">{{ t('advanceSearch') }}</h4>
      <p class="text-body-1 text-center mb-6">{{ t('advanceSearchDescription') }}</p>
      
        <!-- Campo de búsqueda -->
        <VTextField
        v-model="searchQuery"
        :label="t('search.search')"
        variant="outlined"
        dense
        class="mb-6"
        @input="onSearchInput"
        append-inner-icon="tabler-search"
      />
      <!-- Tabla de contratos -->
      <BaseTable
    v-if="!loading"
    :headers="headers"
    :items="contracts"
    :total="pagination.total"
    :page="pagination.offset / pagination.limit + 1"
    :items-per-page="pagination.limit"
    :loading="loading"
    v-model:selection="selectedContract"
    @update:page="updatePage"
    @update:items-per-page="updateItemsPerPage"
  >
      <!-- Sobrescribir el slot de acciones -->
      <template #actions="{ item }">
        <VBtn
          color="primary"
          variant="text"
          @click="selectContract(item)"
        >
          {{ t('select') }}
        </VBtn>
      </template>
      </BaseTable>

      <!-- Estado de carga -->
      <div v-if="loading" class="text-center py-6">
        <VProgressCircular indeterminate color="primary" />
        <p class="mt-2">{{ t('loading') }}...</p>
      </div>

    </VCardText>
  </VCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppManager } from '@/composables/useAppManager';
import { useContractStore } from '@/modules/support/stores/contractStore';
import BaseTable from '@/components/BaseTable.vue'; // Asegúrate de importar correctamente tu componente BaseTable

const { t } = useI18n();
const { closeDialog } = useAppManager();
const contractStore = useContractStore();

const supportTitle = t('support');
const contracts = ref([]); // Inicialmente sin datos
const loading = ref(true); // Estado de carga activado al inicio
const selectedContract = ref(null);
const searchQuery = ref(''); 
const pagination = ref({
  limit: 10,
  offset: 0,
  count: 0,
  total: 0,
});

// Encabezados de la tabla
const headers = [
  { title: t('id'), value: 'id_account' },
  { title: t('measurer'), value: 'measurer' },
  { title: t('name'), value: 'nameuser' },
  { title: t('address'), value: 'address' },
  { title: t('neighborhood'), value: 'neighborhood' },
  { title: t('origin'), value: 'c_system' },
  // { title: t('status'), value: 'status' },
  { title: t('actionslabel'), value: 'actions', align: 'center' },
];

// Función para manejar la selección de un contrato
function handleSelection(selection) {
  selectedContract.value = selection[0]; // Solo permitimos seleccionar un contrato a la vez
}

// Función para seleccionar un contrato y cerrar el diálogo
async function selectContract(contract) {
  try {
    //Mostrar un loading mientras se selecciona el contrato
    loading.value = true;
    await contractStore.getContract(contract.id_account); // Ejecutar la acción del store con el ID del contrato
    closeDialog('submit'); // Cerrar el diálogo después de la selección
  } catch (error) {
    console.error('Error al seleccionar el contrato:', error);
  }
}

// Función para cerrar el diálogo
function close(result: 'close' | 'submit' | 'cancel' = 'close') {
  closeDialog(result);
}

// Función para actualizar la página
function updatePage(newPage: number) {
  pagination.value.page = newPage;
  fetchData();
}

// Función para actualizar los elementos por página
function updateItemsPerPage(newItemsPerPage: number) {
  pagination.value.limit = newItemsPerPage;
  fetchData();
}

// Función para reemplazar valores null por una cadena vacía
function replaceNullWithEmptyString(data: any[]) {
  return data.map(item => {
    const newItem = { ...item };
    for (const key in newItem) {
      if (newItem[key] === null) {
        newItem[key] = '';
      }
    }
    return newItem;
  });
}
// Función para manejar la entrada de búsqueda
function onSearchInput() {
  // Reiniciar la paginación al realizar una nueva búsqueda
  pagination.value.offset = 0;
  pagination.value.search = searchQuery.value;
  fetchData();
}

// Cargar los contratos al montar el componente
onMounted(fetchData);

async function fetchData() {
  loading.value = true;
  try {
    const response = await contractStore.getContracts(pagination.value);
    contracts.value = replaceNullWithEmptyString(response.data); // Reemplazar null por ''
    pagination.value = response.pagination;
  } catch (error) {
    console.error('Error al cargar los contratos:', error);
  } finally {
    loading.value = false;
  }
}
</script>
